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
import { StateChange as GameStateChange } from "../../gamelogic";
import { GameType } from "../state";
import StateService from "../state/index.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import deferred from "./components/deferred";
import Intro from "./components/intro/index.js";
import Nebula from "./components/nebula/index.js";
import Settings from "./components/settings";
import { game as gameClassName, main } from "./style.css";

interface Props {
  stateServicePromise: Promise<Remote<StateService>>;
}

interface State {
  game?: GameType;
  stateService?: Remote<StateService>;
  dangerMode: boolean;
}

export type GameChangeCallback = (stateChange: GameStateChange) => void;

// tslint:disable-next-line:variable-name
const Game = deferred(
  import("./components/game/index.js").then(m => m.default)
);

class PreactService extends Component<Props, State> {
  state: State = {
    dangerMode: false
  };

  private _gameChangeSubscribers = new Set<GameChangeCallback>();

  constructor(props: Props) {
    super(props);
    this._init(props);
  }

  render(_props: Props, { game, stateService, dangerMode }: State) {
    let mainComponent: VNode;

    if (!game) {
      mainComponent = (
        <Intro onStartGame={this._onStartGame} spinner={!stateService} />
      );
    } else {
      mainComponent = (
        <Game
          loading={() => <div />}
          width={game.width}
          height={game.height}
          gameChangeSubscribe={this._onGameChangeSubscribe}
          gameChangeUnsubscribe={this._onGameChangeUnsubscribe}
          stateService={stateService!}
          onDangerModeChange={this._onAltChange}
        />
      );
    }

    return (
      <div class={gameClassName}>
        <Nebula dangerMode={dangerMode} />
        {mainComponent}
        <Settings onFullscreenClick={this._onFullscreenClick} />
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
      this.setState({ dangerMode: !this.state.dangerMode });
    }
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (event.key === "Shift") {
      this.setState({ dangerMode: !this.state.dangerMode });
    }
  }

  @bind
  private _onAltChange(dangerMode: boolean) {
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
