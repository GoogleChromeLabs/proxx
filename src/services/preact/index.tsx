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
import { Component, h, render } from "preact";

import StateService, { State } from "../state.js";

import Game from "./components/game/index.js";

interface Props {
  stateService: Remote<StateService>;
}

class PreactService extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    props.stateService.state.then(state => this.setState(state));
    props.stateService.subscribe(proxy((state: State) => this.setState(state)));
  }

  render({ stateService }: Props, { grid }: State) {
    if (!grid) {
      return <div />;
    }
    return <Game grid={grid} stateService={stateService} />;
  }
}

export function game(stateService: Remote<StateService>) {
  render(<PreactService stateService={stateService} />, document.body, document
    .body.firstChild as any);
}
