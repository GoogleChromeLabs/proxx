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
import StateService, { State } from "../state.js";

import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat";
import { Cell, Tag } from "src/gamelogic/types.js";
import { bind } from "../../utils/bind.js";
import { forEach } from "../../utils/streams.js";

export const enum Action {
  Reveal,
  Flag,
  Unflag,
  RevealSurrounding
}

export default class LitService {
  private _table: HTMLTableElement | null;
  private _state: State | null = null;
  constructor(private stateService: Remote<StateService>) {
    const stateStream = new ReadableStream<State>({
      async start(controller: ReadableStreamDefaultController<State>) {
        // Make initial render ASAP
        controller.enqueue(await stateService.state);
        stateService.subscribe(
          proxy((state: State) => controller.enqueue(state))
        );
      }
    });
    forEach(stateStream, async state => {
      this._state = state;
      this.render(state); // Future: Render function might just pull from state.
    });

    this._table = document.getElementById("board") as HTMLTableElement;
    if (this._table) {
      this._table.addEventListener("click", this.onUnrevealedClick);
    }
  }

  private render(state: State) {
    if (this._table === null) {
      return;
    }

    if (this._state === null) {
      return;
    }

    let rowCount = 0;

    render(
      html`
        ${repeat(
          state.grid,
          row => rowCount++,
          (row, rowId) => html`
            <tr>
              ${repeat(
                row,
                cell => cell.id,
                (cell, cellId) =>
                  html`
                    <td>
                      <button
                        row=${rowId}
                        col=${cellId}
                        ?revealed=${cell.revealed}
                        ?mine=${cell.hasMine}
                        ?touching=${cell.touching > 0}
                      >
                        ${!cell.revealed
                          ? cell.tag === Tag.Flag
                            ? "F"
                            : ""
                          : cell.hasMine
                          ? "M"
                          : cell.touching > 0
                          ? cell.touching
                          : ""}
                      </button>
                    </td>
                  `
              )}
            </tr>
          `
        )}
      `,
      this._table
    );
  }

  @bind
  private onUnrevealedClick(event: MouseEvent) {
    if (event.target instanceof HTMLButtonElement === false) {
      return;
    }

    if (this._state === null) {
      return;
    }

    const target = event.target as HTMLButtonElement;
    const row = parseInt(target.getAttribute("row") || "0", 10);
    const col = parseInt(target.getAttribute("col") || "0", 10);

    const cell: Cell = this._state.grid[row][col];

    const tag = cell.tag;
    const touching = cell.touching;

    if (touching > 0) {
      if (!event.shiftKey) {
        return;
      }
      this.stateService.reveal(col, row);
      return;
    }

    if (event.shiftKey) {
      if (tag === Tag.None) {
        this.stateService.flag(col, row);
      }
      return;
    }

    if (tag === Tag.Flag) {
      return;
    }

    this.stateService.reveal(col, row);
  }
}
