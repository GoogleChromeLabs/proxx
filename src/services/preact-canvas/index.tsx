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
import { Component, ComponentFactory, h, render } from "preact";
import { Cell, GridChanges } from "../../gamelogic/types.js";
import { iuu } from "../../utils/iuu.js";
import StateService, { State as GameState, StateName } from "../state/index.js";
import initialState from "../state/initial-state.js";
import localStateSubscribe from "../state/local-state-subscribe.js";
import Intro from "./components/intro/index.js";
import ResolveComponent from "./components/resolve/index.js";

interface Props {
  stateServicePromise: Promise<Remote<StateService>>;
}

interface State {
  state: GameState;
  stateService?: Remote<StateService>;
}

export type GridChangeSubscriptionCallback = (gridChanges: GridChanges) => void;

class PreactService extends Component<Props, State> {
  state: State = {
    state: { ...initialState }
  };

  private gameComponentLoader = iuu(() => import("./components/game/index.js"));
  private endComponentLoader = iuu(() => import("./components/end/index.js"));
  private gridChangeSubscribers = new Set<GridChangeSubscriptionCallback>();

  constructor(props: Props) {
    super(props);
    this._init(props);
  }

  render(_props: Props, { state, stateService }: State) {
    switch (state.name) {
      case StateName.START:
        return <Intro stateService={stateService!} spinner={!stateService} />;
      case StateName.WAITING_TO_PLAY:
      case StateName.PLAYING:
        this.gameComponentLoader.trigger();
        return (
          <ResolveComponent<
            ComponentFactory<import("./components/game/index.js").Props>
          >
            promise={this.gameComponentLoader.promise.then(m => m.default)}
            // tslint:disable-next-line:variable-name Need uppercase for JSX
            onResolve={Game => (
              // TODO: Implement an unsubscribe for when the unmounting happens
              <Game
                grid={state.grid}
                gridChangeSubscribe={(f: GridChangeSubscriptionCallback) =>
                  this.gridChangeSubscribers.add(f)
                }
                stateService={stateService!}
              />
            )}
          />
        );
      case StateName.END:
        this.endComponentLoader.trigger();
        return (
          <ResolveComponent<
            ComponentFactory<import("./components/end/index.js").Props>
          >
            promise={this.endComponentLoader.promise.then(m => m.default)}
            // tslint:disable-next-line:variable-name Need uppercase for JSX
            onResolve={End => (
              <End type={state.endType} restart={() => stateService!.reset()} />
            )}
          />
        );
    }
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
