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

import { Remote } from "comlink";
import StateService from "../state.js";

import { html, render } from "lit-html";
import { repeat } from "lit-html/directives/repeat";
import { Cell, State as GameState, Tag } from "src/gamelogic/types.js";
import { bind } from "../../utils/bind.js";
import localStateSubscribe from "../local-state-subscribe";
import "./style.css";

export const enum Action {
  Reveal,
  Flag,
  Unflag,
  RevealSurrounding
}

interface State {
  grid: Cell[][];
  flags: number;
  state: GameState;
}

export default class LitService {
  private _table: HTMLTableElement | null;
  private _state?: State;
  constructor(private _stateService: Remote<StateService>) {
    localStateSubscribe(_stateService, newState => {
      this._state = newState;
      this.render();
    });

    this._table = document.createElement("table");
    this._table.addEventListener("click", this.onUnrevealedClick);
    document.querySelector("main")!.appendChild(this._table);
  }

  private render() {
    if (!this._table || !this._state) {
      return;
    }

    const state = this._state;
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
    if (event.target instanceof HTMLButtonElement === false || !this._state) {
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
      this._stateService.reveal(col, row);
      return;
    }

    if (event.shiftKey) {
      if (tag === Tag.None) {
        this._stateService.flag(col, row);
      }
      return;
    }

    if (tag === Tag.Flag) {
      return;
    }

    this._stateService.reveal(col, row);
  }
}
