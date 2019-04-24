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
import { bind } from "src/utils/bind";
import { AnimationDesc, AnimationName } from "../animation";
import { removeAnimations } from "../animation-helpers";
import { Animator } from "../animator";
import { rippleSpeed } from "../constants";
import { Renderer } from "../renderer";

interface CellDetails {
  animationList: AnimationDesc[];
  x: number;
  y: number;
  cell?: Cell;
  hasFlashed: boolean;
}

export default class MotionAnimator implements Animator {
  private _renderLoopRunning = false;
  // Workaround because TS doesn’t realize that this propp is _definitely_
  // assigned in the constructor.
  private _cellDetails: CellDetails[] = null as any;
  private _changeBuffer: GridChanges = [];
  private _lastTs = performance.now();

  constructor(
    private _numTilesX: number,
    private _numTilesY: number,
    private _renderer: Renderer
  ) {
    this._initCellDetails();
    this._startRenderLoop();
  }

  get numTiles() {
    return this._numTilesX * this._numTilesY;
  }

  updateCells(changes: GridChanges) {
    // Queue up changes to be consumed by animation rAF
    this._changeBuffer.push(...changes);
  }

  stop() {
    this._renderLoopRunning = false;
  }

  private _initCellDetails() {
    const startTime = performance.now();
    const rippleFactor =
      rippleSpeed * Math.max(this._numTilesX, this._numTilesY);
    this._cellDetails = new Array(this.numTiles);
    for (let y = 0; y < this._numTilesY; y++) {
      for (let x = 0; x < this._numTilesX; x++) {
        this._cellDetails[y * this._numTilesX + x] = {
          animationList: [
            {
              name: AnimationName.IDLE,
              start:
                startTime -
                rippleFactor +
                distanceFromCenter(x, y, this._numTilesX, this._numTilesY) *
                  rippleFactor
            }
          ],
          hasFlashed: false,
          x,
          y
        };
      }
    }
  }

  private _updateAnimation(details: CellDetails) {
    // tslint:disable-next-line:prefer-const
    let { cell, animationList } = details;
    const ts = performance.now();
    if (!cell) {
      console.warn("Unknown cell");
      return;
    }
    if (!cell.revealed && !cell.flagged) {
      animationList[0].name = AnimationName.IDLE;
      animationList[0].fadeStart = ts;
      animationList = removeAnimations(animationList, [
        AnimationName.HIGHLIGHT_IN,
        AnimationName.HIGHLIGHT_OUT
      ]);
      animationList.push({
        name: AnimationName.HIGHLIGHT_OUT,
        start: ts,
        done: () => {
          animationList = removeAnimations(animationList, [
            AnimationName.HIGHLIGHT_IN,
            AnimationName.HIGHLIGHT_OUT
          ]);
          details.animationList = animationList;
        }
      });
    } else if (!cell.revealed && cell.flagged) {
      animationList[0].name = AnimationName.FLAGGED;
      animationList[0].fadeStart = ts;
      animationList.push({
        name: AnimationName.HIGHLIGHT_IN,
        start: ts
      });
    } else if (cell.revealed) {
      const isHighlighted = animationList.some(
        a => a.name === AnimationName.HIGHLIGHT_IN
      );
      if (
        cell.touchingFlags >= cell.touchingMines &&
        cell.touchingMines > 0 &&
        !isHighlighted
      ) {
        animationList.push({
          name: AnimationName.HIGHLIGHT_IN,
          start: ts
        });
      } else if (cell.touchingFlags < cell.touchingMines && isHighlighted) {
        animationList = removeAnimations(animationList, [
          AnimationName.HIGHLIGHT_IN,
          AnimationName.HIGHLIGHT_OUT
        ]);
        animationList.push({
          name: AnimationName.HIGHLIGHT_OUT,
          start: ts
        });
      }
      details.animationList = animationList;
      // This button already played the flash animation
      if (details.hasFlashed) {
        return;
      }
      animationList = removeAnimations(animationList, [AnimationName.IDLE]);
      details.hasFlashed = true;
      animationList.push({
        name: AnimationName.FLASH_IN,
        start: ts,
        done: () => {
          animationList = removeAnimations(animationList, [
            AnimationName.FLASH_IN
          ]);
          details.animationList = animationList;
        }
      });
      animationList.unshift({
        name: AnimationName.NUMBER,
        start: ts + 100
      });
      animationList.push({
        name: AnimationName.FLASH_OUT,
        start: ts + 100
      });
    }

    details.animationList = animationList;
  }

  private _animateTile(detail: CellDetails, ts: number) {
    for (const animation of detail.animationList) {
      this._renderer.render(detail.x, detail.y, detail.cell!, animation, ts);
    }
  }

  private _startRenderLoop() {
    if (this._renderLoopRunning) {
      return;
    }
    this._renderLoopRunning = true;
    requestAnimationFrame(this._renderLoop);
  }

  private _consumeChangeBuffer(delta: number) {
    // Reveal ~5 fields per frame
    const numConsume = Math.floor((delta * 5) / 16);
    const slice = this._changeBuffer.splice(0, numConsume);
    for (const [x, y, cellProps] of slice) {
      const detail = this._cellDetails[y * this._numTilesX + x];
      detail.cell = cellProps;
      this._updateAnimation(detail);
    }
  }

  @bind
  private _renderLoop(ts: number) {
    const delta = ts - this._lastTs;
    this._lastTs = ts;

    // Update animations according to incoming grid changes
    this._consumeChangeBuffer(delta);

    this._renderer.beforeRenderFrame();
    for (const detail of this._cellDetails) {
      this._renderer.beforeCell(
        detail.x,
        detail.y,
        detail.cell!,
        detail.animationList,
        ts
      );
      this._animateTile(detail, ts);
      this._renderer.afterCell(
        detail.x,
        detail.y,
        detail.cell!,
        detail.animationList,
        ts
      );
    }

    if (this._renderLoopRunning) {
      requestAnimationFrame(this._renderLoop);
    }
  }
}

function distanceFromCenter(
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const centerX = width / 2;
  const centerY = height / 2;
  // Measure the distance from the center point of the game board
  // to the center of the field (hence the +0.5)
  const dx = x + 0.5 - centerX;
  const dy = y + 0.5 - centerY;
  // Distance of our point to origin
  return (
    Math.sqrt(dx * dx + dy * dy) /
    Math.sqrt(centerX * centerX + centerY * centerY)
  );
}
