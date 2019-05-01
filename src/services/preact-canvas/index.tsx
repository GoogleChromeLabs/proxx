/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import workerURL from "chunk-name:../../worker.js";
import { Component, h, VNode } from "preact";
import { PlayMode } from "src/gamelogic/types";
import { bind } from "src/utils/bind";
import toRGB from "src/utils/to-rgb";
import { prerender } from "../../utils/constants";
import { isFeaturePhone } from "../../utils/static-display";
import localStateSubscribe from "../state/local-state-subscribe.js";
import BottomBar from "./components/bottom-bar";
import deferred from "./components/deferred";
import GameLoading from "./components/game-loading";
import Intro from "./components/intro/index.js";
import { game as gameClassName, nebulaContainer } from "./style.css";

type Color = import("src/rendering/constants").Color;
type GameStateChange = import("../../gamelogic").StateChange;
type GameType = import("../state").GameType;

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

let lazyImport: typeof import("./lazy-load") | undefined;
const lazyImportReady = import("./lazy-load").then(m => (lazyImport = m));
const lazyComponents: Promise<typeof import("./lazy-components")> = new Promise(
  resolve => {
    // Prevent component CSS loading in prerender mode
    if (!prerender) {
      const lazyComponentImport = import("./lazy-components");
      resolve(lazyImportReady.then(() => lazyComponentImport));
    }
  }
);

const stateServicePromise: Promise<
  import("comlink/src/comlink").Remote<import("../state").default>
> = (async () => {
  const worker = new Worker(workerURL);
  await lazyImportReady;
  const nextMessageEvent = lazyImport!.nextEvent(worker, "message");
  worker.postMessage("ready?");
  await nextMessageEvent;

  // iOS Safari seems to kill a worker that doesn't receive messages after a while. So we prevent
  // that by sending dummy keep-alive messages.
  setInterval(() => {
    worker.postMessage("");
  }, 3000);

  const remoteServices = lazyImport!.comlinkWrap(
    worker
  ) as import("comlink/src/comlink").Remote<
    import("src/worker").RemoteServices
  >;
  return remoteServices.stateService;
})();

const nebulaDangerDark: Color = [53, 0, 0];
const nebulaDangerLight: Color = [117, 32, 61];
const nebulaSafeDark: Color = [58, 10, 78];
const nebulaSafeLight: Color = [43, 41, 111];
const nebulaSettingDark: Color = [0, 0, 0];
const nebulaSettingLight: Color = [41, 41, 41];

// If the user tries to start a game when we aren't ready, how long do we wait before showing the
// loading screen?
const loadingScreenTimeout = 1000;

export interface GridType {
  width: number;
  height: number;
  mines: number;
}

interface Props {}

interface State {
  game?: GameType;
  gridDefaults?: GridType;
  bestTime?: number;
  dangerMode: boolean;
  awaitingGame: boolean;
  settingsOpen: boolean;
  motionPreference: boolean;
  gameInPlay: boolean;
}

export type GameChangeCallback = (stateChange: GameStateChange) => void;

// tslint:disable-next-line:variable-name
const NebulaDeferred = deferred(lazyComponents.then(m => m.Nebula));
// tslint:disable-next-line:variable-name
const GameDeferred = deferred(lazyComponents.then(m => m.Game));
// tslint:disable-next-line:variable-name
const SettingsDeferred = deferred(lazyComponents.then(m => m.Settings));

const texturePromise = lazyImportReady.then(() =>
  lazyImport!.lazyGenerateTextures()
);

const gamePerquisites = texturePromise;
const immedateGameSessionKey = "instantGame";

export default class Root extends Component<Props, State> {
  state: State = {
    dangerMode: false,
    awaitingGame: false,
    settingsOpen: false,
    motionPreference: true,
    gameInPlay: false
  };
  private previousFocus: HTMLElement | null = null;

  private _gameChangeSubscribers = new Set<GameChangeCallback>();
  private _awaitingGameTimeout: number = -1;
  private _stateService?: import("comlink/src/comlink").Remote<
    import("../state").default
  >;

  constructor() {
    super();

    lazyImportReady.then(async () => {
      lazyImport!.initOffline();
      const shouldUseMotionPromise = lazyImport!.shouldUseMotion();
      const gridDefaultPromise = lazyImport!.getGridDefault();

      this.setState({
        motionPreference: await shouldUseMotionPromise,
        gridDefaults: await gridDefaultPromise
      });
    });

    // Is this the reload after an update?
    const instantGameDataStr = sessionStorage.getItem(immedateGameSessionKey);

    if (instantGameDataStr) {
      sessionStorage.removeItem(immedateGameSessionKey);
      this.setState({ awaitingGame: true });
    }

    stateServicePromise.then(async stateService => {
      this._stateService = stateService;

      localStateSubscribe(this._stateService, async stateChange => {
        await lazyImportReady;

        if ("game" in stateChange) {
          const game = stateChange.game;

          if (game) {
            clearTimeout(this._awaitingGameTimeout);
            lazyImport!.setGridDefault(game.width, game.height, game.mines);
            this.setState({
              game,
              awaitingGame: false,
              gridDefaults: game,
              gameInPlay: true,
              bestTime: await lazyImport!.getBestTime(
                game.width,
                game.height,
                game.mines
              )
            });
          } else {
            this.setState({ game, gameInPlay: false });
          }
        }
        if ("gameStateChange" in stateChange) {
          const playMode = stateChange.gameStateChange!.playMode;

          if (playMode === PlayMode.Lost || playMode === PlayMode.Won) {
            this.setState({ gameInPlay: false });
          }
          for (const callback of this._gameChangeSubscribers) {
            callback(stateChange.gameStateChange!);
          }
        }
      });

      if (instantGameDataStr) {
        await gamePerquisites;
        const { width, height, mines } = JSON.parse(instantGameDataStr) as {
          width: number;
          height: number;
          mines: number;
        };

        this._stateService.initGame(width, height, mines);
      }
    });
  }

