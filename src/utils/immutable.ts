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

export function changeCell<T>(
  grid: T[][],
  x: number,
  y: number,
  objsCloned: WeakSet<any> = new WeakSet()
): T[][] {
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
  if (!objsCloned.has(grid[y][x])) {
    grid[y][x] = { ...grid[y][x] };
    objsCloned.add(grid[y][x]);
  }
  return grid;
}
