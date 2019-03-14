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
import { proxy, Remote } from "comlink";
import { Cell, State as GameState } from "../gamelogic/types";
import StateService, { StateUpdate } from "./state";

interface State {
  flags: number;
  state: GameState;
  grid: Cell[][];
}

/**
 * This 'avoids' mutating the grid, so it's easier to identify changes in Preact etc.
 *
 * @param x
 * @param y
 * @param newCell
 * @param objsCloned Objects that don't need cloning again.
 */
function changeCellInGrid(
  grid: Cell[][],
  x: number,
  y: number,
  newCell: Cell,
  objsCloned: WeakSet<any>
): Cell[][] {
  // Grid
  if (!objsCloned.has(grid)) {
    grid = grid.slice();
    objsCloned.add(grid);
  }
  // Row
  if (!objsCloned.has(grid[y])) {
    grid[y] = grid[y].slice();
    objsCloned.add(grid[y]);
  }
  // Cell
  grid[y][x] = newCell;

  return grid;
}

export default async function localStateSubscribe(
  stateService: Remote<StateService>,
  callback: (newState: State) => void
) {
  const initialState = await stateService.getFullState();
  const { flags, state } = initialState;
  let { grid } = initialState;
  callback({ flags, state, grid });

  stateService.subscribe(
    proxy((update: StateUpdate) => {
      const objsCloned = new WeakSet();
      const { flags, state } = update;

      for (const [x, y, cell] of update.gridChanges) {
        grid = changeCellInGrid(grid, x, y, cell, objsCloned);
      }

      callback({ flags, state, grid });
    })
  );
}
