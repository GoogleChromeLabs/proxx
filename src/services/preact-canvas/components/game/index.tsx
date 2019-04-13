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
import { Remote } from "comlink/src/comlink";
import { Component, h } from "preact";
import StateService from "src/services/state";
import { bind } from "src/utils/bind";
import { game, GameChangeCallback } from "../..";
import { StateChange } from "../../../../gamelogic";
import { Cell, PlayMode } from "../../../../gamelogic/types";
import Board from "../board";
import deferred from "../deferred";
import { checkbox, game as gameClass, toggle, toggleLabel } from "./style.css";

export interface Props {
  stateService: Remote<StateService>;
  width: number;
  height: number;
  gameChangeSubscribe: (f: GameChangeCallback) => void;
  gameChangeUnsubscribe: (f: GameChangeCallback) => void;
  onDangerModeChange?: (v: boolean) => void;
}

interface State {
  playMode: PlayMode;
  dangerMode: boolean;
}

// tslint:disable-next-line:variable-name
const End = deferred(import("../end/index.js").then(m => m.default));

export default class Game extends Component<Props, State> {
  state: State = {
    playMode: PlayMode.Playing,
    dangerMode: false
  };

  render(
    { width, height, gameChangeSubscribe, gameChangeUnsubscribe }: Props,
    { dangerMode, playMode }: State
  ) {
    return (
      <div class={gameClass}>
        {playMode === PlayMode.Won || playMode === PlayMode.Lost ? (
          <End
            loading={() => <div />}
            type={playMode}
            onRestart={this.onRestart}
          />
        ) : (
          <Board
            width={width}
            height={height}
            gameChangeSubscribe={gameChangeSubscribe}
            gameChangeUnsubscribe={gameChangeUnsubscribe}
            onCellClick={this.onCellClick}
          />
        )}
        <label class={toggleLabel}>
          Reveal
          <input
            class={checkbox}
            type="checkbox"
            onChange={this.onDangerModeChange}
            checked={!dangerMode}
          />
          <span class={toggle} /> Flag
        </label>
      </div>
    );
  }

  componentDidMount() {
    this.props.gameChangeSubscribe(this.onGameChange);
  }

  componentWillUnmount() {
    this.props.gameChangeUnsubscribe(this.onGameChange);
  }

  @bind
  private onRestart() {
    this.props.stateService.reset();
  }

  @bind
  private onGameChange(gameChange: StateChange) {
    if (
      "playMode" in gameChange &&
      this.state.playMode !== gameChange.playMode
    ) {
      this.setState({ playMode: gameChange.playMode! });
    }
  }

  @bind
  private onDangerModeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const dangerMode = !target.checked;
    this.setState({ dangerMode });
    if (this.props.onDangerModeChange) {
      this.props.onDangerModeChange(dangerMode);
    }
  }

  @bind
  private onCellClick(
    cellData: [number, number, Cell],
    forceDangerMode: boolean
  ) {
    const [x, y, cell] = cellData;
    let { dangerMode } = this.state;

    dangerMode = forceDangerMode || dangerMode;

    if (!cell.revealed) {
      if (!dangerMode) {
        if (cell.flagged) {
          this.props.stateService.unflag(x, y);
        } else {
          this.props.stateService.flag(x, y);
        }
      } else {
        this.props.stateService.reveal(x, y);
      }
    } else if (cell.touchingFlags >= cell.touchingMines) {
      this.props.stateService.revealSurrounding(x, y);
    }
  }
}
