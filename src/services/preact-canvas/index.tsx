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

import { Remote } from "comlink/src/comlink.js";
import { Component, ComponentConstructor, h, render, VNode } from "preact";
import { PlayMode } from "src/gamelogic/types";
import {
  Color,
  nebulaDangerDark,
  nebulaDangerLight,
  nebulaSafeDark,
  nebulaSafeLight,
  nebulaSettingDark,
  nebulaSettingLight,
  toRGB
} from "src/rendering/constants";
import { bind } from "src/utils/bind.js";
import { StateChange as GameStateChange } from "../../gamelogic";
import { deviceMotionCapable, shouldUseMotion } from "../../rendering/renderer";
import { prerender } from "../../utils/constants";
import { GameType } from "../state";
import { getGridDefault, setGridDefault } from "../state/grid-default";
import StateService from "../state/index.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import { setMotionPreference } from "../state/motion-preference";
import BottomBar from "./components/bottom-bar";
import deferred from "./components/deferred";
import GameLoading from "./components/game-loading";
import Intro from "./components/intro/index.js";
import { nebulaContainer as nebulaContainerStyle } from "./components/nebula/style.css";
import { game as gameClassName, main } from "./style.css";

// If the user tries to start a game when we aren't ready, how long do we wait before showing the
// loading screen?
const loadingScreenTimeout = 1000;

export interface GridType {
  width: number;
  height: number;
  mines: number;
}

interface Props {
  stateServicePromise: Promise<Remote<StateService>>;
}

interface State {
  game?: GameType;
  gridDefaults?: GridType;
  dangerMode: boolean;
  awaitingGame: boolean;
  settingsOpen: boolean;
  motionPreference: boolean;
  gameInPlay: boolean;
}

export type GameChangeCallback = (stateChange: GameStateChange) => void;

// These component imports are prevented in 'prerender' mode as they dump CSS onto the page.
// tslint:disable-next-line:variable-name
const Nebula = deferred(
  prerender
    ? (new Promise(() => 0) as Promise<ComponentConstructor<any, any>>)
    : import("./components/nebula/index.js").then(m => m.default)
);

// tslint:disable-next-line:variable-name
const Game = deferred(
  prerender
    ? (new Promise(() => 0) as Promise<ComponentConstructor<any, any>>)
    : import("./components/game/index.js").then(m => m.default)
);

const offlineModulePromise = import("../../offline");

// tslint:disable-next-line:variable-name
const Settings = deferred(
  import("./components/settings/index.js").then(m => m.default)
);

const texturePromise = import("../../rendering/animation").then(m =>
  m.lazyGenerateTextures()
);

const gamePerquisites = texturePromise;
const gridDefaultPromise = getGridDefault();
const immedateGameSessionKey = "instantGame";

class PreactService extends Component<Props, State> {
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
  private _stateService?: Remote<StateService>;

  constructor(props: Props) {
    super(props);
    this._init(props);
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
      gameInPlay
    }: State
  ) {
    let mainComponent: VNode;

    if (!game) {
      if (awaitingGame) {
        mainComponent = <GameLoading />;
      } else {
        mainComponent = settingsOpen ? (
          <Settings
            loading={() => <div />}
            onCloseClicked={this._onSettingsCloseClick}
            motion={motionPreference}
            onMotionPrefChange={this._onMotionPrefChange}
            disableAnimationBtn={!deviceMotionCapable}
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
        <Game
          loading={() => <div />}
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
          useMotion={this.state.motionPreference}
        />
      );
    }

    return (
      <div class={gameClassName}>
        <Nebula
          loading={() => (
            <div
              class={nebulaContainerStyle}
              style={`background: linear-gradient(to bottom, ${toRGB(
                nebulaSafeLight
              )}, ${toRGB(nebulaSafeDark)})`}
            />
          )}
          colorDark={this._nebulaDarkColor()}
          colorLight={this._nebulaLightColor()}
          useMotion={this.state.motionPreference}
        />
        {mainComponent}
        <BottomBar
          onSettingsClick={this._onSettingsClick}
          onBackClick={this._onBackClick}
          onDangerModeChange={this._onDangerModeChange}
          buttonType={game ? "back" : "settings"}
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
    await setMotionPreference(motionPreference);
    this.setState({ motionPreference });
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
    const { updateReady, skipWaiting } = await offlineModulePromise;

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

    this._awaitingGameTimeout = setTimeout(() => {
      this.setState({ awaitingGame: true });
    }, loadingScreenTimeout);

    // Wait for everything to be ready:
    await gamePerquisites;
    const stateService = await this.props.stateServicePromise;
    stateService.initGame(width, height, mines);
  }

  @bind
  private _onBackClick() {
    this.setState({ dangerMode: false });
    this._stateService!.reset();
  }

  private async _init({ stateServicePromise }: Props) {
    gridDefaultPromise.then(gridDefaults => {
      this.setState({ gridDefaults });
    });

    // Is this the reload after an update?
    const instantGameDataStr = sessionStorage.getItem(immedateGameSessionKey);

    if (instantGameDataStr) {
      sessionStorage.removeItem(immedateGameSessionKey);
      this.setState({ awaitingGame: true });
    }

    offlineModulePromise.then(({ init }) => init());

    this._stateService = await stateServicePromise;

    const motionPreference = await shouldUseMotion();
    this.setState({ motionPreference });

    localStateSubscribe(this._stateService, stateChange => {
      if ("game" in stateChange) {
        const game = stateChange.game;

        if (game) {
          clearTimeout(this._awaitingGameTimeout);
          setGridDefault(game.width, game.height, game.mines);
          this.setState({
            game,
            awaitingGame: false,
            gridDefaults: game,
            gameInPlay: true
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
  }
}

export async function game(stateService: Promise<Remote<StateService>>) {
  const container = document.body.querySelector("main")!;
  container.classList.add(main);
  render(
    <PreactService stateServicePromise={stateService} />,
    container,
    container.firstChild as any
  );
  performance.mark("UI ready");
}
