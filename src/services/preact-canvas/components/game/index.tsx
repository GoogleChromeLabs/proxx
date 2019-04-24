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
import { lazyGenerateTextures } from "src/rendering/animation";
import { getRendererInstance, Renderer } from "src/rendering/renderer";
import StateService from "src/services/state";
import { submitTime } from "src/services/state/best-times";
import { bind } from "src/utils/bind";
import { getCellSizes } from "src/utils/cell-sizing";
import { GameChangeCallback } from "../..";
import { StateChange } from "../../../../gamelogic";
import { Cell, PlayMode } from "../../../../gamelogic/types";
import initFocusHandling from "../../../../utils/focus-visible";
import Board from "../board";
import deferred from "../deferred";
import TopBar from "../top-bar";
import {
  againButton,
  checkbox,
  exitRow,
  exitRowInner,
  game as gameClass,
  mainButton,
  toggle,
  toggleLabel
} from "./style.css";

export interface Props {
  stateService: Remote<StateService>;
  width: number;
  height: number;
  mines: number;
  gameChangeSubscribe: (f: GameChangeCallback) => void;
  gameChangeUnsubscribe: (f: GameChangeCallback) => void;
  onDangerModeChange: (v: boolean) => void;
  dangerMode: boolean;
  toRevealTotal: number;
}

interface State {
  playMode: PlayMode;
  toReveal: number;
  startTime: number;
  endTime: number;
  // This should always be set as we prevent the game from starting until the
  // renderer is loaded.
  renderer?: Renderer;
  completeTime: number;
  bestTime: number;
}

// tslint:disable-next-line:variable-name
const Win = deferred(import("../win/index.js").then(m => m.default));

// The second this file is loaded, activate focus handling
initFocusHandling();

export default class Game extends Component<Props, State> {
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      playMode: PlayMode.Pending,
      toReveal: props.toRevealTotal,
      startTime: 0,
      completeTime: 0,
      bestTime: 0,
      endTime: 0
    };

    getRendererInstance().then(renderer => this.setState({ renderer }));
  }

  render(
    {
      dangerMode,
      width,
      height,
      gameChangeSubscribe,
      gameChangeUnsubscribe,
      toRevealTotal
    }: Props,
    { playMode, toReveal, renderer, completeTime, bestTime }: State
  ) {
    const timerRunning = playMode === PlayMode.Playing;

    return (
      <div class={gameClass}>
        <TopBar
          timerRunning={timerRunning}
          toReveal={toReveal}
          toRevealTotal={toRevealTotal}
        />
        {playMode === PlayMode.Won ? (
          <Win
            loading={() => <div />}
            onMainMenu={this.onReset}
            onRestart={this.onRestart}
            time={completeTime}
            bestTime={bestTime}
          />
        ) : renderer ? (
          [
            <Board
              width={width}
              height={height}
              dangerMode={dangerMode}
              renderer={renderer}
              gameChangeSubscribe={gameChangeSubscribe}
              gameChangeUnsubscribe={gameChangeUnsubscribe}
              onCellClick={this.onCellClick}
              onDangerModeChange={this.props.onDangerModeChange}
            />,
            playMode === PlayMode.Playing || playMode === PlayMode.Pending ? (
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
            ) : playMode === PlayMode.Lost ? (
              <div class={exitRow}>
                <div class={exitRowInner}>
                  <button class={againButton} onClick={this.onRestart}>
                    Try again
                  </button>
                  <button class={mainButton} onClick={this.onReset}>
                    Main menu
                  </button>
                </div>
              </div>
            ) : (
              undefined
            )
          ]
        ) : (
          <div />
        )}
      </div>
    );
  }

  componentDidMount() {
    this.props.gameChangeSubscribe(this.onGameChange);
    if (!this.props.dangerMode) {
      this.props.onDangerModeChange(true);
    }
  }

  componentWillUnmount() {
    this.props.gameChangeUnsubscribe(this.onGameChange);
  }

  @bind
  private onReset() {
    this.props.stateService.reset();
  }

  @bind
  private onRestart() {
    this.props.stateService.restart();
  }

  @bind
  private async onGameChange(gameChange: StateChange) {
    const newState: Partial<State> = {};

    if (
      "playMode" in gameChange &&
      this.state.playMode !== gameChange.playMode
    ) {
      newState.playMode = gameChange.playMode;

      if (gameChange.playMode! === PlayMode.Playing) {
        newState.startTime = Date.now();
      } else if (gameChange.playMode! === PlayMode.Won) {
        newState.completeTime = Date.now() - this.state.startTime;
        newState.bestTime = await submitTime(
          this.props.width,
          this.props.height,
          this.props.mines,
          newState.completeTime
        );
        this.props.onDangerModeChange(false);
      }
    }

    if (
      "toReveal" in gameChange &&
      this.state.toReveal !== gameChange.toReveal
    ) {
      newState.toReveal = gameChange.toReveal;
    }

    if (Object.keys(newState).length) {
      this.setState(newState as State);
    }
  }

  @bind
  private onDangerModeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const dangerMode = !target.checked;
    this.props.onDangerModeChange(dangerMode);
  }

  @bind
  private onCellClick(cellData: [number, number, Cell], alt: boolean) {
    if (
      this.state.playMode !== PlayMode.Pending &&
      this.state.playMode !== PlayMode.Playing
    ) {
      return;
    }
    const [x, y, cell] = cellData;
    let { dangerMode } = this.props;

    if (alt) {
      dangerMode = !dangerMode;
    }

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
