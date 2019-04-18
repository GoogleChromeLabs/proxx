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
import { Component, h, render, VNode } from "preact";
import { bind } from "src/utils/bind.js";
import {
  staticScreenHeight,
  staticScreenWidth
} from "src/utils/static-screensize";
import { StateChange as GameStateChange } from "../../gamelogic";
import { GameType } from "../state";
import StateService from "../state/index.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import BottomBar from "./components/bottom-bar";
import deferred from "./components/deferred";
import Intro from "./components/intro/index.js";
import { game as gameClassName, main } from "./style.css";

interface Props {
  stateServicePromise: Promise<Remote<StateService>>;
}

interface State {
  game?: GameType;
  stateService?: Remote<StateService>;
  dangerMode: boolean;
  texturesReady: boolean;
}

export type GameChangeCallback = (stateChange: GameStateChange) => void;

// tslint:disable-next-line:variable-name
const Nebula = deferred(
  import("./components/nebula/index.js").then(m => m.default)
);

// tslint:disable-next-line:variable-name
const Game = deferred(
  import("./components/game/index.js").then(m => m.default)
);

const texturePromise = import("../../rendering/animation").then(m =>
  m.lazyGenerateTextures()
);

class PreactService extends Component<Props, State> {
  state: State = {
    dangerMode: false,
    texturesReady: false
  };

  private _gameChangeSubscribers = new Set<GameChangeCallback>();

  constructor(props: Props) {
    super(props);
    this._init(props);
  }

  render(
    _props: Props,
    { game, stateService, dangerMode, texturesReady }: State
  ) {
    let mainComponent: VNode;

    if (!game) {
      mainComponent = (
        <Intro
          onStartGame={this._onStartGame}
          loading={!stateService || !texturesReady}
        />
      );
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
          stateService={stateService!}
          dangerMode={dangerMode}
          onDangerModeChange={this._onDangerModeChange}
          qvga={
            Math.min(staticScreenWidth, staticScreenHeight) <= 240
              ? true
              : false
          }
        />
      );
    }

    return (
      <div class={gameClassName}>
        <Nebula
          loading={() => <div />}
          dangerMode={game ? dangerMode : false}
        />
        {mainComponent}
        <BottomBar onFullscreenClick={this._onFullscreenClick} />
      </div>
    );
  }

  componentDidMount() {
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);
  }

  @bind
  private _onKeyDown(event: KeyboardEvent) {
    if (event.key === "Shift") {
      this._onDangerModeChange(!this.state.dangerMode);
    }
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (event.key === "Shift" || event.key === "*") {
      this._onDangerModeChange(!this.state.dangerMode);
    }
    if (event.key === "#") {
      // show setting page (TBD)
    }

    // For T9 navigation
    if (
      event.key === "9" ||
      event.key === "7" ||
      event.key === "5" ||
      event.key === "0"
    ) {
      // when this is called, it means table don't have focus.
      // send signal down to Game to focus on a cell
    }
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
  private _onFullscreenClick() {
    document.documentElement.requestFullscreen();
  }

  @bind
  private _onStartGame(width: number, height: number, mines: number) {
    this.state.stateService!.initGame(width, height, mines);
  }

  private async _init(props: Props) {
    texturePromise.then(() => {
      this.setState({ texturesReady: true });
    });

    const stateService = await props.stateServicePromise;
    this.setState({ stateService });

    localStateSubscribe(stateService, stateChange => {
      if ("game" in stateChange) {
        this.setState({ game: stateChange.game });
      }
      if ("gameStateChange" in stateChange) {
        for (const callback of this._gameChangeSubscribers) {
          callback(stateChange.gameStateChange!);
        }
      }
    });
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
