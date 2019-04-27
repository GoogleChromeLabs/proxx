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
import { bind } from "src/utils/bind";
import { getCanvas } from "src/utils/canvas-pool";
import { getCellSizes, getPaddings } from "src/utils/cell-sizing";
import ShaderBox from "src/utils/shaderbox";
import { staticDevicePixelRatio } from "src/utils/static-dpr";
import {
  AnimationDesc,
  AnimationName,
  idleSprites,
  processDoneCallback,
  staticSprites
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
  spriteSize
} from "../constants";
import { Renderer } from "../renderer";
import { STATIC_TEXTURE } from "../texture-generators";
import fragmentShader from "./fragment.glsl";
import vertexShader from "./vertex.glsl";

const enum DynamicTileDataA {
  HAS_FOCUS,
  TILE_Y,
  STATIC_TILE,
  IDLE_ANIMATION_TIME
}

const enum DynamicTileDataB {
  HIGHLIGHT_OPACITY,
  FLASH_OPACITY,
  BORDER_OPACITY,
  BOXES_OPACITY
}

function generateCoords(x1: number, y1: number, x2: number, y2: number) {
  return [x1, y1, x1, y2, x2, y1, x2, y2];
}

function generateGameFieldMesh(
  numTilesX: number,
  numTilesY: number,
  tileSize: number
): Float32Array {
  // TODO optimize me (avoid allocations)
  const vertices = [];
  for (let y = 0; y < numTilesY; y++) {
    for (let x = 0; x < numTilesX; x++) {
      vertices.push(
        ...generateCoords(
          x * tileSize,
          y * tileSize,
          (x + 1) * tileSize,
          (y + 1) * tileSize
        )
      );
    }
  }
  return new Float32Array(vertices);
}

function generateVertexIndices(numTilesX: number, numTilesY: number) {
  // TODO optimize me (avoid allocations)
  const indices = [];
  for (let i = 0; i < numTilesX * numTilesY; i++) {
    indices.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
  }
  return indices;
}

export default class WebGlRenderer implements Renderer {
  private _canvas?: HTMLCanvasElement;
  private _dynamicTileDataB?: Float32Array;
  private _dynamicTileDataA?: Float32Array;
  private _shaderBox?: ShaderBox;
  private _numTilesX?: number;
  private _numTilesY?: number;
  private _lastFocus = [-1, -1];

  private _renderLoopRunning = false;

  createCanvas(): HTMLCanvasElement {
    this._canvas = getCanvas();
    this._canvas.setAttribute("aria-hidden", "true");
    return this._canvas;
  }

  init(numTilesX: number, numTilesY: number) {
    this._numTilesX = numTilesX;
    this._numTilesY = numTilesY;

    const { cellPadding, cellSize } = getCellSizes();
    const tileSize = (cellSize + 2 * cellPadding) * staticDevicePixelRatio;

    this._initShaderBox(numTilesX, numTilesY);
    this._setupMesh(numTilesX, numTilesY, tileSize);
    this._setupTextures();

    this._shaderBox!.setUniform1f("sprite_size", spriteSize);
    this._shaderBox!.setUniform1f("tile_size", tileSize);
    this._shaderBox!.setUniform1f("idle_frames", idleAnimationNumFrames);
    const { verticalPadding, horizontalPadding } = getPaddings();
    this._shaderBox!.setUniform2f("paddings", [
      horizontalPadding * staticDevicePixelRatio,
      verticalPadding * staticDevicePixelRatio
    ]);

    this._startRenderLoop();
  }

  updateFirstRect(rect: ClientRect | DOMRect) {
    this._assertShaderBox();
    this._shaderBox!.setUniform2f("offset", [
      rect.left * staticDevicePixelRatio,
      rect.top * staticDevicePixelRatio
    ]);
  }

  stop() {
    this._renderLoopRunning = false;
  }

  onResize() {
    if (!this._shaderBox) {
      return;
    }
    this._shaderBox!.resize();
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
    // Nothing to do here
  }

