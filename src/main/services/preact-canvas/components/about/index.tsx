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
import version from "consts:version";
import {
  about1,
  about2,
  about3,
  aboutCredit,
  aboutPrivacy,
  aboutSource,
  strActiveClue,
  strBlackHole,
  strCleared,
  strClickTheHighlightedCell,
  strClue,
  strCredit,
  strFlagged,
  strHowToPlay,
  strMoveDown,
  strMoveLeft,
  strMoveRight,
  strMoveUp,
  strPrivacyPolicy,
  strRightClickInstruction,
  strShortcuts,
  strSwitchBetweenClearAndFlagMode,
  strSystemInformation,
  strUnrevealed
} from "l20n:lazy";
import { Component, h } from "preact";
import {
  idleAnimationTextureDrawer,
  staticTextureDrawer
} from "src/main/rendering/animation";
import { turquoise } from "src/main/rendering/constants";
import { TextureDrawer } from "src/main/rendering/texture-cache";
import { STATIC_TEXTURE } from "src/main/rendering/texture-generators";
import { getCellSizes } from "src/main/utils/cell-sizing";
import { bind } from "src/utils/bind";
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
  supportsSufficientWebGL: boolean;
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
        <h1>{strHowToPlay}</h1>

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
            {strUnrevealed}
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
            {strBlackHole}
          </div>
        </div>

        {about1}

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
            {strCleared}
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
            {strClue}
          </div>
        </div>

        {about2}

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
            {strFlagged}
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
            {strActiveClue}
          </div>
        </div>

        {about3}

        <h1>{strShortcuts}</h1>

        {isFeaturePhone ? (
          <ul class={shortcutListStyle}>
            <li>
              <span class={shortcutKeyStyle} aria-label="5 key">
                5
              </span>
              {strMoveUp}
            </li>
            <li>
              <span class={shortcutKeyStyle} aria-label="0 key">
                0
              </span>
              {strMoveDown}
            </li>
            <li>
              <span class={shortcutKeyStyle} aria-label="7 key">
                7
              </span>
              {strMoveLeft}
            </li>
            <li>
              <span class={shortcutKeyStyle} aria-label="9 key">
                9
              </span>
              {strMoveRight}
            </li>
            <li>
              <span class={shortcutKeyStyle} aria-label="8 key">
                8
              </span>
              {strClickTheHighlightedCell}
            </li>
            <li>
              <span class={shortcutKeyStyle} aria-label="# key">
                #
              </span>
              {strSwitchBetweenClearAndFlagMode}
            </li>
          </ul>
        ) : (
          <ul class={shortcutListStyle}>
            <li>
              <span class={shortcutKeyStyle} aria-label="f key">
                F
              </span>
              {strSwitchBetweenClearAndFlagMode}
            </li>
            <li>
              <RightClick class={shortcutIconStyle} aria-label="Right click" />
              {strRightClickInstruction}
            </li>
          </ul>
        )}

        <h1>GitHub</h1>
        {aboutSource}

        <h1>{strPrivacyPolicy}</h1>
        {aboutPrivacy}

        <h1>{strCredit}</h1>
        {aboutCredit}

        <h1>{strSystemInformation}</h1>
        <ul class={systemDataStyle}>
          <li>Version: {version}</li>
          <li>Motion: {this.props.motion ? "true" : "false"}</li>
          <li>
            Supports WebGL:{" "}
            {this.props.supportsSufficientWebGL ? "true" : "false"}
          </li>
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
