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
import { Component, h, render } from "preact";
import {
  Cell,
  GridChanges,
  State as GameState
} from "../../gamelogic/types.js";
import StateService from "../state/index.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import End from "./components/end/index.js";
import Game from "./components/game/index.js";

interface Props {
  stateService: Remote<StateService>;
}

interface State {
  grid?: Cell[][];
  flags: number;
  state: GameState;
}

export type GridChangeSubscriptionCallback = (gridChanges: GridChanges) => void;

class PreactService extends Component<Props, State> {
  state: State = {
    flags: 0,
    state: GameState.Pending
  };

  private gridChangeSubscribers = new Set<GridChangeSubscriptionCallback>();

  constructor(props: Props) {
    super(props);

    localStateSubscribe(props.stateService, (newState, gridChanges) => {
      this.setState(newState);
      this.gridChangeSubscribers.forEach(f => f(gridChanges));
    });
  }

  render({ stateService }: Props, { state, grid }: State) {
    switch (state) {
      case GameState.Pending:
        return <h1>NOT IMPLEMENTED</h1>;
      case GameState.Playing: {
        if (!grid) {
          return <div />;
        }
        return (
          <Game
            grid={grid}
            gridChangeSubscribe={(f: GridChangeSubscriptionCallback) =>
              this.gridChangeSubscribers.add(f)
            }
            stateService={stateService}
          />
        );
      }
      case GameState.Won:
      case GameState.Lost:
        return <End state={state} time={0} />;
    }
  }
}

export function game(stateService: Remote<StateService>) {
  render(<PreactService stateService={stateService} />, document.body, document
    .body.firstChild as any);
}
