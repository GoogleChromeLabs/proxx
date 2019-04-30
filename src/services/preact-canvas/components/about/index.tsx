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
import { version } from "consts:";
import { Component, h } from "preact";
import {
  idleAnimationTextureDrawer,
  staticTextureDrawer
} from "src/rendering/animation";
import { turquoise } from "src/rendering/constants";
import { TextureDrawer } from "src/rendering/texture-cache";
import { STATIC_TEXTURE } from "src/rendering/texture-generators";
import { bind } from "src/utils/bind";
import { getCellSizes } from "src/utils/cell-sizing";
import {
  isFeaturePhone,
  staticDevicePixelRatio
} from "../../../../utils/static-display";
import { Arrow } from "../icons/initial";
import {
  aboutWrapper as aboutWrapperStyle,
  iconGuide,
  iconGuideItem,
  iconGuideRow,
  shortcutKey as shortcutKeyStyle,
  shortcutList as shortcutListStyle,
  systemData as systemDataStyle,
  tile as tileStyle
} from "./style.css";

interface Props {
  motion: boolean;
  texturePromise: Promise<any>;
}

let navigator: any;
navigator = window.navigator;

export default class About extends Component<Props> {
  private _tileSize: number;

  constructor() {
    super();
    const { cellPadding, cellSize } = getCellSizes();
    this._tileSize = (cellSize + 2 * cellPadding) * staticDevicePixelRatio;
  }

  render() {
    return (
      <div class={aboutWrapperStyle}>
        <h1>About</h1>

        <h2>How to play</h2>
        <p>
          You are on a space mission to a galaxy far away. Your job is to survey
          the space field and flag where black holes are.
        </p>
        <p>
          If the square you click on is not a black hole, you'll see how many of
          its neighboring 8 squares are black holes. Use the right click or
          change to Flag mode then click to flag where you think the black holes
          are and clear all of the squares without hitting a black hole to win.
        </p>

        <div class={iconGuide}>
          <div class={iconGuideRow}>
            <div class={iconGuideItem}>
              <canvas
                class={tileStyle}
                ref={this._renderCanvas}
                width={this._tileSize}
                height={this._tileSize}
                data-sprite="idle"
                data-frame="0"
                data-highlight="false"
                data-border="true"
              />
              Unrevealed
            </div>
            <div class={iconGuideItem}>
              <canvas
                class={tileStyle}
                ref={this._renderCanvas}
                width={this._tileSize}
                height={this._tileSize}
                data-sprite="idle"
                data-frame="0"
                data-highlight="true"
                data-border="true"
              />
              Flagged
            </div>
          </div>
          <div class={iconGuideRow}>
            <div class={iconGuideItem}>
              <canvas
                class={tileStyle}
                ref={this._renderCanvas}
                width={this._tileSize}
                height={this._tileSize}
                data-sprite="none"
                data-frame="0"
                data-highlight="false"
                data-border="true"
              />
              Revealed
            </div>
            <div class={iconGuideItem}>
              <canvas
                class={tileStyle}
                ref={this._renderCanvas}
                width={this._tileSize}
                height={this._tileSize}
                data-sprite="static"
                data-frame={STATIC_TEXTURE.MINE.toString()}
                data-highlight="false"
                data-border="false"
              />
              Black hole
            </div>
          </div>
          <div class={iconGuideRow}>
            <div class={iconGuideItem}>
              <canvas
                class={tileStyle}
                ref={this._renderCanvas}
                width={this._tileSize}
                height={this._tileSize}
                data-sprite="static"
                data-frame={STATIC_TEXTURE.NUMBER_1.toString()}
                data-highlight="false"
                data-border="false"
              />
              Clue
            </div>
            <div class={iconGuideItem}>
              <canvas
                class={tileStyle}
                ref={this._renderCanvas}
                width={this._tileSize}
                height={this._tileSize}
                data-sprite="static"
                data-frame={STATIC_TEXTURE.NUMBER_1.toString()}
                data-highlight="true"
                data-border="false"
              />
              Active clue
            </div>
          </div>
        </div>

        <h2>Keyboard Shortcuts</h2>
        <ul class={shortcutListStyle}>
          <li>
            <span class={shortcutKeyStyle} aria-label="f key">
              F
            </span>
            Switch between Clear and Flag mode
          </li>
        </ul>

        <h2>Github</h2>
        <p>
          Source code can be found at our{" "}
          <a href="https://github.com/GoogleChromeLabs/proxx">
            Github repository
          </a>
          .
        </p>

        <h2>Privacy policy</h2>
        <p>
          Google Analytics is used to record{" "}
          <a href="https://support.google.com/analytics/answer/6004245?ref_topic=2919631">
            basic visit data
          </a>
          . Highscores and your user preference are saved locally. No additional
          data is sent to the server.
        </p>

        <h2>System Information</h2>
        <ul class={systemDataStyle}>
          <li>Version: {version} </li>
          <li>Motion: {this.props.motion ? "true" : "false"}</li>
          <li>Feature Phone: {isFeaturePhone ? "yes" : "no"}</li>
          <li>
            Standalone Mode:{" "}
            {window.matchMedia("(display-mode: standalone)").matches
              ? "yes"
              : "no"}{" "}
          </li>
          <li>Screen Width: {window.innerWidth}px</li>
          <li>Screen Height: {window.innerHeight}px</li>
          <li>DPR: {staticDevicePixelRatio}</li>
          <li>Device Memory: {navigator.deviceMemory}</li>
          <li>Concurrency: {navigator.hardwareConcurrency}</li>
          <li>UA: {navigator.userAgent}</li>
        </ul>
      </div>
    );
  }

  @bind
  private async _renderCanvas(canvas: HTMLCanvasElement) {
    await this.props.texturePromise;

    const spriteName = canvas.dataset.sprite;
    let drawer: TextureDrawer | null = null;
    switch (spriteName) {
      case "idle":
        drawer = idleAnimationTextureDrawer!;
        break;
      case "static":
        drawer = staticTextureDrawer!;
        break;
    }

    const ctx = canvas.getContext("2d")!;
    ctx.save();
    if (drawer) {
      const frame = Number(canvas.dataset.frame);
      drawer(frame, ctx, this._tileSize);
    }

    const hasBorder = canvas.dataset.border!.toLowerCase() === "true";
    if (hasBorder) {
      staticTextureDrawer!(STATIC_TEXTURE.OUTLINE, ctx, this._tileSize!);
    }
    const hasHighlight = canvas.dataset.highlight!.toLowerCase() === "true";
    if (hasHighlight) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = turquoise;
      ctx.fillRect(0, 0, this._tileSize!, this._tileSize!);
    }
    ctx.restore();
  }
}
