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

import { Cell, GridChanges, PlayMode } from "./types";

function newCell(): Cell {
  return {
    flagged: false,
    hasMine: false,
    revealed: false,
    touchingFlags: 0,
    touchingMines: 0
  };
}

export interface StateChange {
  flags?: number;
  toReveal?: number;
  playMode?: PlayMode;
  gridChanges?: GridChanges;
}

export type ChangeCallback = (changes: StateChange) => void;

const FLUSH_GRID_CHANGE_THRESHOLD = 10;

export default class MinesweeperGame {
  get toReveal() {
    return this._toReveal;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get mines() {
    return this._mines;
  }

  grid: Cell[][];
  private _playMode = PlayMode.Pending;
  private _toReveal = 0;
  private _flags = 0;
  private _changeCallback?: ChangeCallback;
  private _stateChange: StateChange = {};
  private _minedCells: Array<[number, number]> = [];

  constructor(
    private _width: number,
    private _height: number,
    private _mines: number
  ) {
    if (_mines < 1) {
      throw Error("Invalid number of mines");
    }
    if (_width < 1 || _height < 1) {
      throw Error("Invalid dimensions");
    }

    const maxMines = _width * _height - 9;

    if (_mines > maxMines) {
      throw Error("Number of mines cannot fit in grid");
    }

    this._toReveal = _width * _height - _mines;

    this.grid = Array(_height)
      .fill(undefined)
      .map(() =>
        Array(_width)
          .fill(undefined)
          .map(() => newCell())
      );
  }

  subscribe(callback: ChangeCallback) {
    this._changeCallback = callback;
  }

  unsubscribe() {
    this._changeCallback = undefined;
  }

  reveal(x: number, y: number) {
    if (this._playMode === PlayMode.Pending) {
      this._placeMines(x, y);
    } else if (this._playMode !== PlayMode.Playing) {
      throw Error("Game is not in a playable state");
    }

    const cell = this.grid[y][x];

    if (cell.flagged) {
      throw Error("Cell flagged");
    }

    this._reveal(x, y);
    this._flushStateChange();
  }

  setFlag(x: number, y: number, flagged: boolean) {
    const cell = this.grid[y][x];
    if (cell.revealed) {
      throw Error("Revealed cell cannot be tagged");
    }
    if (cell.flagged === flagged) {
      return;
    }

    cell.flagged = flagged;
    this._pushGridChange(x, y);

    if (flagged) {
      this._setFlags(this._flags + 1);
      for (const [nextX, nextY] of this._getSurrounding(x, y)) {
        const nextCell = this.grid[nextY][nextX];
        nextCell.touchingFlags++;
        // Emit this if it's just matched the number of mines
        if (
          nextCell.revealed &&
          nextCell.touchingFlags === nextCell.touchingMines
        ) {
          this._pushGridChange(nextX, nextY);
        }
      }
    } else {
      this._setFlags(this._flags - 1);
      for (const [nextX, nextY] of this._getSurrounding(x, y)) {
        const nextCell = this.grid[nextY][nextX];
        nextCell.touchingFlags--;
        // Emit this if it's just gone under the number of mines
        if (
          nextCell.revealed &&
          nextCell.touchingFlags === nextCell.touchingMines - 1
        ) {
          this._pushGridChange(nextX, nextY);
        }
      }
    }
    this._flushStateChange();
  }

  /**
   * Reveal squares around the point. Returns true if successful.
   */
  attemptSurroundingReveal(x: number, y: number): boolean {
    const cell = this.grid[y][x];

    if (
      !cell.revealed ||
      cell.touchingMines === 0 ||
      cell.touchingMines > cell.touchingFlags
    ) {
      return false;
    }

    let revealedSomething = false;

    for (const [nextX, nextY] of this._getSurrounding(x, y)) {
      const nextCell = this.grid[nextY][nextX];
      if (nextCell.flagged || nextCell.revealed) {
        continue;
      }
      revealedSomething = true;
      this._reveal(nextX, nextY);
    }

    if (!revealedSomething) {
      return false;
    }

    this._flushStateChange();
    return true;
  }

  private _flushStateChange() {
    if (Object.keys(this._stateChange).length === 0) {
      return;
    }
    if (!this._changeCallback) {
      throw Error("No function present to emit with");
    }
    this._changeCallback(this._stateChange);
    this._stateChange = {};
  }

  private _pushGridChange(x: number, y: number) {
    if (!this._stateChange.gridChanges) {
      this._stateChange.gridChanges = [];
    }

    this._stateChange.gridChanges.push([x, y, this.grid[y][x]]);

    if (this._stateChange.gridChanges.length >= FLUSH_GRID_CHANGE_THRESHOLD) {
      this._flushStateChange();
    }
  }

  private _setPlayMode(newMode: PlayMode) {
    if (this._playMode === newMode) {
      return;
    }
    this._playMode = newMode;
    this._stateChange.playMode = newMode;
  }

  private _setToReveal(newToReveal: number) {
    if (this._toReveal === newToReveal) {
      return;
    }
    this._toReveal = newToReveal;
    this._stateChange.toReveal = newToReveal;
  }

  private _setFlags(newFlags: number) {
    if (this._flags === newFlags) {
      return;
    }
    this._flags = newFlags;
    this._stateChange.flags = newFlags;
  }

  private _endGame(mode: PlayMode.Won | PlayMode.Lost) {
    this._setPlayMode(mode);
  }

  private _placeMines(avoidX: number, avoidY: number) {
    const flatCellIndexes: number[] = new Array(this._width * this._height)
      .fill(undefined)
      .map((_, i) => i);

    // Remove a 3x3 grid around the cell played.
    const indexesToRemove = [avoidY * this._width + avoidX];

    for (const [nextX, nextY] of this._getSurrounding(avoidX, avoidY)) {
      indexesToRemove.push(nextY * this._width + nextX);
    }

    indexesToRemove.sort((a, b) => a - b);

    for (const [removed, indexToRemove] of indexesToRemove.entries()) {
      flatCellIndexes.splice(indexToRemove - removed, 1);
    }

    // Place mines in remaining squares
    let minesToPlace = this._mines;

    while (minesToPlace) {
      const index = flatCellIndexes.splice(
        Math.floor(Math.random() * flatCellIndexes.length),
        1
      )[0];

      const x = index % this._width;
      const y = (index - x) / this._width;

      this.grid[y][x].hasMine = true;
      this._minedCells.push([x, y]);
      minesToPlace -= 1;

      for (const [nextX, nextY] of this._getSurrounding(x, y)) {
        this.grid[nextY][nextX].touchingMines++;
      }
    }

    this._setPlayMode(PlayMode.Playing);
  }

  private _getSurrounding(x: number, y: number): Array<[number, number]> {
    const surrounding: Array<[number, number]> = [];

    for (const nextY of [y - 1, y, y + 1]) {
      if (nextY < 0) {
        continue;
      }
      if (nextY >= this._height) {
        continue;
      }

      for (const nextX of [x - 1, x, x + 1]) {
        if (nextX < 0) {
          continue;
        }
        if (nextX >= this._width) {
          continue;
        }
        if (x === nextX && y === nextY) {
          continue;
        }

        surrounding.push([nextX, nextY]);
      }
    }

    return surrounding;
  }

  /**
   * When the user loses, reveal all the mines.
   */
  private _revealAllMines(initialX: number, initialY: number): void {
    // Ensure we push the clicked mine first.
    const initialCell = this.grid[initialY][initialX];
    initialCell.revealed = true;
    this._pushGridChange(initialX, initialY);

    for (const [x, y] of this._minedCells) {
      const cell = this.grid[y][x];
      if (cell === initialCell) {
        continue;
      }
      cell.revealed = true;
      this._pushGridChange(x, y);
    }
  }

  /**
   * @param x
   * @param y
   */
  private _reveal(x: number, y: number): void {
    // The set contains the cell position as if it were a single flat array.
    const revealSet = new Set<number>([x + y * this._width]);

    for (const value of revealSet) {
      const x = value % this._width;
      const y = (value - x) / this._width;

      const cell = this.grid[y][x];

      if (cell.revealed) {
        throw Error("Cell already revealed");
      }
      if (cell.hasMine) {
        this._revealAllMines(x, y);
        this._endGame(PlayMode.Lost);
        break;
      }

      cell.revealed = true;
      this._pushGridChange(x, y);

      this._setToReveal(this._toReveal - 1);

      if (this._toReveal === 0) {
        this._endGame(PlayMode.Won);
        break;
      }

      // Don't reveal the surrounding squares if this is touching a mine.
      if (cell.touchingMines) {
        continue;
      }

      for (const [nextX, nextY] of this._getSurrounding(x, y)) {
        const nextCell = this.grid[nextY][nextX];
        if (!nextCell.revealed && !nextCell.flagged) {
          revealSet.add(nextX + nextY * this._width);
        }
      }
    }
    this._flushStateChange();
  }
}
