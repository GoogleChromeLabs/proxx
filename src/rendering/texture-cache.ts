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

// Wraps an existing TextureGenerator and caches the generated
// frames in a sprite.
export function cacheTextureGenerator(
  f: TextureGenerator,
  textureSize: number,
  numFrames: number
): TextureGenerator {
  const cacheCanvas = document.createElement("canvas");
  // Allegedly, Chrome, Firefox and Safari have a maximum canvas size of 32k
  // pixels. We are *definitely* below that, but for some reason the draws to
  // the sprite sheet just seem to stop happening at higher indices when
  // tileSize is big (due to high dPR for exampe). The maxWidth of 8192 has been
  // determined by trial and error and seems to be safe.
  const maxWidth = 8192;
  const framesPerRow = Math.floor(
    maxWidth / (textureSize * staticDevicePixelRatio)
  );
  const rows = Math.ceil(numFrames / framesPerRow);
  cacheCanvas.width = framesPerRow * textureSize * staticDevicePixelRatio;
  cacheCanvas.height = rows * textureSize * staticDevicePixelRatio;
  const renderedTiles = new Set<number>();
  const cacheCtx = cacheCanvas.getContext("2d")!;
  if (!cacheCtx) {
    throw Error("Could not instantiate 2D rendering context");
  }
  cacheCtx.scale(staticDevicePixelRatio, staticDevicePixelRatio);

  return (idx: number, ctx: CanvasRenderingContext2D) => {
    idx = Math.floor(idx % numFrames);
    const x = idx % framesPerRow;
    const y = Math.floor(idx / framesPerRow);
    const cacheX = x * textureSize;
    const cacheY = y * textureSize;
    if (!renderedTiles.has(idx)) {
      cacheCtx.save();
      cacheCtx.translate(cacheX, cacheY);
      f(idx, cacheCtx);
      cacheCtx.restore();
      renderedTiles.add(idx);
    }
    ctx.drawImage(
      cacheCanvas,
      cacheX * staticDevicePixelRatio,
      cacheY * staticDevicePixelRatio,
      textureSize * staticDevicePixelRatio,
      textureSize * staticDevicePixelRatio,
      0,
      0,
      textureSize,
      textureSize
    );
  };
}
