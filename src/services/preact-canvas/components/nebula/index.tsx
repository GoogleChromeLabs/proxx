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
import { nebula as nebulaStyle, nebulaContainer } from "./style.css";

import { Color, toShaderColor } from "src/rendering/constants.js";
import toRGB from "src/utils/to-rgb.js";
import { debug } from "../../../../utils/constants";
import fragmentShader from "./fragment.glsl";
import vertexShader from "./vertex.glsl";

export interface Props {
  colorLight: Color;
  colorDark: Color;
  useMotion: boolean;
}

const metaTheme = document.querySelector('meta[name="theme-color"]')!;

interface State {}

export default class Nebula extends Component<Props, State> {
  private _timePeriod = 60000;
  private _fadeSpeed = 10;
  private _colorBlend = 0;
  private _shaderBox?: ShaderBox;
  private _loopRunning = false;
  private _prevColors: Color[] = [];

  componentDidMount() {
    // if no animation mode, skip WebGL setup
    if (this.props.useMotion) {
      this._initShaderbox();
    }
    window.addEventListener("resize", this._onResize);
  }

  shouldComponentUpdate({ colorLight, colorDark, useMotion }: Props) {
    if (useMotion !== this.props.useMotion) {
      return true;
    }
    const didLightColorChange = !colorEqual(this.props.colorLight, colorLight);
    const didDarkColorChange = !colorEqual(this.props.colorDark, colorDark);
    return didLightColorChange || didDarkColorChange;
  }

  componentWillUnmount() {
    this._stop();
    window.removeEventListener("resize", this._onResize);
  }

  componentWillUpdate() {
    if (!this._shaderBox) {
      return;
    }
    this._prevColors = [this.props.colorLight, this.props.colorDark];
    this._colorBlend = 0;
  }

  componentDidUpdate(oldProps: Props) {
    if (this.props.useMotion !== oldProps.useMotion) {
      if (this.props.useMotion) {
        this._initShaderbox();
      } else {
        this._stop();
      }
    }
    this._updateColors();
  }

  render({ colorLight, colorDark, useMotion }: Props) {
    return (
      <div
        class={nebulaContainer}
        style={`background: linear-gradient(to bottom, ${toRGB(
          colorLight
        )}, ${toRGB(colorDark)}`}
      >
        {useMotion && <canvas class={nebulaStyle} aria-hidden="true" />}
      </div>
    );
  }

  private _initShaderbox() {
    this._shaderBox = new ShaderBox(vertexShader, fragmentShader, {
      canvas: this.base!.querySelector("canvas")! as HTMLCanvasElement,
      scaling: 1 / 5,
      antialias: false,
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

    this._shaderBox.setUniform1f("alt_color", 0);
    this._shaderBox.setUniform1f("nebula_movement_range", 2);
    this._shaderBox.setUniform1f("nebula_zoom", 0.5);
    this._shaderBox.setUniform1f("vortex_strength", 0.1);
    this._shaderBox.setUniform1f("circle1_offset", 0);
    this._shaderBox.setUniform1f("circle2_offset", 1.4);
    this._shaderBox.setUniform1f("circle3_offset", 0);
    this._onResize();

    this._prevColors = [this.props.colorLight, this.props.colorDark];
    this._updateColors();

    this._start();

    if (debug) {
      import("../../../../services/debug/index.js").then(m =>
        m.nebula(this, this._shaderBox!)
      );
    }
  }

  private _updateColors() {
    const colorDark = this.props.colorDark;

    metaTheme.setAttribute(
      "content",
      `rgb(${colorDark[0]}, ${colorDark[1]}, ${colorDark[2]})`
    );

    if (!this._shaderBox) {
      return;
    }
    this._shaderBox.setUniform4f(
      "main_color_light",
      toShaderColor(this._prevColors[0])
    );
    this._shaderBox.setUniform4f(
      "main_color_dark",
      toShaderColor(this._prevColors[1])
    );
    this._shaderBox.setUniform4f(
      "alt_color_light",
      toShaderColor(this.props.colorLight)
    );
    this._shaderBox.setUniform4f("alt_color_dark", toShaderColor(colorDark));
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
    this._colorBlend += (1 - this._colorBlend) / this._fadeSpeed;
    this._shaderBox!.setUniform1f("alt_color", this._colorBlend);
    this._shaderBox!.draw();
    if (this._loopRunning) {
      requestAnimationFrame(this._loop);
    }
  }
}

function colorEqual(c1: Color, c2: Color): boolean {
  return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2];
}