  render(
    _: Props,
    {
      game,
      dangerMode,
      awaitingGame,
      gridDefaults,
      settingsOpen,
      motionPreference,
      gameInPlay,
      bestTime
    }: State
  ) {
    let mainComponent: VNode;

    if (!game) {
      if (awaitingGame) {
        mainComponent = <GameLoading />;
      } else {
        mainComponent = settingsOpen ? (
          <SettingsDeferred
            loading={() => <div />}
            // tslint:disable-next-line: variable-name
            loaded={Settings => (
              <Settings
                onCloseClicked={this._onSettingsCloseClick}
                motion={motionPreference}
                onMotionPrefChange={this._onMotionPrefChange}
                disableAnimationBtn={
                  !lazyImport!.supportsSufficientWebGL || isFeaturePhone
                }
                texturePromise={texturePromise}
              />
            )}
          />
        ) : (
          <Intro
            onStartGame={this._onStartGame}
            defaults={prerender ? undefined : gridDefaults}
          />
        );
      }
    } else {
      mainComponent = (
        <GameDeferred
          loading={() => <div />}
          // tslint:disable-next-line: variable-name
          loaded={Game => (
            <Game
              key={game.id}
              width={game.width}
              height={game.height}
              mines={game.mines}
              toRevealTotal={game.toRevealTotal}
              gameChangeSubscribe={this._onGameChangeSubscribe}
              gameChangeUnsubscribe={this._onGameChangeUnsubscribe}
              stateService={this._stateService!}
              dangerMode={dangerMode}
              onDangerModeChange={this._onDangerModeChange}
              useMotion={motionPreference}
              bestTime={bestTime}
            />
          )}
        />
      );
    }

    return (
      <div class={gameClassName}>
        <div
          class={nebulaContainer}
          style={`background: linear-gradient(to bottom, ${toRGB(
            nebulaSafeLight
          )}, ${toRGB(nebulaSafeDark)})`}
        >
          <NebulaDeferred
            loading={() => <div />}
            // tslint:disable-next-line: variable-name
            loaded={Nebula => (
              <Nebula
                colorDark={this._nebulaDarkColor()}
                colorLight={this._nebulaLightColor()}
                useMotion={motionPreference}
              />
            )}
          />
        </div>
        {mainComponent}
        <BottomBar
          onSettingsClick={this._onSettingsClick}
          onBackClick={this._onBackClick}
          onDangerModeChange={this._onDangerModeChange}
          buttonType={game ? "back" : "info"}
          display={!settingsOpen} // Settings is open = Bottom bar display should be hidden
          dangerMode={dangerMode}
          showDangerModeToggle={gameInPlay}
        />
      </div>
    );
  }

  private _nebulaLightColor() {
    if (this.state.settingsOpen) {
      return nebulaSettingLight;
    }
    if (this.state.dangerMode) {
      return nebulaDangerLight;
    }
    return nebulaSafeLight;
  }

  private _nebulaDarkColor() {
    if (this.state.settingsOpen) {
      return nebulaSettingDark;
    }
    if (this.state.dangerMode) {
      return nebulaDangerDark;
    }
    return nebulaSafeDark;
  }

  @bind
  private async _onMotionPrefChange() {
    const motionPreference = !this.state.motionPreference;
    this.setState({ motionPreference });
    const { setMotionPreference } = await lazyImportReady;
    setMotionPreference(motionPreference);
  }

  @bind
  private _onDangerModeChange(dangerMode: boolean) {
    this.setState({ dangerMode });
  }

  @bind
  private _onGameChangeSubscribe(func: GameChangeCallback) {
    this._gameChangeSubscribers.add(func);
  }

  @bind
  private _onGameChangeUnsubscribe(func: GameChangeCallback) {
    this._gameChangeSubscribers.delete(func);
  }

  @bind
  private _onSettingsCloseClick() {
    this.setState({ settingsOpen: false });
    this.previousFocus!.focus();
  }

  @bind
  private _onSettingsClick() {
    this.previousFocus = document.activeElement as HTMLElement;
    this.setState({ settingsOpen: true });
  }

  @bind
  private async _onStartGame(width: number, height: number, mines: number) {
    this._awaitingGameTimeout = setTimeout(() => {
      this.setState({ awaitingGame: true });
    }, loadingScreenTimeout);

    const { updateReady, skipWaiting } = await lazyImportReady;

    if (updateReady) {
      // There's an update available. Let's load it as part of starting the game…
      await skipWaiting();

      sessionStorage.setItem(
        immedateGameSessionKey,
        JSON.stringify({ width, height, mines })
      );

      location.reload();
      return;
    }

    // Wait for everything to be ready:
    await gamePerquisites;
    const stateService = await stateServicePromise;
    stateService.initGame(width, height, mines);
  }

  @bind
  private _onBackClick() {
    this.setState({ dangerMode: false });
    this._stateService!.reset();
  }
}
