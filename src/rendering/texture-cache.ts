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

import { TextureGenerator } from "./texture-generators.js";

// Wraps an existing TextureGenerator and caches the generated
// frames in a sprite.
export function cacheTextureGenerator(
  f: TextureGenerator,
  textureSize: number,
  numFrames: number
): TextureGenerator {
  const cacheCanvas = document.createElement("canvas");
  // Allegedly, Chrome’s maximum canvas size is 32k pixels, which we are *not*
  // hitting. However, the higher the `devicePixelRatio`, the more often I see
  // the textures not getting painted at the higher values. Breaking it into
  // a couple of rows fixes it :shrug:
  const rows = Math.ceil(self.devicePixelRatioCopy);
  const framesPerRow = Math.ceil(numFrames / rows);
  cacheCanvas.width = framesPerRow * textureSize * self.devicePixelRatioCopy;
  cacheCanvas.height = rows * textureSize * self.devicePixelRatioCopy;
  const renderedTiles = new Set<number>();
  const cacheCtx = cacheCanvas.getContext("2d")!;
  if (!cacheCtx) {
    throw Error("Could not instantiate 2D rendering context");
  }
  cacheCtx.scale(self.devicePixelRatioCopy, self.devicePixelRatioCopy);

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
      cacheX * self.devicePixelRatioCopy,
      cacheY * self.devicePixelRatioCopy,
      textureSize * self.devicePixelRatioCopy,
      textureSize * self.devicePixelRatioCopy,
      0,
      0,
      textureSize,
      textureSize
    );
  };
}
