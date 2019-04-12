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

import {
  button as buttonStyle,
  gameSetting as gameSettingStyle,
  intro as introStyle,
  manualSettings as manualSettingsStyle,
  spinner as spinnerStyle
} from "./style.css";

const presets = {
  advanced: { width: 16, height: 16, mines: 40 },
  beginner: { width: 8, height: 8, mines: 10 },
  expert: { width: 24, height: 24, mines: 99 }
};

type PresetName = keyof typeof presets;

export interface Props {
  stateService: Remote<StateService>;
  spinner: boolean;
}

interface State {
  presetName: PresetName | "custom";
  width: number;
  height: number;
  mines: number;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    presetName: "beginner",
    ...presets.beginner
  };

  private _presetSelect?: HTMLSelectElement;
  private _widthInput?: HTMLInputElement;
  private _heightInput?: HTMLInputElement;
  private _minesInput?: HTMLInputElement;

  render({ spinner }: Props, { width, height, mines, presetName }: State) {
    return (
      <div class={introStyle}>
        <form onSubmit={this._startGame}>
          <h1>Graviton</h1>
          <label>
            Preset:
            <select
              ref={el => (this._presetSelect = el)}
              onChange={this._onSelectChange}
              value={presetName}
            >
              <option value="beginner">Beginner</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
              <option value="custom">Custom</option>
            </select>
          </label>
          <div class={manualSettingsStyle}>
            <label class={gameSettingStyle}>
              Width:
              <input
                type="number"
                min="5"
                max="40"
                step="1"
                value={width}
                ref={el => (this._widthInput = el)}
                onChange={this._onSettingInput}
              />
            </label>
            <label class={gameSettingStyle}>
              Height:
              <input
                type="number"
                min="5"
                max="40"
                step="1"
                value={height}
                ref={el => (this._heightInput = el)}
                onChange={this._onSettingInput}
              />
            </label>
            <label class={gameSettingStyle}>
              Black holes:
              <input
                type="number"
                min="1"
                max={width * height}
                step="1"
                value={mines}
                ref={el => (this._minesInput = el)}
                onChange={this._onSettingInput}
              />
            </label>
          </div>
          <button
            class={[buttonStyle, spinner ? spinnerStyle : ""].join(" ")}
            disabled={spinner}
          >
            {spinner ? "Loading" : "Start"}
          </button>
        </form>
      </div>
    );
  }

  @bind
  private _onSelectChange() {
    const presetName = this._presetSelect!.value as PresetName | "custom";

    if (presetName === "custom") {
      this.setState({ presetName });
      return;
    }

    const preset = presets[presetName];

    this.setState({
      height: preset.height,
      mines: preset.mines,
      presetName,
      width: preset.width
    });
  }

  @bind
  private _onSettingInput() {
    const width = this._widthInput!.valueAsNumber;
    const height = this._heightInput!.valueAsNumber;
    const mines = this._minesInput!.valueAsNumber;

    for (const [presetName, preset] of Object.entries(presets)) {
      if (
        width === preset.width &&
        height === preset.height &&
        mines === preset.mines
      ) {
        this.setState({
          height: preset.height,
          mines: preset.mines,
          presetName: presetName as PresetName,
          width: preset.width
        });
        return;
      }
    }

    this.setState({
      height,
      mines: mines >= width * height ? width * height - 1 : mines,
      presetName: "custom",
      width
    });
  }

  @bind
  private _startGame(event: Event) {
    event.preventDefault();

    this.props.stateService.initGame(
      this.state.width,
      this.state.height,
      this.state.mines
    );
  }
}
