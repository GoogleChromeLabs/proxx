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
import { h } from "preact";
import { bind } from "../../../../utils/bind.js";
import StateService from "../../../state/index.js";

import {
  button as buttonStyle,
  intro as introStyle,
  spinner as spinnerStyle
} from "./style.css";

export interface Props {
  stateService: Remote<StateService>;
  spinner: boolean;
}

interface State {
  width: number;
  height: number;
  numBombs: number;
}

function fieldValueAsNumber(ev: Event): number {
  if (!ev.target || !(ev.target instanceof HTMLInputElement)) {
    throw Error("Invalid element");
  }
  return Number(ev.target.value);
}

export default class Intro extends Component<Props, State> {
  constructor() {
    super();
    this.setState({ width: 10, height: 10, numBombs: 10 });
  }

  render({ spinner }: Props, { width, height, numBombs }: State) {
    return (
      <div class={introStyle}>
        <label>
          Width:
          <input
            type="number"
            min="10"
            max="40"
            step="1"
            value={width}
            onChange={ev => this.setState({ width: fieldValueAsNumber(ev) })}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            min="10"
            max="40"
            step="1"
            value={height}
            onChange={ev => this.setState({ height: fieldValueAsNumber(ev) })}
          />
        </label>
        <label>
          #bombs:
          <input
            type="number"
            min="1"
            max={width * height}
            step="1"
            value={numBombs}
            onChange={ev => this.setState({ numBombs: fieldValueAsNumber(ev) })}
          />
        </label>
        <button
          onClick={this._startGame}
          class={[buttonStyle, spinner ? spinnerStyle : ""].join(" ")}
          disabled={spinner}
        >
          {spinner ? "Loading" : "New game"}
        </button>
      </div>
    );
  }

  @bind
  private _startGame() {
    this.props.stateService.initGame(
      this.state.width,
      this.state.height,
      this.state.numBombs
    );
  }
}
