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

import { staticDevicePixelRatio } from "../utils/static-dpr.js";
import { TextureGenerator } from "./texture-generators.js";

export type TextureDrawer = (
  idx: number,
  ctx: CanvasRenderingContext2D,
  cellSize: number
) => void;

export interface SizeConstraints {
  maxWidth: number;
  maxHeight: number;
}

const defaultSizeConstraints = {
  // Allegedly, Chrome, Firefox and Safari have a maximum canvas size of 32k
  // pixels. We are *definitely* below that, but for some reason the draws to
  // the sprite sheet just seem to stop happening at higher indices when
  // tileSize is big (due to high dPR for exampe). The maxWidth of 8192 has been
  // determined by trial and error and seems to be safe.
  maxWidth: 8192,
  maxHeight: 32768
};

// Wraps an existing TextureGenerator and caches the generated
// frames in a sprite.
export function cacheTextureGenerator(
  f: TextureGenerator,
  textureSize: number,
  numFrames: number,
  constraints: Partial<SizeConstraints> = {}
): TextureDrawer {
  const { maxWidth, maxHeight } = { ...defaultSizeConstraints, ...constraints };
  const maxFramesPerRow = Math.floor(
    maxWidth / (textureSize * staticDevicePixelRatio)
  );
  const maxRowsPerSprite = Math.floor(
    maxHeight / (textureSize * staticDevicePixelRatio)
  );
  const maxFramesPerSprite = maxFramesPerRow * maxRowsPerSprite;
  const numSprites = Math.ceil(numFrames / maxFramesPerSprite);

  const caches = new Array(numSprites).fill(0).map((_, idx) => {
    const framesLeftToCache = numFrames - idx * maxFramesPerSprite;
    const width =
      Math.min(maxFramesPerRow, framesLeftToCache) *
      textureSize *
      staticDevicePixelRatio;
    const height =
      Math.min(
        maxRowsPerSprite,
        Math.ceil(framesLeftToCache / maxFramesPerRow)
      ) *
      textureSize *
      staticDevicePixelRatio;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw Error("Could not instantiate 2D rendering context");
    }
    ctx.scale(staticDevicePixelRatio, staticDevicePixelRatio);
    return { canvas, ctx };
  });

  const renderedTiles = new Set<number>();

  return (
    idx: number,
    targetCtx: CanvasRenderingContext2D,
    cellSize: number
  ) => {
    idx = Math.floor(idx % numFrames);
    const sprite = Math.floor(idx / maxFramesPerSprite);
    const idxInSprite = idx % maxFramesPerSprite;
    const x = idxInSprite % maxFramesPerRow;
    const y = Math.floor(idxInSprite / maxFramesPerRow);

    const { canvas, ctx } = caches[sprite];
    const cacheX = x * textureSize;
    const cacheY = y * textureSize;
    if (!renderedTiles.has(idx)) {
      ctx.save();
      ctx.translate(cacheX, cacheY);
      f(idx, ctx);
      ctx.restore();
      renderedTiles.add(idx);
    }
    targetCtx.drawImage(
      canvas,
      cacheX * staticDevicePixelRatio,
      cacheY * staticDevicePixelRatio,
      textureSize * staticDevicePixelRatio,
      textureSize * staticDevicePixelRatio,
      0,
      0,
      cellSize,
      cellSize
    );
  };
}
