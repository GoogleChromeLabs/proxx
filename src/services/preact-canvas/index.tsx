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
import { Component, h, render, VNode } from "preact";
import { GridChanges } from "../../gamelogic/types.js";
import StateService, { State as GameState, StateName } from "../state/index.js";
import initialState from "../state/initial-state.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import deferred from "./components/deferred";
import Intro from "./components/intro/index.js";
import Settings from "./components/settings";
import { game as gameClassName, mainContainer } from "./style.css";

interface Props {
  stateServicePromise: Promise<Remote<StateService>>;
}

interface State {
  state: GameState;
  stateService?: Remote<StateService>;
}

export type GridChangeSubscriptionCallback = (gridChanges: GridChanges) => void;

// tslint:disable-next-line:variable-name
const Game = deferred(
  import("./components/game/index.js").then(m => m.default)
);
// tslint:disable-next-line:variable-name
const End = deferred(import("./components/end/index.js").then(m => m.default));

class PreactService extends Component<Props, State> {
  state: State = {
    state: { ...initialState }
  };

  private gridChangeSubscribers = new Set<GridChangeSubscriptionCallback>();

  constructor(props: Props) {
    super(props);
    this._init(props);
  }

  render(_props: Props, { state, stateService }: State) {
    let mainComponent: VNode;

    switch (state.name) {
      case StateName.START:
        mainComponent = (
          <Intro stateService={stateService!} spinner={!stateService} />
        );
        break;
      case StateName.WAITING_TO_PLAY:
      case StateName.PLAYING:
        mainComponent = (
          <Game
            loading={() => <div />}
            grid={state.grid}
            gridChangeSubscribe={(f: GridChangeSubscriptionCallback) =>
              this.gridChangeSubscribers.add(f)
            }
            stateService={stateService!}
          />
        );
        break;
      case StateName.END:
        mainComponent = (
          <End
            loading={() => <div />}
            type={state.endType}
            restart={() => stateService!.reset()}
          />
        );
        break;
      default:
        throw Error("Unexpected game state");
    }

    return (
      <div class={gameClassName}>
        <div class={mainContainer}>{mainComponent}</div>
        <div>
          <Settings />
        </div>
      </div>
    );
  }

  private async _init(props: Props) {
    const stateService = await props.stateServicePromise;
    await stateService.ready;
    this.setState({ stateService });

    localStateSubscribe(stateService, (newState, gridChanges) => {
      if (gridChanges) {
        this.gridChangeSubscribers.forEach(f => f(gridChanges));
      }
      this.setState({ state: newState });
    });
  }
}

export async function game(stateService: Promise<Remote<StateService>>) {
  const container = document.body.querySelector("main")!;
  render(
    <PreactService stateServicePromise={stateService} />,
    container,
    container.firstChild as any
  );
  performance.mark("UI ready");
}
