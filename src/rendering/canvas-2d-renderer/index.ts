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

import { Cell } from "src/gamelogic/types";
import { getCanvas } from "src/utils/canvas-pool";
import { getCellSizes, getPaddings } from "src/utils/cell-sizing";
import { staticDevicePixelRatio } from "src/utils/static-display";
import {
  AnimationDesc,
  AnimationName,
  idleAnimationTextureDrawer,
  processDoneCallback,
  staticTextureDrawer
} from "../animation";
import { easeInOutCubic, easeOutQuad, remap } from "../animation-helpers";
import {
  fadedLinesAlpha,
  fadeInAnimationLength,
  fadeOutAnimationLength,
  flashInAnimationLength,
  flashOutAnimationLength,
  idleAnimationLength,
  idleAnimationNumFrames,
  revealedAlpha,
  turquoise
} from "../constants";
import { Renderer } from "../renderer";
import { STATIC_TEXTURE } from "../texture-generators";
import { getTime } from "../time-provider";

interface GridEntry {
  x: number;
  y: number;
  cell?: Cell;
  animationList: AnimationDesc[];
}

interface FadeOutGradient {
  gradient: CanvasGradient;
  rect: DOMRect;
}

export default class Canvas2DRenderer implements Renderer {
  private _canvas?: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D | null;
  private _firstCellRect?: DOMRect | ClientRect;
  private _canvasRect?: DOMRect | ClientRect;
  private _tileSize?: number;
  private _grid: GridEntry[] = [];
  private _numTilesX?: number;
  private _numTilesY?: number;
  private _lastFocus = [-1, -1];
  private _gradients?: FadeOutGradient[];

  get numTiles() {
    return this._numTilesX! * this._numTilesY!;
  }

  createCanvas(): HTMLCanvasElement {
    this._canvas = getCanvas("2d");
    this._ctx = this._canvas!.getContext("2d");
    if (!this._ctx) {
      throw Error("Could not instantiate 2D renderer");
    }
    return this._canvas;
  }

  init(numTilesX: number, numTilesY: number) {
    this._numTilesX = numTilesX;
    this._numTilesY = numTilesY;
    this._updateTileSize();

    this._initGrid();
    this.onResize();
  }

  updateFirstRect(rect: ClientRect | DOMRect) {
    this._firstCellRect = rect;

    this._rerender();
  }

  stop() {
    // Nothing to do here
  }

  onResize() {
    if (!this._canvas) {
      return;
    }
    this._updateTileSize();
    this._canvasRect = this._canvas!.getBoundingClientRect();
    this._canvas.width = this._canvasRect.width * staticDevicePixelRatio;
    this._canvas.height = this._canvasRect.height * staticDevicePixelRatio;
    this._prepareGradients();
    this._rerender();
  }

  beforeRenderFrame() {
    // Nothing to do here
  }

  beforeCell(
    x: number,
    y: number,
    cell: Cell,
    animationList: AnimationDesc[],
    ts: number
  ) {
    this._ctx!.save();
    this._setupContextForTile(x, y);
    this._ctx!.clearRect(0, 0, this._tileSize!, this._tileSize!);
    this._ctx!.restore();

    const gridCell = this._grid[y * this._numTilesX! + x];
    gridCell.animationList = animationList.slice();
    gridCell.cell = cell;
  }

  afterCell(
    x: number,
    y: number,
    cell: Cell,
    animationList: AnimationDesc[],
    ts: number
  ) {
    this._maybeRenderFocusRing(x, y);
  }

  render(
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    if (!this._isTileInView(x, y)) {
      return;
    }
    this._ctx!.save();
    this._setupContextForTile(x, y);
    // @ts-ignore
    this[animation.name](x, y, cell, animation, ts);
    this._ctx!.restore();
  }

  setFocus(x: number, y: number) {
    if (this._lastFocus[0] > -1 && this._lastFocus[1] > -1) {
      const [lastX, lastY] = this._lastFocus;
      this._lastFocus = [-1, -1];
      this._rerenderCell(lastX, lastY, { clear: true });
    }
    this._lastFocus = [x, y];
    if (x > -1 && y > -1) {
      this._rerenderCell(x, y, { clear: true });
    }
  }

  private _updateTileSize() {
    const { cellPadding, cellSize } = getCellSizes();
    // This does _not_ need to get multiplied by `devicePixelRatio` as we will
    // be scaling the canvas instead.
    this._tileSize = cellSize + 2 * cellPadding;
  }

  private _initGrid() {
    const start = getTime();
    this._grid = new Array(this.numTiles);

    for (let y = 0; y < this._numTilesY!; y++) {
      for (let x = 0; x < this._numTilesX!; x++) {
        this._grid[y * this._numTilesX! + x] = {
          animationList: [
            {
              name: AnimationName.IDLE,
              start
            }
          ],
          x,
          y
        };
      }
    }
  }

