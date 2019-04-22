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

import { Cell, GridChanges } from "src/gamelogic/types";
import { AnimationDesc, AnimationName } from "../animation";
import { Animator } from "../animator";
import { Renderer } from "../renderer";

export default class NoMotionAnimator implements Animator {
  constructor(
    private _numTilesX: number,
    private _numTilesY: number,
    private _renderer: Renderer
  ) {}

  get numTiles() {
    return this._numTilesX * this._numTilesY;
  }

  updateCells(changes: GridChanges) {
    for (const [x, y, cell] of changes) {
      this._renderer.beforeCell(x, y, cell);
      this._renderCell(x, y, cell);
      this._renderer.afterCell(x, y, cell);
    }
  }

  stop() {
    // Nothing to do
  }

  private _renderCell(x: number, y: number, cell: Cell) {
    if (!cell.revealed) {
      this._renderer.render(
        x,
        y,
        cell,
        {
          name: AnimationName.IDLE,
          start: 0
        },
        1000
      );
    } else {
      this._renderer.render(
        x,
        y,
        cell,
        {
          name: AnimationName.NUMBER,
          start: 0
        },
        1000
      );
    }
    if (
      (cell.touchingFlags > 0 && cell.touchingFlags >= cell.touchingMines) ||
      (!cell.revealed && cell.flagged)
    ) {
      this._renderer.render(
        x,
        y,
        cell,
        {
          name: AnimationName.HIGHLIGHT_IN,
          start: 0
        },
        1000
      );
    } else {
      this._renderer.render(
        x,
        y,
        cell,
        {
          name: AnimationName.HIGHLIGHT_OUT,
          start: 0
        },
        1000
      );
    }
  }
}
