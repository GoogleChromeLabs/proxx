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

import { proxy, Remote } from "comlink";
import { h, render } from "preact";

import StateService, { State, StatePatch } from "../state.js";

import Row from "./components/row/index.js";

import { bind } from "../../utils/bind.js";
import { forEach } from "../../utils/streams.js";

import { Action } from "./components/cell/index.js";

import { Cell } from "../../gamelogic/types.js";

import { changeCell } from "../../utils/immutable.js";

export default class PreactService {
  private grid: Cell[][] = [];
  constructor(private stateService: Remote<StateService>) {
    const patchStream = new ReadableStream<StatePatch>({
      start: async (controller: ReadableStreamDefaultController) => {
        const state = await stateService.state;
        this.grid = state.grid;
        // Make initial render ASAP
        this.render(this.grid);
        stateService.patchSubscribe(
          proxy((state: StatePatch) => controller.enqueue(state))
        );
      }
    });
    forEach(patchStream, async patch => await this.onStatePatch(patch));
  }

  private async onStatePatch(patch: StatePatch) {
    const objsCloned = new WeakSet();
    for (const { x, y, cell } of patch.changedCells) {
      this.grid = changeCell(this.grid, x, y, objsCloned);
      this.grid[y][x] = cell;
    }
    this.render(this.grid);
  }

  private render(state: Cell[][]) {
    render(
      <table>
        {state.map((row, i) => (
          // tslint:disable-next-line:jsx-no-lambda
          <Row
            key={i}
            row={row}
            onClick={(col, action) => this.click(i, col, action)}
          />
        ))}
      </table>,
      document.body,
      document.body.firstChild as any
    );
  }

  @bind
  private async click(row: number, col: number, action: Action) {
    switch (action) {
      case Action.Flag: {
        await this.stateService.flag(col, row);
        break;
      }
      case Action.Reveal: {
        await this.stateService.reveal(col, row);
        break;
      }
    }
  }
}