  private _setupContextForTile(x: number, y: number) {
    this._ctx!.scale(staticDevicePixelRatio, staticDevicePixelRatio);
    // Adjust for scroll position
    this._ctx!.translate(this._firstCellRect!.left, this._firstCellRect!.top);
    // Put tile that is supposed to be rendered at (0, 0)
    this._ctx!.translate(x * this._tileSize!, y * this._tileSize!);
  }

  private _isTileInView(bx: number, by: number) {
    if (!this._firstCellRect) {
      return false;
    }
    const { left, top, width, height } = this._firstCellRect;
    const x = bx * width + left;
    const y = by * height + top;
    if (
      x + width < 0 ||
      y + height < 0 ||
      x > this._canvasRect!.width ||
      y > this._canvasRect!.height
    ) {
      return false;
    }
    return true;
  }

  private [AnimationName.IDLE](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const animationLength = idleAnimationLength;
    const normalized = ((ts - animation.start) / animationLength) % 1;
    const idx = Math.floor(normalized * idleAnimationNumFrames);

    let fadeInNormalized =
      (ts - (animation.fadeStart || 0)) / fadeInAnimationLength;
    if (fadeInNormalized > 1) {
      fadeInNormalized = 1;
    }

    this._ctx!.save();
    this._ctx!.globalAlpha = remap(
      0,
      1,
      1,
      fadedLinesAlpha,
      easeOutQuad(fadeInNormalized)
    );
    idleAnimationTextureDrawer!(idx, this._ctx!, this._tileSize!);
    this._ctx!.globalAlpha = 1;
    staticTextureDrawer!(STATIC_TEXTURE.OUTLINE, this._ctx!, this._tileSize!);
    staticTextureDrawer!(
      STATIC_TEXTURE.INNER_CIRCLE,
      this._ctx!,
      this._tileSize!
    );
    this._ctx!.restore();
  }

  private [AnimationName.FLAGGED](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const animationLength = idleAnimationLength;
    const normalized = ((ts - animation.start) / animationLength) % 1;
    const idx = Math.floor(normalized * idleAnimationNumFrames);

    let fadeOutNormalized =
      (ts - (animation.fadeStart || 0)) / fadeOutAnimationLength;
    if (fadeOutNormalized > 1) {
      fadeOutNormalized = 1;
    }

    this._ctx!.save();
    this._ctx!.globalAlpha = remap(
      0,
      1,
      fadedLinesAlpha,
      1,
      easeOutQuad(fadeOutNormalized)
    );
    idleAnimationTextureDrawer!(idx, this._ctx!, this._tileSize!);
    this._ctx!.globalAlpha = 1;
    staticTextureDrawer!(STATIC_TEXTURE.OUTLINE, this._ctx!, this._tileSize!);
    staticTextureDrawer!(
      STATIC_TEXTURE.INNER_CIRCLE,
      this._ctx!,
      this._tileSize!
    );
    staticTextureDrawer!(STATIC_TEXTURE.DOT, this._ctx!, this._tileSize!);
    this._ctx!.restore();
  }

  private [AnimationName.NUMBER](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    this._ctx!.save();
    if (cell.touchingMines > 0) {
      staticTextureDrawer!(cell.touchingMines, this._ctx!, this._tileSize!);
    } else {
      this._ctx!.globalAlpha = revealedAlpha;
      staticTextureDrawer!(STATIC_TEXTURE.OUTLINE, this._ctx!, this._tileSize!);
    }
    this._ctx!.restore();
  }

  private [AnimationName.MINED](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    if (animation.start > ts) {
      return;
    }
    staticTextureDrawer!(STATIC_TEXTURE.MINE, this._ctx!, this._tileSize!);
  }

  private [AnimationName.HIGHLIGHT_IN](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const start = animation.fadeStart || animation.start;
    const animationLength = fadeInAnimationLength;
    let normalized = (ts - start) / animationLength;

    if (normalized < 0) {
      normalized = 0;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }

    this._ctx!.save();
    this._ctx!.globalCompositeOperation = "source-atop";
    this._ctx!.globalAlpha = easeOutQuad(normalized);
    this._ctx!.fillStyle = turquoise;
    this._ctx!.fillRect(
      0,
      0,
      this._firstCellRect!.width,
      this._firstCellRect!.height
    );
    this._ctx!.restore();
  }

