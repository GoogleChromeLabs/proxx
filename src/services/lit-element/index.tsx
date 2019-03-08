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
          <button
            @click=${this.onUnrevealedClick}
            row=${row}
            col=${col}
            tag=${cell.tag}
          >
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
          <button @click=${this.onTouchingClick}>${cell.touching}</button>
        `;
      }
    };

    const rows = state.grid.map((row, i) => {
      // tslint:disable-next-line:jsx-no-lambda
      const cells = row.map(
        (cell, idx) => html`
          <td>
            ${renderCell(cell, i, idx)}
          </td>
        `
      );

      return html`
        <tr key=${i}>
          ${cells}
        </tr>
      `;
    });

    render(
      html`
        <table>
          ${rows}
        </table>
      `,
      document.body
    );
  }

  @bind
  private async onUnrevealedClick(event: MouseEvent) {
    if (event.target == null) {
      return;
    }
    const button = event.target as HTMLElement;
    const row = parseInt(button.getAttribute("row") || "0", 10);
    const col = parseInt(button.getAttribute("col") || "0", 10);
    const tag = parseInt(button.getAttribute("teg") || "0", 10);

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

  @bind
  private async onTouchingClick(event: MouseEvent) {
    if (event.target == null) {
      return;
    }

    const button = event.target as HTMLElement;
    const row = parseInt(button.getAttribute("row") || "0", 10);
    const col = parseInt(button.getAttribute("col") || "0", 10);

    if (!event.shiftKey) {
      return;
    }
    await this.stateService.reveal(col, row);
  }
}