  afterCell(
    x: number,
    y: number,
    cell: Cell,
    animationList: AnimationDesc[],
    ts: number
  ) {
    // Nothing to do here
  }

  render(
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    this._assertShaderBox();
    // @ts-ignore
    this[animation.name](x, y, cell, animation, ts);

    this._updateDynamicTileData(x, y);
  }

  setFocus(x: number, y: number) {
    if (this._lastFocus[0] > -1) {
      const [lastX, lastY] = this._lastFocus;
      const dynamicTileDataA = this._getDynamicTileDataAForTile(lastX, lastY);
      dynamicTileDataA[DynamicTileDataA.HAS_FOCUS] = 0;
      this._updateDynamicTileData(lastX, lastY);
    }
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    dynamicTileDataA[DynamicTileDataA.HAS_FOCUS] = 1;
    this._updateDynamicTileData(x, y);
    this._lastFocus = [x, y];
  }

  private _updateDynamicTileData(x: number, y: number) {
    // Go through the _other_ 3 vertices and copy the (potentially modified)
    // dynamic tile data from vertex 0 to their respective buffers.
    // TODO: We can prevent running these loops by switching to ANGLE instanced
    // rendering.
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);
    for (let i = 1; i < 4; i++) {
      this._getDynamicTileDataAForTile(x, y, i).set(dynamicTileDataA);
      this._getDynamicTileDataBForTile(x, y, i).set(dynamicTileDataB);
    }
  }

  private [AnimationName.IDLE](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);
    const animationLength = idleAnimationLength;
    const normalized = ((ts - animation.start) / animationLength) % 1;

    dynamicTileDataA[DynamicTileDataA.IDLE_ANIMATION_TIME] = normalized;

    let fadeInNormalized =
      (ts - (animation.fadeStart || 0)) / fadeInAnimationLength;
    if (fadeInNormalized > 1) {
      fadeInNormalized = 1;
    }

    dynamicTileDataB[DynamicTileDataB.BOXES_OPACITY] = remap(
      0,
      1,
      1,
      fadedLinesAlpha,
      easeOutQuad(fadeInNormalized)
    );
    dynamicTileDataB[DynamicTileDataB.BORDER_OPACITY] = 1;
  }

  private [AnimationName.FLAGGED](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);

    const animationLength = idleAnimationLength;
    const normalized = ((ts - animation.start) / animationLength) % 1;

    dynamicTileDataA[DynamicTileDataA.IDLE_ANIMATION_TIME] = normalized;

    let fadeOutNormalized =
      (ts - (animation.fadeStart || 0)) / fadeOutAnimationLength;
    if (fadeOutNormalized > 1) {
      fadeOutNormalized = 1;
    }

    dynamicTileDataB[DynamicTileDataB.BOXES_OPACITY] = remap(
      0,
      1,
      fadedLinesAlpha,
      1,
      easeOutQuad(fadeOutNormalized)
    );
    dynamicTileDataB[DynamicTileDataB.BORDER_OPACITY] = 1;
  }

  private [AnimationName.NUMBER](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    if (ts < animation.start) {
      return;
    }
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);
    dynamicTileDataA[DynamicTileDataA.STATIC_TILE] = cell.touchingMines;

    dynamicTileDataB[DynamicTileDataB.BORDER_OPACITY] =
      cell.touchingMines <= 0 ? revealedAlpha : 0;
    dynamicTileDataB[DynamicTileDataB.BOXES_OPACITY] = 0;
  }

  private [AnimationName.HIGHLIGHT_IN](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);

    const animationLength = fadeInAnimationLength;
    let normalized = (ts - animation.start) / animationLength;

    if (normalized < 0) {
      normalized = 0;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }

    dynamicTileDataB[DynamicTileDataB.HIGHLIGHT_OPACITY] = easeOutQuad(
      normalized
    );
  }

  private [AnimationName.HIGHLIGHT_OUT](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);

    const animationLength = fadeOutAnimationLength;
    let normalized = (ts - animation.start) / animationLength;

    if (normalized < 0) {
      normalized = 0;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }

    dynamicTileDataB[DynamicTileDataB.HIGHLIGHT_OPACITY] =
      1 - easeOutQuad(normalized);
  }

  private [AnimationName.FLASH_IN](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);

    const animationLength = flashInAnimationLength;
    let normalized = (ts - animation.start) / animationLength;
    if (normalized < 0) {
      return;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }
    dynamicTileDataB[DynamicTileDataB.FLASH_OPACITY] = easeOutQuad(normalized);
  }

  private [AnimationName.FLASH_OUT](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);

    const animationLength = flashOutAnimationLength;
    let normalized = (ts - animation.start) / animationLength;
    if (normalized < 0) {
      return;
    }
    if (normalized > 1) {
      processDoneCallback(animation);
      normalized = 1;
    }
    dynamicTileDataB[DynamicTileDataB.FLASH_OPACITY] =
      1 - easeInOutCubic(normalized);
  }

  private [AnimationName.MINED](
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ) {
    const dynamicTileDataA = this._getDynamicTileDataAForTile(x, y);
    const dynamicTileDataB = this._getDynamicTileDataBForTile(x, y);
    dynamicTileDataA[DynamicTileDataA.STATIC_TILE] = STATIC_TEXTURE.MINE;

    dynamicTileDataB[DynamicTileDataB.BORDER_OPACITY] = 0;
    dynamicTileDataB[DynamicTileDataB.BOXES_OPACITY] = 0;
  }

  private _getDynamicTileDataAForTile(
    x: number,
    y: number,
    vertex: number = 0
  ): Float32Array {
    const tileOffset = y * this._numTilesX! + x;
    const vertexOffset = tileOffset * 4 + vertex;
    const floatOffset = vertexOffset * 4;
    const byteOffset = floatOffset * 4;
    return new Float32Array(this._dynamicTileDataA!.buffer, byteOffset, 4);
  }

  private _getDynamicTileDataBForTile(
    x: number,
    y: number,
    vertex: number = 0
  ): Float32Array {
    const tileOffset = y * this._numTilesX! + x;
    const vertexOffset = tileOffset * 4 + vertex;
    const floatOffset = vertexOffset * 4;
    const byteOffset = floatOffset * 4;
    return new Float32Array(this._dynamicTileDataB!.buffer, byteOffset, 4);
  }

  private _initShaderBox(numTilesX: number, numTilesY: number) {
    /**
     * We are setting up a WebGL context here.
     *
     * Per-vertex attributes:
     * - `pos`: Position of the vertex on screen in pixels. Starting at (0, 0)
     *   in the top left corner.
     * - `tile_uv`: UV coordinates within each tile. Top-left corner is (0, 0),
     *   bottom right corner is (1, 1).
     * - `dynamic_tile_data_a`: A `vec4` containing data according to the
     *   `DynamicTileDataA` enum
     * - `dynamic_tile_data_b`: A `vec4` containing data according to the
     *   `DynamicTileDataB` enum
     *
     * Uniforms:
     * - `offset`: Offset of the first tile’s top left corner from the top-left
     *   corner of the screen. This effectively makes sure our WebGL tiles are
     *   perfectly aligned with the inivisible table, including scroll position.
     * - `idle_sprites[n]`: Up to 4 texture samplers for the sprite of the idle
     *   animation.
     * - `static_sprite`: Sampler for the static sprite.
     * - `sprite_size`: A single float for the size of the sprites in pixels
     *   (they are assumed to be square).
     * - `tile_size`: A single float for the size of each tile in pixels.
     * - `idle_frames`: Number of frames the idle animation has.
     * - `paddings`: The vertical and horizontal paddings that define the fade-out.
     */
    this._shaderBox = new ShaderBox(vertexShader, fragmentShader, {
      canvas: this._canvas,
      uniforms: [
        "offset",
        "idle_sprites[0]",
        "idle_sprites[1]",
        "idle_sprites[2]",
        "idle_sprites[3]",
        "static_sprite",
        "sprite_size",
        "tile_size",
        "idle_frames",
        "paddings"
      ],
      scaling: staticDevicePixelRatio,
      mesh: [
        {
          dimensions: 2,
          name: "pos"
        },
        {
          dimensions: 2,
          name: "tile_uv"
        },
        {
          name: "dynamic_tile_data_a",
          dimensions: 4,
          usage: "DYNAMIC_DRAW"
        },
        {
          name: "dynamic_tile_data_b",
          dimensions: 4,
          usage: "DYNAMIC_DRAW"
        }
      ],
      indices: generateVertexIndices(numTilesX, numTilesY),
      clearColor: [0, 0, 0, 0]
    });
    this._shaderBox!.resize();
  }

  private _setupMesh(numTilesX: number, numTilesY: number, tileSize: number) {
    const mesh = generateGameFieldMesh(numTilesX, numTilesY, tileSize);
    this._shaderBox!.updateVBO("pos", mesh);

    // Repeat these UVs for all tiles.
    const uvs = [0, 1, 0, 0, 1, 1, 1, 0];
    this._shaderBox!.updateVBO(
      "tile_uv",
      mesh.map((_, idx) => uvs[idx % uvs.length])
    );

    const numTiles = numTilesX * numTilesY;
    this._dynamicTileDataA = new Float32Array(
      new Array(numTiles * 4 * 4).fill(0).map((_, idx) => {
        const fieldIdx = Math.floor(idx / 16);
        const x = fieldIdx % numTilesX;
        const y = Math.floor(fieldIdx / numTilesX);
        switch (idx % 4) {
          case DynamicTileDataA.HAS_FOCUS:
            return 0;
          case DynamicTileDataA.TILE_Y:
            return y;
          case DynamicTileDataA.STATIC_TILE:
            return -1; // Equivalent to “unrevealed”
          case DynamicTileDataA.IDLE_ANIMATION_TIME:
            return 0;
          default:
            return -1; // Never reached. Just to make TypeScript happy.
        }
      })
    );
    this._shaderBox!.updateVBO("dynamic_tile_data_a", this._dynamicTileDataA);

    this._dynamicTileDataB = new Float32Array(
      new Array(numTiles * 4 * 4).fill(0).map((_, idx) => {
        switch (idx % 4) {
          case DynamicTileDataB.BORDER_OPACITY:
            return 1;
          case DynamicTileDataB.BOXES_OPACITY:
            return fadedLinesAlpha;
          case DynamicTileDataB.FLASH_OPACITY:
            return 0;
          case DynamicTileDataB.HIGHLIGHT_OPACITY:
            return 0;
          default:
            return -1; // Never reached. Just to make TypeScript happy.
        }
      })
    );
    this._shaderBox!.updateVBO("dynamic_tile_data_b", this._dynamicTileDataB);
  }

  private _setupTextures() {
    // Due to the way internal WebGL state handling works, we
    // have to add all the textures first before we bind them.
    this._shaderBox!.addTexture(`staticSprite`, staticSprites![0]);
    for (let i = 0; i < idleSprites!.length; i++) {
      this._shaderBox!.addTexture(`idleSprite${i}`, idleSprites![i]);
    }

    for (let i = 0; i < idleSprites!.length; i++) {
      this._shaderBox!.activateTexture(`idleSprite${i}`, i + 1);
      this._shaderBox!.setUniform1i(`idle_sprites[${i}]`, i + 1);
    }
    this._shaderBox!.activateTexture(`staticSprite`, 0);
    this._shaderBox!.setUniform1i(`static_sprite`, 0);
  }

  private _startRenderLoop() {
    this._renderLoopRunning = true;
    requestAnimationFrame(this._renderLoop);
  }

  private _assertShaderBox() {
    if (!this._shaderBox) {
      throw Error("ShaderBox not initialized for WebGL renderer");
    }
  }

  @bind
  private _renderLoop() {
    this._shaderBox!.updateVBO("dynamic_tile_data_a", this._dynamicTileDataA!);
    this._shaderBox!.updateVBO("dynamic_tile_data_b", this._dynamicTileDataB!);

    this._shaderBox!.draw();
    if (this._renderLoopRunning) {
      requestAnimationFrame(this._renderLoop);
    }
  }
}
