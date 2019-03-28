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
import { Cell, GridChanges, State as GameState } from "../gamelogic/types";
import StateService, { StateUpdate } from "./state";

interface State {
  flags: number;
  state: GameState;
  grid: Cell[][];
}

export default async function localStateSubscribe(
  stateService: Remote<StateService>,
  callback: (newState: State, gridChanges: GridChanges) => void
) {
  const initialState = await stateService.getFullState();
  const { flags, state } = initialState;
  const { grid } = initialState;
  callback({ flags, state, grid }, []);

  stateService.subscribe(
    proxy((update: StateUpdate) => {
      const { flags, state } = update;

      for (const [x, y, cell] of update.gridChanges) {
        grid[y][x] = cell;
      }

      callback({ flags, state, grid }, update.gridChanges);
    })
  );
}
