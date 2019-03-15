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

import { Remote } from "comlink/src/comlink.js";
import { Cell, State as GameState, Tag } from "src/gamelogic/types.js";
import localStateSubscribe from "../local-state-subscribe";
import StateService from "../state.js";

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

export default class CanvasService {
  private _state?: State;
  private _firstRender = true;
  private _canvas: HTMLCanvasElement | null;
  private _context: CanvasRenderingContext2D | null | undefined;

  constructor(private _stateService: Remote<StateService>) {
    localStateSubscribe(_stateService, newState => {
      this._state = newState;
      this.render(newState.changes);
    });

    this._canvas = document.createElement("canvas");

    document.body.appendChild(this._canvas);

    if (this._canvas) {
      this._canvas.addEventListener("click", this.onUnrevealedClick.bind(this));
      this._context = this._canvas.getContext("2d");
    }
  }

  private render(changes: Array<[number, number, Cell]>) {
    if (this._canvas === null || !this._context || !this._state) {
      return;
    }

    const cellHeight = 10;
    const cellWidth = 10;
    const gridSize = this._state.grid.length; // assuming square

    if (changes.length > 0) {
      for (const change of changes) {
        this.drawCell(change[2], change[1], change[0]);
      }
    } else {
      this._canvas.width = gridSize * cellWidth;
      this._canvas.height = gridSize * cellHeight;

      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const cell = this._state.grid[row][col];
          this.drawCell(cell, row, col);
        }
      }
    }
  }

  private drawCell(cell: Cell, row: number, col: number) {
    if (this._canvas === null || !this._context || !this._state) {
      return;
    }

    const cellHeight = 10;
    const cellWidth = 10;
    const context = this._context;

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

  private onUnrevealedClick(event: MouseEvent) {
    if (event.target instanceof HTMLCanvasElement === false || !this._state) {
      return;
    }

    const canvasRect = this._canvas!.getBoundingClientRect();
    const row = Math.floor((event.x - canvasRect.left) / 10);
    const col = Math.floor((event.y - canvasRect.top) / 10);

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