  private [AnimationName.HIGHLIGHT_OUT](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const start = animation.fadeStart || animation.start;
    const animationLength = fadeOutAnimationLength;
    let normalized = (ts - start) / animationLength;

    if (normalized < 0) {
      normalized = 0;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }

    this._ctx!.save();
    this._ctx!.globalCompositeOperation = "source-atop";
    this._ctx!.globalAlpha = 1 - easeOutQuad(normalized);
    this._ctx!.fillStyle = turquoise;
    this._ctx!.fillRect(
      0,
      0,
      this._firstCellRect!.width,
      this._firstCellRect!.height
    );
    this._ctx!.restore();
  }

  private [AnimationName.FLASH_IN](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const animationLength = flashInAnimationLength;
    let normalized = (ts - animation.start) / animationLength;
    if (normalized < 0) {
      return;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }
    this._ctx!.save();
    this._ctx!.globalAlpha = easeOutQuad(normalized);
    staticTextureDrawer!(STATIC_TEXTURE.FLASH, this._ctx!, this._tileSize!);
    this._ctx!.restore();
  }

  private [AnimationName.FLASH_OUT](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const animationLength = flashOutAnimationLength;
    let normalized = (ts - animation.start) / animationLength;
    if (normalized < 0) {
      return;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }
    this._ctx!.save();
    this._ctx!.globalAlpha = 1 - easeInOutCubic(normalized);
    staticTextureDrawer!(STATIC_TEXTURE.FLASH, this._ctx!, this._tileSize!);
    this._ctx!.restore();
  }

  private _rerender() {
    this._ctx!.clearRect(0, 0, this._canvas!.width, this._canvas!.height);

    for (let y = 0; y < this._numTilesY!; y++) {
      for (let x = 0; x < this._numTilesX!; x++) {
        const { cell, animationList } = this._grid[y * this._numTilesX! + x];
        const ts = getTime();
        for (const animation of animationList) {
          this.render(x, y, cell!, animation, ts);
        }
        this._maybeRenderFocusRing(x, y);
      }
    }

    this._drawFadeOut();
  }

  private _drawFadeOut() {
    const ctx = this._ctx!;
    ctx.save();
    ctx.scale(staticDevicePixelRatio, staticDevicePixelRatio);
    ctx.globalCompositeOperation = "destination-out";
    for (const { gradient, rect } of this._gradients!) {
      ctx.fillStyle = gradient;
      this._ctx!.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.restore();
  }

  private _prepareGradients() {
    const ctx = this._ctx!;
    ctx.save();
    ctx.scale(staticDevicePixelRatio, staticDevicePixelRatio);
    const { verticalPadding, horizontalPadding } = getPaddings();
    const { width, height } = this._canvasRect!;

    const gradients = [
      // Left border gradient
      {
        start: [0, 0],
        end: [horizontalPadding, 0],
        rect: new DOMRect(0, 0, horizontalPadding, height),
        whitePoint: 0
      },
      // Top border gradient
      {
        start: [0, 0],
        end: [0, verticalPadding],
        rect: new DOMRect(0, 0, width, verticalPadding),
        whitePoint: 0.5
      },
      // Right border gradient
      {
        start: [width, height],
        end: [width - horizontalPadding, height],
        rect: new DOMRect(
          width - horizontalPadding,
          0,
          horizontalPadding,
          height
        ),
        whitePoint: 0
      },
      // Bottom border gradient
      {
        start: [width, height],
        end: [width, height - verticalPadding],
        rect: new DOMRect(0, height - verticalPadding, width, verticalPadding),
        whitePoint: 0.5
      }
    ];

    this._gradients = gradients.map(({ start, end, rect, whitePoint }) => {
      const gradient = ctx.createLinearGradient(
        start[0],
        start[1],
        end[0],
        end[1]
      );
      gradient.addColorStop(whitePoint, "#fff");
      gradient.addColorStop(1, "transparent");
      return { gradient, rect };
    });
    ctx.restore();
  }

  private _rerenderCell(x: number, y: number, { clear = false } = {}) {
    if (clear) {
      this._ctx!.save();
      this._setupContextForTile(x, y);
      this._ctx!.clearRect(0, 0, this._tileSize!, this._tileSize!);
      this._ctx!.restore();
    }
    const { cell, animationList } = this._grid[y * this._numTilesX! + x];
    const ts = getTime();
    for (const animation of animationList) {
      this.render(x, y, cell!, animation, ts);
    }
    this._maybeRenderFocusRing(x, y);
  }

  private _maybeRenderFocusRing(x: number, y: number) {
    if (this._lastFocus[0] !== x || this._lastFocus[1] !== y) {
      return;
    }
    this._ctx!.save();
    this._setupContextForTile(x, y);
    staticTextureDrawer!(STATIC_TEXTURE.FOCUS, this._ctx!, this._tileSize!);
    this._ctx!.restore();
  }
}
