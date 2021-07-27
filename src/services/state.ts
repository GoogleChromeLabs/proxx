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

import { Cell, Tag } from "../gamelogic/types.js";

export interface State {
  grid: Cell[][];
}

const BOARD_SIZE = 40;
const DENSITY = 0.1;

export default class StateService {
  private port = new MessageChannel().port1;

  private game: MinesweeperGame;
  constructor(private size: number, private seed: number) {
    this.game = new MinesweeperGame(
      this.size,
      this.size,
      Math.floor(this.size * this.size * DENSITY),
      seed
    );
  }

  get state(): State {
    return {
      grid: this.game.grid
    };
  }

  notify() {
    const ev = new CustomEvent("state", { detail: this.state });
    this.port.dispatchEvent(ev);
  }

  subscribe(f: (state: State) => void) {
    this.port.addEventListener("state", ((ev: CustomEvent) =>
      f(ev.detail)) as any);
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
}
