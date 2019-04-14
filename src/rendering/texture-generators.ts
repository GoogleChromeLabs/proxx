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

import { roundedRectangle } from "./canvas-helper.js";

import { deg2rad, remap, smoothpulse } from "./animation-helpers.js";

export type TextureGenerator = (
  idx: number,
  ctx: CanvasRenderingContext2D
) => void;

export function unrevealedAnimationTextureGeneratorFactory(
  textureSize: number,
  numFrames: number
): TextureGenerator {
  return (idx: number, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, textureSize, textureSize);

    const ts = Math.floor(idx % numFrames) / numFrames;
    // A litte buffer on each size for the border
    const size = textureSize * 0.97;
    ctx.save();
    ctx.translate(textureSize / 2, textureSize / 2);

    const halfSize = size / 2;

    roundedRectangle(ctx, -halfSize, -halfSize, size, size, (size * 76) / 650);
    ctx.clip();

    ctx.strokeStyle = "white";

    ctx.lineWidth = (size * 6) / 650;
    const numRects = 5;
    const magnification = remap(0, 1, 1, 1.4, smoothpulse(0, 0.5, 0.5, 1, ts));
    for (let i = 0; i < numRects; i++) {
      ctx.save();
      const offset = ((numRects - i) / numRects) * 0.14;
      const angle =
        5 +
        i * 9 +
        (i * (i + 1)) / 2 +
        smoothpulse(0, 0.5 + offset, 0.5 + offset, 1, ts) * 180;
      ctx.rotate(deg2rad(-angle));
      const subsize = size * magnification * (0.92 - 0.13 * i);
      roundedRectangle(
        ctx,
        -subsize / 2,
        -subsize / 2,
        subsize,
        subsize,
        subsize * 0.12
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };
}

export const enum STATIC_TEXTURE {
  OUTLINE,
  NUMBER_1, // = 1
  NUMBER_2,
  NUMBER_3,
  NUMBER_4,
  NUMBER_5,
  NUMBER_6,
  NUMBER_7,
  NUMBER_8, // = 8
  NUMBER_HIGHLIGHTER,
  LAST_MARKER // Not a valid frame, just a marker for the last item in the enum
}
export function staticTextureGeneratorFactory(
  textureSize: number
): TextureGenerator {
  return (idx: number, ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, textureSize, textureSize);

    const size = textureSize * 0.97;
    const halfSize = size / 2;
    ctx.save();
    ctx.translate(textureSize / 2, textureSize / 2);
    if (idx === STATIC_TEXTURE.OUTLINE) {
      ctx.strokeStyle = "white";

      // Inner circle
      ctx.lineWidth = (size * 20) / 650;
      const radius = (size * 64) / 650;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.arc(0, 0, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();

      // Outline
      // Size: 650, stroke: 20, radius: 76
      roundedRectangle(
        ctx,
        -halfSize,
        -halfSize,
        size,
        size,
        (size * 76) / 650
      );
      ctx.lineWidth = (size * 20) / 650;
      ctx.stroke();
    } else if (idx >= 1 && idx <= 8) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = (size * 20) / 650;
      ctx.beginPath();
      ctx.arc(0, 0, halfSize * 0.9, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${size / 2}px sans-serif`;
      ctx.fillText(`${idx}`, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  };
}
