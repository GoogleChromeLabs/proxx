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
      this._renderCell(x, y, cell);
    }
  }

  stop() {
    // Nothing to do
  }

  private _renderCell(x: number, y: number, cell: Cell) {
    const animationList: AnimationDesc[] = [];
    if (!cell.revealed) {
      animationList.push({
        name: AnimationName.IDLE,
        start: 0
      });
    } else {
      animationList.push({
        name: AnimationName.NUMBER,
        start: 0
      });
    }
    if (
      (cell.revealed &&
        cell.touchingFlags > 0 &&
        cell.touchingFlags >= cell.touchingMines) ||
      (!cell.revealed && cell.flagged)
    ) {
      animationList.push({
        name: AnimationName.HIGHLIGHT_IN,
        start: 0
      });
    } else {
      animationList.push({
        name: AnimationName.HIGHLIGHT_OUT,
        start: 0
      });
    }

    this._renderer.beforeCell(x, y, cell, animationList, 1000);
    for (const animation of animationList) {
      this._renderer.render(x, y, cell, animation, 1000);
    }
    this._renderer.afterCell(x, y, cell, animationList, 1000);
  }
}
