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
import { RightClick } from "../icons/additional";
import {
  aboutWrapper as aboutWrapperStyle,
  iconGuideItem,
  iconGuideRow,
  shortcutIcon as shortcutIconStyle,
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
        <h1>How to play</h1>

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
              data-circle="true"
              data-dot="false"
            />
            Unrevealed
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
              data-circle="false"
              data-dot="false"
            />
            Black hole
          </div>
        </div>

        <p>
          An unrevealed tile might have a black hole behind it, it might not.
          The idea is to clear all the tiles that <strong>don't</strong> have
          black holes behind them.
        </p>

        <p>
          But, the thing about a black hole – its main distinguishing feature –
          is it's black. And the thing about space, the color of space, your
          basic space color, is black. So how are you supposed to avoid them?
          Here's how:
        </p>

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
              data-circle="false"
            />
            Cleared
          </div>
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
              data-circle="false"
              data-dot="false"
            />
            Clue
          </div>
        </div>

        <p>
          If you avoid a black hole, the number tells you how many of the 8
          surrounding tiles are a black hole. If it's blank,{" "}
          <strong>none</strong> of the surrounding tiles is a black hole.
        </p>

        <p>If you think you know where a black hole is, flag it!</p>

        <div class={iconGuideRow}>
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
              data-circle="true"
              data-dot="true"
            />
            Flagged
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
              data-circle="false"
              data-dot="false"
            />
            Active clue
          </div>
        </div>

        <p>
          Switch into flag mode, and tap the suspected tile. Once you've flagged
          enough tiles around a clue, it'll become active. Tap an active clue to
          clear all the non-flagged tiles around it.
        </p>

        <h1>Shortcuts</h1>

        <ul class={shortcutListStyle}>
          <li>
            <span class={shortcutKeyStyle} aria-label="f key">
              F
            </span>
            Switch between Clear and Flag mode
          </li>
          <li>
            <RightClick class={shortcutIconStyle} aria-label="Right click" />
            Do the opposite. Flag when in clear mode, or clear when in flag
            mode.
          </li>
        </ul>

        <h1>Github</h1>
        <p>
          Source code can be found at our{" "}
          <a href="https://github.com/GoogleChromeLabs/proxx">
            Github repository
          </a>
          .
        </p>

        <h1>Privacy policy</h1>
        <p>
          Google Analytics is used to record{" "}
          <a href="https://support.google.com/analytics/answer/6004245?ref_topic=2919631">
            basic visit data
          </a>
          . Highscores and your user preference are saved locally. No additional
          data is sent to the server.
        </p>

        <h1>System Information</h1>
        <ul class={systemDataStyle}>
          <li>Version: {version}</li>
          <li>Motion: {this.props.motion ? "true" : "false"}</li>
          <li>Feature Phone: {isFeaturePhone ? "yes" : "no"}</li>
          <li>
            Standalone Mode:{" "}
            {window.matchMedia("(display-mode: standalone)").matches
              ? "yes"
              : "no"}
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
    const hasCircle = canvas.dataset.circle!.toLowerCase() === "true";
    if (hasCircle) {
      staticTextureDrawer!(STATIC_TEXTURE.INNER_CIRCLE, ctx, this._tileSize!);
    }
    const hasDot = canvas.dataset.dot!.toLowerCase() === "true";
    if (hasDot) {
      staticTextureDrawer!(STATIC_TEXTURE.DOT, ctx, this._tileSize!);
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
