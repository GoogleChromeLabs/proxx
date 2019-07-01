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
import workerURL from "chunk-name:./../../../worker";
import nebulaSafeDark from "consts:nebulaSafeDark";
import prerender from "consts:prerender";
import { Component, h, VNode } from "preact";
import toRGB from "src/main/utils/to-rgb";
import { bind } from "src/utils/bind";
import { PlayMode } from "src/worker/gamelogic/types";
import { isFeaturePhone } from "../../utils/static-display";
import { getGridDefault, setGridDefault } from "../state/grid-default";
import localStateSubscribe from "../state/local-state-subscribe";
import BottomBar from "./components/bottom-bar";
import deferred from "./components/deferred";
import GameLoading from "./components/game-loading";
import Intro from "./components/intro";
import * as lc from "./lazy-components";
import * as lazyImport from "./lazy-load";
import { game as gameClassName, nebulaContainer } from "./style.css";

type Color = import("src/main/rendering/constants").Color;
type GameStateChange = import("../../../worker/gamelogic").StateChange;
type GameType = import("../../../worker/state-service").GameType;

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

const lazyImportReady = Promise.resolve(lazyImport);
const lazyComponents = Promise.resolve(lc);

type StateService = import("comlink/src/comlink").Remote<
  import("src/worker/state-service").default
>;

const stateServicePromise: Promise<StateService> = (async () => {
  // We don't need the worker if we're prerendering
  if (prerender) {
    // tslint:disable-next-line: no-empty
    return new Promise(() => {});
  }

  // The timing of events here is super buggy on iOS, so we need to tread very carefully.
  const worker = new Worker(workerURL);
  // @ts-ignore - iOS Safari seems to wrongly GC the worker. Throwing it to the global to prevent
  // that happening.
  self.w = worker;
  await lazyImportReady;

  // When we get a message back from our worker, we know we're ready.
  const nextMessageEvent = lazyImport!.nextEvent(worker, "message");
  worker.postMessage("ready?");

  await nextMessageEvent;

  const remoteServices = lazyImport!.comlinkWrap(
    worker
  ) as import("comlink/src/comlink").Remote<
    import("src/worker").RemoteServices
  >;

  return remoteServices.stateService;
})() as any;

const nebulaDangerDark: Color = [40, 0, 0];
const nebulaDangerLight: Color = [131, 23, 71];
// Looking for nebulaSafeDark? It's defined in lib/nebula-safe-dark.js
const nebulaSafeLight: Color = [54, 49, 176];
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
  allowIntroAnim: boolean;
  vibrationPreference: boolean;
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
    gameInPlay: false,
    allowIntroAnim: true,
    vibrationPreference: true
  };
  private previousFocus: HTMLElement | null = null;

  private _gameChangeSubscribers = new Set<GameChangeCallback>();
  private _awaitingGameTimeout: number = -1;
  private _stateService?: StateService;

  constructor() {
    super();

    getGridDefault().then(gridDefaults => {
      this.setState({ gridDefaults });
    });

    lazyImportReady.then(async () => {
      lazyImport!.initOffline();

      this.setState({
        motionPreference: await lazyImport!.shouldUseMotion(),
        vibrationPreference: await lazyImport!.getVibrationPreference()
      });
    });

    // Is this the reload after an update?
    const instantGameDataStr = prerender
      ? false
      : sessionStorage.getItem(immedateGameSessionKey);

    if (instantGameDataStr) {
      sessionStorage.removeItem(immedateGameSessionKey);
      this.setState({ awaitingGame: true });
    }

    stateServicePromise.then(async stateService => {
      this._stateService = stateService;

      await localStateSubscribe(this._stateService, async stateChange => {
        await lazyImportReady;

        if ("game" in stateChange) {
          const game = stateChange.game;

          if (game) {
            clearTimeout(this._awaitingGameTimeout);
            setGridDefault(game.width, game.height, game.mines);
            this.setState({
              game,
              awaitingGame: false,
              gridDefaults: game,
              gameInPlay: true,
              bestTime: await lazyImport!.getBestTime(
                game.width,
                game.height,
                game.mines
              ),
              allowIntroAnim: false
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
        const { width, height, mines, usedKeyboard } = JSON.parse(
          instantGameDataStr
        ) as {
          width: number;
          height: number;
          mines: number;
          usedKeyboard: boolean;
        };

        if (!usedKeyboard) {
          // This is a horrible hack to tell focus-visible.js not to initially show focus styles.
          document.body.dispatchEvent(
            new MouseEvent("mousemove", { bubbles: true })
          );
        }

        this._stateService.initGame(width, height, mines);
      }
    });
  }

  componentDidMount() {
    if (prerender) {
      prerenderDone();
    }
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
      bestTime,
      allowIntroAnim,
      vibrationPreference
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
                supportsSufficientWebGL={lazyImport!.supportsSufficientWebGL}
                texturePromise={texturePromise}
                useVibration={vibrationPreference}
                onVibrationPrefChange={this._onVibrationPrefChange}
              />
            )}
          />
        ) : (
          <Intro
            onStartGame={this._onStartGame}
            defaults={prerender ? undefined : gridDefaults}
            motion={motionPreference && allowIntroAnim}
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
              useVibration={vibrationPreference}
            />
          )}
        />
      );
    }

    return (
      <div class={gameClassName}>
        <NebulaDeferred
          loading={() => (
            <div
              class={nebulaContainer}
              style={{
                background: `linear-gradient(to bottom, ${toRGB(
                  nebulaSafeLight
                )}, ${toRGB(nebulaSafeDark)})`
              }}
            />
          )}
          // tslint:disable-next-line: variable-name
          loaded={Nebula => (
            <Nebula
              colorDark={this._nebulaDarkColor()}
              colorLight={this._nebulaLightColor()}
              useMotion={motionPreference}
            />
          )}
        />
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
    if (!this.state.game) {
      return nebulaSafeLight;
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
    if (!this.state.game) {
      return nebulaSafeDark;
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
  private async _onVibrationPrefChange() {
    const vibrationPreference = !this.state.vibrationPreference;
    this.setState({ vibrationPreference });
    const { setVibrationPreference } = await lazyImportReady;
    setVibrationPreference(vibrationPreference);
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
    this.setState({ settingsOpen: false }, () => {
      this.previousFocus!.focus();
    });
  }

  @bind
  private _onSettingsClick() {
    this.previousFocus = document.activeElement as HTMLElement;
    this.setState({ settingsOpen: true, allowIntroAnim: false });
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

      // Did the user click the start button using keyboard?
      const usedKeyboard = !!document.querySelector(".focus-visible");

      sessionStorage.setItem(
        immedateGameSessionKey,
        JSON.stringify({ width, height, mines, usedKeyboard })
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
