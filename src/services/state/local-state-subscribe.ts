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
import StateService, { State, StateName, StateUpdate, UpdateType } from ".";
import {
  Cell,
  GridChanges,
  State as GameState
} from "../../gamelogic/types.js";

export default async function localStateSubscribe(
  stateService: Remote<StateService>,
  callback: (newState: State, gridChanges: GridChanges) => void
) {
  let state = await stateService.getFullState();
  callback(state, []);

  stateService.subscribe(
    proxy((update: StateUpdate) => {
      switch (update.type) {
        case UpdateType.FULL_STATE:
          state = update.newState;
          callback(state, []);
          break;
        case UpdateType.GRID_PATCH:
          if (
            state.name !== StateName.WAITING_TO_PLAY &&
            state.name !== StateName.PLAYING
          ) {
            throw Error("Received patch in invalid state");
          }
          for (const [x, y, cell] of update.gridChanges) {
            state.grid[x][y] = cell;
          }
          callback(state, update.gridChanges);
          break;
      }
    })
  );
}
