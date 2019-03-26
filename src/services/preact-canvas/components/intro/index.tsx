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
import { Component, h } from "preact";
import { bind } from "../../../../utils/bind.js";
import StateService from "../../../state/index.js";

import { button as buttonStyle } from "./style.css";

export interface Props {
  stateService: Remote<StateService>;
}

export default class Intro extends Component<Props> {
  render() {
    return (
      <button onClick={this.init} class={buttonStyle}>
        New game
      </button>
    );
  }

  @bind
  private init() {
    this.props.stateService.initGame(10, 10, 10);
  }
}
