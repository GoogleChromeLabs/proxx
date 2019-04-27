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
import { staticDevicePixelRatio } from "src/utils/static-dpr.js";
import { easeInOutCubic, easeOutQuad, remap } from "./animation-helpers.js";
import {
  fadedLinesAlpha,
  fadeInAnimationLength,
  fadeOutAnimationLength,
  flashInAnimationLength,
  flashOutAnimationLength,
  idleAnimationLength,
  idleAnimationNumFrames,
  spriteSize,
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
  FLAGGED,
  MINED
}

export interface AnimationDesc {
  name: AnimationName;
  start: number;
  fadeStart?: number;
  done?: () => void;
}

// Calls and unsets the `done` callback if available.
export function processDoneCallback(animation: AnimationDesc) {
  if (!animation.done) {
    return;
  }
  animation.done();
  delete animation.done;
}

export let idleAnimationTextureDrawer: TextureDrawer | null = null;
export let idleSprites: HTMLImageElement[] | null = null;
export let staticTextureDrawer: TextureDrawer | null = null;
export let staticSprites: HTMLImageElement[] | null = null;

export async function lazyGenerateTextures() {
  const { cellPadding, cellSize } = getCellSizes();
  const textureSize = cellSize + 2 * cellPadding;

  const uncachedIATG = idleAnimationTextureGeneratorFactory(
    textureSize,
    cellPadding,
    idleAnimationNumFrames
  );
  ({
    drawer: idleAnimationTextureDrawer,
    caches: idleSprites
  } = await cacheTextureGenerator(
    "idle",
    uncachedIATG,
    textureSize,
    idleAnimationNumFrames,
    {
      maxWidth: spriteSize,
      maxHeight: spriteSize
    }
  ));
  const uncachedSTG = staticTextureGeneratorFactory(textureSize, cellPadding);
  ({
    drawer: staticTextureDrawer,
    caches: staticSprites
  } = await cacheTextureGenerator(
    "static",
    uncachedSTG,
    textureSize,
    STATIC_TEXTURE.LAST_MARKER,
    { maxWidth: spriteSize, maxHeight: spriteSize }
  ));
}
