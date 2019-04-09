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

import { Texture, TextureGenerator } from "./texture-generators.js";

// Wraps an existing TextureGenerator and caches the generated
// frames in a sprite.
export function cacheTextureGenerator(
  f: TextureGenerator,
  textureSize: number,
  numFrames: number
): TextureGenerator {
  const oneOffCanvas = document.createElement("canvas");
  const cacheCanvas = document.createElement("canvas");
  // TODO: Is a square-ish canvas size better for some reason?
  cacheCanvas.width = numFrames * textureSize;
  cacheCanvas.height = textureSize;
  const renderedTiles = new Set<number>();
  const ctx = cacheCanvas.getContext("2d")!;
  if (!ctx) {
    throw Error("Could not instantiate 2D rendering context");
  }
  return (idx: number): Texture => {
    idx = Math.floor(idx % numFrames);
    const x = idx;
    const y = 0;
    const cacheX = x * textureSize;
    const cacheY = y * textureSize;
    if (!renderedTiles.has(idx)) {
      const { source, sx, sy, sw, sh } = f(idx, { canvas: oneOffCanvas });
      ctx.drawImage(
        source,
        sx,
        sy,
        sw,
        sh,
        cacheX,
        cacheY,
        textureSize,
        textureSize
      );
      renderedTiles.add(idx);
    }
    return {
      source: cacheCanvas,
      sx: cacheX,
      sy: cacheY,
      sw: textureSize,
      sh: textureSize
    };
  };
}
