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

import { ProxyResult, proxyValue } from "comlinkjs";
import StateService, { State } from "../state.js";

import { html, render } from "lit-html";
import { cache } from "lit-html/directives/cache";
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
  constructor(private stateService: ProxyResult<StateService>) {
    const stateStream = new ReadableStream<State>({
      async start(controller: ReadableStreamDefaultController<State>) {
        // Make initial render ASAP
        controller.enqueue(await stateService.state);
        stateService.subscribe(
          proxyValue((state: State) => controller.enqueue(state))
        );
      }
    });
    forEach(stateStream, async state => this.render(state));

    this._table = document.getElementById("board") as HTMLTableElement;
    if (this._table) {
      this._table.addEventListener("click", this.onUnrevealedClick);
    }
  }

  private render(state: State) {
    if (this._table === null) {
      return;
    }

    render(
      html`
        ${state.grid.map(
          (row, rowId) => html`
            <tr key=${rowId}>
              ${row.map(
                (cell, colId) =>
                  html`
                    <td>
                      <button
                        row=${rowId}
                        col=${colId}
                        revealed=${cell.revealed}
                        mine=${cell.hasMine}
                        tag=${cell.touching > 0 ? Tag.Touching : cell.tag}
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

    const target = event.target as HTMLButtonElement;
    const row = parseInt(target.getAttribute("row") || "0", 10);
    const col = parseInt(target.getAttribute("col") || "0", 10);
    const tag = parseInt(target.getAttribute("tag") || "0", 10);

    if (tag === Tag.Touching) {
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
