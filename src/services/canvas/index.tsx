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

import { proxy, Remote } from "comlink/src/comlink.js";
import { Cell, Tag } from "src/gamelogic/types.js";
import { forEach } from "../../utils/streams.js";
import StateService, { State } from "../state.js";

export const enum Action {
  Reveal,
  Flag,
  Unflag,
  RevealSurrounding
}

export default class CanvasService {
  private _canvas: HTMLCanvasElement | null;
  private _context: CanvasRenderingContext2D | null | undefined;
  private _state: State | null = null;
  constructor(private stateService: Remote<StateService>) {
    this.init();
    this._canvas = document.createElement("canvas");
    document.body.append(this._canvas);
    if (this._canvas) {
      this._canvas.addEventListener("click", this.onUnrevealedClick.bind(this));
      this._context = this._canvas.getContext("2d");
    }
  }

  private async init() {
    let myReadableStream = ((typeof ReadableStream !== "undefined" &&
      ReadableStream) as any) as typeof ReadableStream;
    if (!myReadableStream) {
      // @ts-ignore
      const polyfill = await import("web-streams-polyfill");
      console.log(polyfill);
      myReadableStream = polyfill.ReadableStream;
    }
    console.log(myReadableStream);
    const stateStream = new myReadableStream<State>({
      start: async (controller: ReadableStreamDefaultController<State>) => {
        // Make initial render ASAP
        controller.enqueue(await this.stateService.state);
        this.stateService.subscribe(
          proxy((state: State) => controller.enqueue(state))
        );
      }
    });
    forEach(stateStream, async state => {
      this._state = state;
      this.render(state); // Future: Render function might just pull from state.
    });
  }

  private render(state: State) {
    if (this._canvas === null) {
      return;
    }

    if (this._context === null || this._context === undefined) {
      return;
    }

    if (this._state === null) {
      return;
    }

    const cellHeight = 10;
    const cellWidth = 10;
    const x = 0;
    const y = 0;
    const gridSize = this._state.grid.length; // assuming square
    const context = this._context;

    this._canvas.width = this._state.grid.length * cellWidth;
    this._canvas.height = this._state.grid.length * cellHeight;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = this._state.grid[row][col];
        let drawText = false;
        context.fillStyle = "green";

        if (cell.revealed) {
          if (cell.hasMine) {
            context.fillStyle = "red";
          } else if (cell.touching > 0) {
            drawText = true;
          } else if (cell.touching === 0) {
            context.fillStyle = "white";
          }
        } else {
          if (cell.tag === Tag.Flag) {
            context.fillStyle = "blue";
          }
          if (cell.tag === Tag.Mark) {
            context.fillStyle = "yellow";
          }
        }

        if (drawText) {
          context.fillStyle = "white";
          context.fillRect(
            row * cellWidth,
            col * cellHeight,
            cellWidth,
            cellHeight
          );
          context.fillStyle = "black";
          context.textAlign = "center";
          context.fillText(
            cell.touching.toString(),
            row * cellWidth + cellWidth / 2,
            col * cellHeight + cellHeight
          );
        } else {
          context.fillRect(
            row * cellWidth,
            col * cellHeight,
            cellWidth,
            cellHeight
          );
        }
      }
    }
  }

  private onUnrevealedClick(event: MouseEvent) {
    if (event.target instanceof HTMLCanvasElement === false) {
      return;
    }

    if (this._state === null) {
      return;
    }

    const target = event.target as HTMLCanvasElement;
    const row = Math.floor(event.x / 10);
    const col = Math.floor(event.y / 10);

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
