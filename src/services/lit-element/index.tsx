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
  }

  private render(state: State) {
    if (document.body === null) {
      return;
    }

    const renderCell = (cell: Cell, row: number, col: number) => {
      if (!cell.revealed) {
        return html`
          <button row=${row} col=${col} tag=${cell.tag}>
            ${cell.tag === Tag.Flag ? "Flagged" : "Not revealed"}
          </button>
        `;
      }
      if (cell.hasMine) {
        return html`
          <div>Mine</div>
        `;
      }
      if (cell.touching) {
        return html`
          <button tag=${Tag.Touching}>${cell.touching}</button>
        `;
      }
    };

    render(
      html`
        <table @click=${this.onUnrevealedClick}>
          ${state.grid.map(
            (row, rowId) => html`
              <tr key=${rowId}>
                ${row.map(
                  (cell, cellId) =>
                    html`
                      <td>${renderCell(cell, rowId, cellId)}</td>
                    `
                )}
              </tr>
            `
          )}
        </table>
      `,
      document.body
    );
  }

  @bind
  private async onUnrevealedClick(event: MouseEvent) {
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
      await this.stateService.reveal(col, row);
      return;
    }

    if (event.shiftKey) {
      if (tag === Tag.None) {
        await this.stateService.flag(col, row);
      }
      return;
    }

    if (tag === Tag.Flag) {
      return;
    }

    await this.stateService.reveal(col, row);
  }
}
