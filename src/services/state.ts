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

import MinesweeperGame from "../gamelogic/index.js";

import { Cell, State, Tag } from "../gamelogic/types.js";

// @ts-ignore
import generatedFieldURL from "asset-url:../gamelogic/generated-field.json";

export type GridChanges = Array<[number, number, Cell]>;

export interface StateUpdate {
  state: State;
  flags: number;
  gridChanges: GridChanges;
}

const BOARD_SIZE = 40;
const DENSITY = 0.1;

export default class StateService {
  private eventTarget: EventTarget = new MessageChannel().port1;

  private game: MinesweeperGame = new MinesweeperGame(
    BOARD_SIZE,
    BOARD_SIZE,
    Math.floor(BOARD_SIZE * BOARD_SIZE * DENSITY)
  );

  getFullState() {
    return {
      flags: this.game.flags,
      grid: this.game.grid,
      state: this.game.state
    };
  }

  subscribe(callback: (state: StateUpdate) => void) {
    this.eventTarget.addEventListener("state", (event: Event) => {
      callback((event as CustomEvent<StateUpdate>).detail);
    });
  }

  flag(x: number, y: number) {
    this.game.tag(x, y, Tag.Flag);
    this.notify();
  }

  unflag(x: number, y: number) {
    this.game.tag(x, y, Tag.None);
    this.notify();
  }

  reveal(x: number, y: number) {
    this.game.reveal(x, y);
    this.notify();
  }

  revealSurrounding(x: number, y: number) {
    this.game.attemptSurroundingReveal(x, y);
    this.notify();
  }

  async loadDeterministicField() {
    const field = await fetch(generatedFieldURL).then(r => r.json());
    this.game.grid = field;
    // tslint:disable-next-line
    this.game["_state"] = State.Playing;
    this.game.startTime = Date.now();
  }

  private notify() {
    const ev = new CustomEvent<StateUpdate>("state", {
      detail: this.getUpdate()
    });
    this.eventTarget.dispatchEvent(ev);
  }

  private getUpdate(): StateUpdate {
    return {
      flags: this.game.flags,
      gridChanges: this.game.collectGridChanges().map(change => {
        return [change[0], change[1], this.game.grid[change[1]][change[0]]];
      }) as Array<[number, number, Cell]>,
      state: this.game.state
    };
  }
}
