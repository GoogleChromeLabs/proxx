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

import { Component, h } from "preact";

import { bind } from "../../../../utils/bind.js";

import ShaderBox from "../../../../utils/shaderbox.js";
import {
  dangerMode as dangerModeStyle,
  nebula as nebulaStyle,
  notDangerMode as notDangerModeStyle
} from "./style.css";

import { ShaderColor } from "src/rendering/constants.js";
import { debug } from "../../../../utils/constants";
import fragmentShader from "./fragment.glsl";
import vertexShader from "./vertex.glsl";

export interface Props {
  useAltColor: boolean;
  mainColorLight: ShaderColor;
  mainColorDark: ShaderColor;
  altColorLight: ShaderColor;
  altColorDark: ShaderColor;
}

interface State {}

export default class Nebula extends Component<Props, State> {
  private _timePeriod = 60000;
  private _fadeSpeed = 10;
  private _altColorBlend = 0;
  private _shaderBox?: ShaderBox;
  private _loopRunning = false;

  componentDidMount() {
    this._shaderBox = new ShaderBox(vertexShader, fragmentShader, {
      canvas: this.base as HTMLCanvasElement,
      scaling: 1 / 5,
      uniforms: [
        "alt_color",
        "time",
        "nebula_movement_range",
        "nebula_zoom",
        "vortex_strength",
        "circle1_offset",
        "circle2_offset",
        "circle3_offset",
        "alt_color_dark",
        "alt_color_light",
        "main_color_dark",
        "main_color_light"
      ]
    });
    if (!this._shaderBox) {
      return;
    }

    this._shaderBox.setUniform1f("alt_color", 0);
    this._shaderBox.setUniform1f("nebula_movement_range", 2);
    this._shaderBox.setUniform1f("nebula_zoom", 0.5);
    this._shaderBox.setUniform1f("vortex_strength", 0.1);
    this._shaderBox.setUniform1f("circle1_offset", 0);
    this._shaderBox.setUniform1f("circle2_offset", 1.4);
    this._shaderBox.setUniform1f("circle3_offset", 0);
    this._onResize();
    this._updateColors();

    window.addEventListener("resize", this._onResize);
    this._start();

    if (debug) {
      import("../../../../services/debug/index.js").then(m =>
        m.nebula(this, this._shaderBox!)
      );
    }
  }

  componentWillUnmount() {
    if (!this._shaderBox) {
      return;
    }
    this._stop();
    window.removeEventListener("resize", this._onResize);
  }

  render({ useAltColor }: Props) {
    this._updateColors();
    return (
      <canvas
        class={`${nebulaStyle} ${
          useAltColor ? dangerModeStyle : notDangerModeStyle
        }`}
        aria-hidden="true"
      />
    );
  }

  private _updateColors() {
    if (this._shaderBox) {
      this._shaderBox.setUniform4f("alt_color_dark", this.props.altColorDark);
      this._shaderBox.setUniform4f("alt_color_light", this.props.altColorLight);
      this._shaderBox.setUniform4f("main_color_dark", this.props.mainColorDark);
      this._shaderBox.setUniform4f(
        "main_color_light",
        this.props.mainColorLight
      );
    }
  }

  private _start() {
    if (this._loopRunning) {
      return;
    }
    this._loopRunning = true;
    requestAnimationFrame(this._loop);
  }

  private _stop() {
    this._loopRunning = false;
  }

  @bind
  private _onResize() {
    if (!this._shaderBox) {
      return;
    }
    this._shaderBox.resize();
  }

  @bind
  private _loop(ts: number) {
    this._shaderBox!.setUniform1f(
      "time",
      (ts % this._timePeriod) / this._timePeriod
    );
    this._altColorBlend +=
      ((this.props.useAltColor ? 1 : 0) - this._altColorBlend) /
      this._fadeSpeed;
    this._shaderBox!.setUniform1f("alt_color", this._altColorBlend);
    this._shaderBox!.draw();
    if (this._loopRunning) {
      requestAnimationFrame(this._loop);
    }
  }
}
