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
import HydratableComponent, {
  HydratableProps
} from "../hydratable-component/index.js";

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

function fieldValueAsNumber(el: any): number {
  if (!(el instanceof HTMLInputElement)) {
    throw Error("Invalid element");
  }
  return Number(el.value);
}

export default class Intro extends HydratableComponent<
  HydratableProps<Props, State>,
  State
> {
  static hydrate(el: Element | null): State {
    if (!el) {
      return {
        height: 10,
        numBombs: 10,
        width: 10
      };
    }
    return {
      height: fieldValueAsNumber(el.querySelector("[name=height]")),
      numBombs: fieldValueAsNumber(el.querySelector("[name=numBombs]")),
      width: fieldValueAsNumber(el.querySelector("[name=width]"))
    };
  }

  render(
    { id, spinner }: HydratableProps<Props, State>,
    { width, height, numBombs }: State
  ) {
    return (
      <div class={introStyle} id={id}>
        <label>
          Width:
          <input
            type="number"
            name="width"
            min="10"
            max="40"
            step="1"
            value={width}
            onChange={this.onChange}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            name="height"
            min="10"
            max="40"
            step="1"
            value={height}
            onChange={this.onChange}
          />
        </label>
        <label>
          #bombs:
          <input
            type="number"
            name="numBombs"
            min="1"
            max={width * height}
            step="1"
            value={numBombs}
            onChange={this.onChange}
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
  private onChange(ev: Event) {
    if (!(ev.target instanceof HTMLInputElement)) {
      return;
    }
    this.setState({ [ev.target.name]: Number(ev.target.value) } as any);
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
