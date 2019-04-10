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

import { Cell, GridChanges, State, Tag } from "./types.js";

function newCell(id: number): Cell {
  return {
    hasMine: false,
    id,
    revealed: false,
    tag: Tag.None,
    touching: -1
  };
}

export type ChangeCallback = (changes: GridChanges) => void;

export default class MinesweeperGame {
  get state() {
    return this._state;
  }

  get flags() {
    return this._flags;
  }
  static EMIT_THRESHOLD = 60;
  grid: Cell[][];
  startTime = 0;
  endTime = 0;
  private _state = State.Pending;
  private _toReveal = 0;
  private _flags = 0;
  private _lastEmit = 0;
  private _gridChanges: Array<[number, number]> = [];
  private _changeCallback?: ChangeCallback;

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
    if (_mines >= _width * _height) {
      throw Error("Number of mines cannot fit in grid");
    }

    this._toReveal = _width * _height - _mines;

    this.grid = Array(_height)
      .fill(undefined)
      .map((_, rowIdx) =>
        Array(_width)
          .fill(undefined)
          .map((_, cellIdx) => newCell(rowIdx * _width + cellIdx))
      );
  }

  subscribe(callback: ChangeCallback) {
    this._changeCallback = callback;
  }

  reveal(x: number, y: number) {
    if (this._state === State.Pending) {
      this._placeMines(x, y);
      this.startTime = Date.now();
    } else if (this._state !== State.Playing) {
      throw Error("Game is not in a playable state");
    }

    const cell = this.grid[y][x];

    if (cell.tag === Tag.Flag) {
      throw Error("Cell flagged");
    }

    this._reveal(x, y);
    this._emit();
  }

  tag(x: number, y: number, tag: Tag) {
    const cell = this.grid[y][x];
    if (cell.revealed) {
      throw Error("Revealed cell cannot be tagged");
    }
    if (cell.tag === tag) {
      return;
    }

    const oldTag = cell.tag;
    cell.tag = tag;
    this._pushGridChange(x, y);

    if (tag === Tag.Flag) {
      this._flags += 1;
    } else if (oldTag === Tag.Flag) {
      this._flags -= 1;
    }
    this._emit();
  }

  /**
   * Reveal squares around the point. Returns true if successful.
   */
  attemptSurroundingReveal(x: number, y: number): boolean {
    const cell = this.grid[y][x];
    const maybeReveal: Array<[number, number]> = [];

    if (!cell.revealed) {
      return false;
    }
    if (cell.touching === 0) {
      return false;
    }

    let flagged = 0;

    // Go around the surrounding. This will go over items already seen.
    const surroundingIndecies = this.getSurrounding(x, y);
    for (const [nextX, nextY] of surroundingIndecies) {
      const nextCell = this.grid[nextY][nextX];
      if (nextCell.tag === Tag.Flag) {
        flagged += 1;
        continue;
      }
      maybeReveal.push([nextX, nextY]);
    }

    if (flagged < cell.touching) {
      return false;
    }
    if (maybeReveal.length === 0) {
      return false;
    }

    for (const [nextX, nextY] of maybeReveal) {
      const nextCell = this.grid[nextY][nextX];
      if (nextCell.revealed) {
        continue;
      }
      this._reveal(nextX, nextY);
    }

    this._emit();
    return true;
  }

  private _emit() {
    if (this._gridChanges.length <= 0) {
      return;
    }
    if (!this._changeCallback) {
      throw Error("No function present to emit with");
    }
    this._changeCallback(
      this._gridChanges.map(([x, y]) => [x, y, this.grid[y][x]] as any)
    );
    this._gridChanges = [];
  }

  private _pushGridChange(x: number, y: number) {
    this._gridChanges.push([x, y]);
    let now = Date.now();
    if (now - this._lastEmit >= MinesweeperGame.EMIT_THRESHOLD) {
      this._emit();
      this._lastEmit = now;
    }
  }

  private _endGame(state: State.Won | State.Lost) {
    this._state = state;
    this.endTime = Date.now();
  }

  private _placeMines(avoidX: number, avoidY: number) {
    const cells: Cell[] = this.grid.reduce((cells, row) => {
      cells.push(...row);
      return cells;
    }, []);

    // Remove the cell played.
    cells.splice(avoidY * this._width + avoidX, 1);

    // Place mines in remaining squares
    let minesToPlace = this._mines;

    while (minesToPlace) {
      const index = Math.floor(Math.random() * cells.length);
      const cell = cells[index];
      cells.splice(index, 1);
      cell.hasMine = true;
      minesToPlace -= 1;
    }

    this._state = State.Playing;
  }

  private getSurrounding(x: number, y: number): Array<[number, number]> {
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
   * @param x
   * @param y
   * @param objsCloned A weakmap to track which objects have already been cloned.
   */
  private _reveal(x: number, y: number) {
    // The set contains the cell position as if it were a single flat array.
    const revealSet = new Set<number>([x + y * this._width]);
    this._lastEmit = Date.now();

    for (const value of revealSet) {
      const x = value % this._width;
      const y = (value - x) / this._width;

      const cell = this.grid[y][x];

      if (cell.revealed) {
        throw Error("Cell already revealed");
      }
      cell.revealed = true;

      if (cell.hasMine) {
        this._pushGridChange(x, y);
        this._endGame(State.Lost);
        return;
      }

      this._toReveal -= 1;

      if (this._toReveal === 0) {
        this._pushGridChange(x, y);
        this._endGame(State.Won);
        // Although the game is over, we still continue to calculate the touching value.
      }

      let touching = 0;
      const maybeReveal: number[] = [];

      // Go around the surrounding. This will go over items already seen.
      const surroundingIndecies = this.getSurrounding(x, y);
      for (const [nextX, nextY] of surroundingIndecies) {
        const nextCell = this.grid[nextY][nextX];

        if (nextCell.hasMine) {
          touching += 1;
        }
        if (nextCell.tag === Tag.Flag || nextCell.revealed) {
          continue;
        }
        maybeReveal.push(nextX + nextY * this._width);
      }

      cell.touching = touching;
      this._pushGridChange(x, y);

      // Don't reveal the surrounding squares if this is touching a mine.
      if (touching !== 0) {
        continue;
      }

      for (const num of maybeReveal) {
        revealSet.add(num);
      }
    }
    this._emit();
  }
}
