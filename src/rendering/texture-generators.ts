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

import {
  deg2rad,
  easeInOutCubic,
  easeOutCubic,
  remap,
  smoothpulse
} from "./animation-helpers.js";

export interface Texture {
  source: CanvasImageSource;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface TextureGeneratorOpts {
  canvas?: HTMLCanvasElement;
}

export type TextureGenerator = (
  idx: number,
  opts?: TextureGeneratorOpts
) => Texture;

export function unrevealedAnimationTextureGeneratorFactory(
  textureSize: number,
  numFrames: number
): TextureGenerator {
  return (idx: number, opts: TextureGeneratorOpts = {}): Texture => {
    const cvs = opts.canvas || document.createElement("canvas");
    cvs.width = cvs.height = textureSize;
    const ctx = cvs.getContext("2d");
    if (!ctx) {
      throw Error("Could not instantiate 2D rendering context");
    }
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

    // Inner circle
    ctx.lineWidth = (size * 20) / 650;
    const radius = ((size * 64) / 650) * magnification;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    // Outline
    // Size: 650, stroke: 20, radius: 76
    roundedRectangle(ctx, -halfSize, -halfSize, size, size, (size * 76) / 650);
    ctx.lineWidth = (size * 20) / 650;
    ctx.stroke();

    ctx.restore();
    return {
      source: cvs,
      sx: 0,
      sy: 0,
      sw: textureSize,
      sh: textureSize
    };
  };
}

export function revealAnimationTextureGeneratorFactory(
  textureSize: number,
  numFrames: number
): TextureGenerator {
  return (idx: number, opts: TextureGeneratorOpts = {}): Texture => {
    const cvs = opts.canvas || document.createElement("canvas");
    cvs.width = cvs.height = textureSize;
    const ctx = cvs.getContext("2d");
    if (!ctx) {
      throw Error("Could not instantiate 2D rendering context");
    }
    ctx.clearRect(0, 0, textureSize, textureSize);

    const ts = Math.floor(idx % numFrames) / numFrames;
    // A litte buffer on each size for the border
    const size = textureSize * 0.97;
    ctx.save();
    ctx.translate(textureSize / 2, textureSize / 2);

    const halfSize = size / 2;

    roundedRectangle(ctx, -halfSize, -halfSize, size, size, (size * 76) / 650);
    ctx.clip();

    ctx.strokeStyle = "red";

    ctx.lineWidth = (size * 6) / 650;
    const numRects = 5;
    const magnification = remap(0, 1, 1, 2, easeInOutCubic(ts));
    for (let i = 0; i < numRects; i++) {
      ctx.save();
      const angle = 5 + i * 9 + (i * (i + 1)) / 2 + easeOutCubic(ts) * 600;
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

    // Inner circle
    ctx.lineWidth = (size * 20) / 650;
    const radius = ((size * 64) / 650) * magnification;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();

    // Outline
    roundedRectangle(ctx, -halfSize, -halfSize, size, size, (size * 76) / 650);
    ctx.lineWidth = (size * 20) / 650;
    ctx.stroke();

    ctx.restore();
    return {
      source: cvs,
      sx: 0,
      sy: 0,
      sw: textureSize,
      sh: textureSize
    };
  };
}
