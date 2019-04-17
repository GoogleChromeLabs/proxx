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

import { getCellSizes } from "src/utils/cell-sizing.js";
import { task } from "src/utils/scheduling.js";
import { easeInOutCubic, easeOutQuad, remap } from "./animation-helpers.js";
import {
  fadedLinesAlpha,
  fadeInAnimationLength,
  fadeOutAnimationLength,
  flashInAnimationLength,
  flashOutAnimationLength,
  idleAnimationLength,
  idleAnimationNumFrames,
  turquoise
} from "./constants.js";
import { cacheTextureGenerator, TextureDrawer } from "./texture-cache.js";
import {
  idleAnimationTextureGeneratorFactory,
  STATIC_TEXTURE,
  staticTextureGeneratorFactory
} from "./texture-generators.js";

// Enum of all the available animations
export const enum AnimationName {
  IDLE,
  FLASH_IN,
  FLASH_OUT,
  HIGHLIGHT_IN,
  HIGHLIGHT_OUT,
  NUMBER,
  FLAGGED
}

export interface AnimationDesc {
  name: AnimationName;
  start: number;
  fadeStart?: number;
  done?: () => void;
}

export interface Context {
  ts: number;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  animation: AnimationDesc;
}

// Calls and unsets the `done` callback if available.
function processDoneCallback(animation: AnimationDesc) {
  if (!animation.done) {
    return;
  }
  animation.done();
  delete animation.done;
}

export function idleAnimation({
  ts,
  ctx,
  animation,
  width: cellSize
}: Context) {
  const animationLength = 5000;
  const normalized = ((ts - animation.start) / animationLength) % 1;
  const idx = Math.floor(normalized * 300);

  let fadeInNormalized =
    (ts - (animation.fadeStart || 0)) / fadeInAnimationLength;
  if (fadeInNormalized > 1) {
    fadeInNormalized = 1;
  }

  ctx.save();
  ctx.globalAlpha = remap(
    0,
    1,
    1,
    fadedLinesAlpha,
    easeOutQuad(fadeInNormalized)
  );
  idleAnimationTextureDrawer!(idx, ctx, cellSize);
  ctx.globalAlpha = 1;
  staticTextureDrawer!(STATIC_TEXTURE.OUTLINE, ctx, cellSize);
  ctx.restore();
}

export function flaggedAnimation({
  ts,
  ctx,
  animation,
  width: cellSize
}: Context) {
  const animationLength = idleAnimationLength;
  const normalized = ((ts - animation.start) / animationLength) % 1;
  const idx = Math.floor(normalized * 300);

  let fadeOutNormalized =
    (ts - (animation.fadeStart || 0)) / fadeOutAnimationLength;
  if (fadeOutNormalized > 1) {
    fadeOutNormalized = 1;
  }

  ctx.save();
  ctx.globalAlpha = remap(
    0,
    1,
    fadedLinesAlpha,
    1,
    easeOutQuad(fadeOutNormalized)
  );
  idleAnimationTextureDrawer!(idx, ctx, cellSize);
  ctx.globalAlpha = 1;
  staticTextureDrawer!(STATIC_TEXTURE.OUTLINE, ctx, cellSize);
  ctx.restore();
}

export function highlightInAnimation({
  ts,
  ctx,
  width,
  height,
  animation
}: Context) {
  const animationLength = fadeInAnimationLength;
  let normalized = (ts - animation.start) / animationLength;

  if (normalized < 0) {
    normalized = 0;
  }
  if (normalized > 1) {
    processDoneCallback(animation);
    normalized = 1;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = easeOutQuad(normalized);
  ctx.fillStyle = turquoise;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function highlightOutAnimation({
  ts,
  ctx,
  width,
  height,
  animation
}: Context) {
  const animationLength = fadeOutAnimationLength;
  let normalized = (ts - animation.start) / animationLength;

  if (normalized < 0) {
    normalized = 0;
  }
  if (normalized > 1) {
    processDoneCallback(animation);
    normalized = 1;
  }

  ctx.save();
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = 1 - easeOutQuad(normalized);
  ctx.fillStyle = turquoise;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function numberAnimation(
  touching: number,
  { ctx, width: cellSize }: Context
) {
  ctx.save();
  staticTextureDrawer!(touching, ctx, cellSize);
  ctx.restore();
}

export function flashInAnimation({
  ts,
  ctx,
  animation,
  width: cellSize
}: Context) {
  const animationLength = flashInAnimationLength;
  let normalized = (ts - animation.start) / animationLength;
  if (normalized < 0) {
    return;
  }
  if (normalized > 1) {
    processDoneCallback(animation);
    normalized = 1;
  }
  ctx.save();
  ctx.globalAlpha = easeOutQuad(normalized);
  staticTextureDrawer!(STATIC_TEXTURE.FLASH, ctx, cellSize);
  ctx.restore();
}

export function flashOutAnimation({
  ts,
  ctx,
  animation,
  width: cellSize
}: Context) {
  const animationLength = flashOutAnimationLength;
  let normalized = (ts - animation.start) / animationLength;
  if (normalized < 0) {
    return;
  }
  if (normalized > 1) {
    processDoneCallback(animation);
    normalized = 1;
  }
  ctx.save();
  ctx.globalAlpha = 1 - easeInOutCubic(normalized);
  staticTextureDrawer!(STATIC_TEXTURE.FLASH, ctx, cellSize);
  ctx.restore();
}

let idleAnimationTextureDrawer: TextureDrawer | null = null;
let staticTextureDrawer: TextureDrawer | null = null;

export function initTextureCaches(textureSize: number, cellPadding: number) {
  if (idleAnimationTextureDrawer) {
    // If we have one, we have them all.
    return;
  }

  const size = textureSize;
  const uncachedIATG = idleAnimationTextureGeneratorFactory(
    textureSize,
    cellPadding,
    idleAnimationNumFrames
  );
  idleAnimationTextureDrawer = cacheTextureGenerator(
    uncachedIATG,
    textureSize,
    idleAnimationNumFrames,
    { maxWidth: size, maxHeight: size }
  );
  const uncachedSTG = staticTextureGeneratorFactory(textureSize, cellPadding);
  staticTextureDrawer = cacheTextureGenerator(
    uncachedSTG,
    textureSize,
    STATIC_TEXTURE.LAST_MARKER,
    { maxWidth: size, maxHeight: size }
  );
}

export async function lazyGenerateTextures() {
  const { cellPadding, cellSize } = getCellSizes();
  initTextureCaches(cellSize + 2 * cellPadding, cellPadding);
  await task();
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = 1;
  const ctx = cvs.getContext("2d")!;
  for (let i = 0; i < idleAnimationNumFrames; i++) {
    idleAnimationTextureDrawer!(i, ctx, cellSize);
    await task();
  }
}
