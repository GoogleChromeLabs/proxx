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
import { Cell, GridChanges, State as GameState } from "../../gamelogic/types";
import localStateSubscribe from "../local-state-subscribe";
import StateService from "../state.js";
import Game from "./components/game/index.js";
import TiltImage from "./components/tilt-image/index.js";

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
  private tiltImage = new TiltImage("http://placekitten.com/g/2000/2000");

  private gridChangeSubscribers = new Set<GridChangeSubscriptionCallback>();

  constructor(props: Props) {
    super(props);

    localStateSubscribe(props.stateService, (newState, gridChanges) => {
      this.setState(newState);
      this.gridChangeSubscribers.forEach(f => f(gridChanges));
    });
  }

  render({ stateService }: Props, { grid }: State) {
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
}

export function game(stateService: Remote<StateService>) {
  render(<PreactService stateService={stateService} />, document.body, document
    .body.firstChild as any);
}
