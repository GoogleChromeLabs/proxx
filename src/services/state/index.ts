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

import MinesweeperGame from "../../gamelogic/index.js";

import {
  Cell,
  GridChanges,
  State as LogicGameState,
  Tag
} from "../../gamelogic/types.js";
import { bind } from "../../utils/bind.js";

import initialState from "./initial-state.js";

// @ts-ignore
import generatedFieldURL from "asset-url:../../gamelogic/generated-field.json";

export const enum UpdateType {
  FULL_STATE,
  GRID_PATCH
}

export interface FullStateUpdate {
  type: UpdateType.FULL_STATE;
  newState: State;
}

// TODO We probably want another InitBoardUpdate so we don’t
// have to send the unrevealed array.

export interface GridPatchUpdate {
  type: UpdateType.GRID_PATCH;
  gridChanges: GridChanges;
}

export type StateUpdate = FullStateUpdate | GridPatchUpdate;

export const enum StateName {
  START,
  WAITING_TO_PLAY,
  PLAYING,
  END
}

export interface StartState {
  name: StateName.START;
}

export interface WaitingToPlayState {
  name: StateName.WAITING_TO_PLAY;
  grid: Cell[][];
}

export interface PlayingState {
  name: StateName.PLAYING;
  grid: Cell[][];
}

export interface EndState {
  name: StateName.END;
  endType: LogicGameState.Won | LogicGameState.Lost;
}

export type State = StartState | WaitingToPlayState | PlayingState | EndState;

export default class StateService {
  readonly ready = true;
  private _state: State = { ...initialState };
  private _eventTarget: EventTarget = new MessageChannel().port1;
  private _game?: MinesweeperGame;

  constructor() {
    this.reset();
  }

  getFullState(): State {
    return this._state;
  }

  initGame(width: number, height: number, numBombs: number) {
    this._game = new MinesweeperGame(width, height, numBombs);
    this._state = {
      grid: this._game!.grid,
      name: StateName.WAITING_TO_PLAY
    };
    this._game.subscribe(gridChanges => {
      this._notify({
        gridChanges,
        type: UpdateType.GRID_PATCH
      });
    });
    this._notify({
      newState: this._state,
      type: UpdateType.FULL_STATE
    });
  }

  subscribe(callback: (state: StateUpdate) => void) {
    this._eventTarget.addEventListener("state-update", (event: Event) => {
      callback((event as CustomEvent<StateUpdate>).detail);
    });
  }

  flag(x: number, y: number) {
    this._game!.tag(x, y, Tag.Flag);
    this._checkForGameOver();
  }

  unflag(x: number, y: number) {
    this._game!.tag(x, y, Tag.None);
    this._checkForGameOver();
  }

  reveal(x: number, y: number) {
    this._game!.reveal(x, y);
    this._checkForGameOver();
  }

  revealSurrounding(x: number, y: number) {
    this._game!.attemptSurroundingReveal(x, y);
    this._checkForGameOver();
  }

  reset() {
    this._state = initialState;
    this._fullStateUpdate();
  }

  async loadDeterministicField() {
    throw Error("Currently not implemented");
    // const field = await fetch(generatedFieldURL).then(r => r.json());
    // this._game!.grid = field;
    // // tslint:disable-next-line
    // this._game!["_state"] = State.Playing;
    // this._game!.startTime = Date.now();
  }

  private _checkForGameOver() {
    if (
      this._game!.state === LogicGameState.Won ||
      this._game!.state === LogicGameState.Lost
    ) {
      this._state = {
        endType: this._game!.state,
        name: StateName.END
      };
    }
    this._fullStateUpdate();
  }

  private _fullStateUpdate() {
    this._notify({
      newState: this._state,
      type: UpdateType.FULL_STATE
    });
  }

  private _notify(stateUpdate: StateUpdate) {
    this._eventTarget.dispatchEvent(
      new CustomEvent<StateUpdate>("state-update", {
        detail: stateUpdate
      })
    );
  }
}
