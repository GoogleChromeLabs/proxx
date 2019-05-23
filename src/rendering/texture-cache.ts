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

import version from "consts:version";

import { del, get, set } from "idb-keyval";

import { noCache } from "src/utils/constants";
import { task } from "../utils/scheduling";
import { staticDevicePixelRatio } from "../utils/static-display.js";
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

export interface TextureCache {
  drawer: TextureDrawer;
  caches: HTMLImageElement[];
}

const TEXTURE_CACHE_IDB_PREFIX = "texturecache";
// Wraps an existing TextureGenerator and caches the generated
// frames in an img.
export async function cacheTextureGenerator(
  name: string,
  drawTexture: TextureGenerator,
  textureSize: number,
  numFrames: number,
  constraints: Partial<SizeConstraints> = {}
): Promise<TextureCache> {
  const fullConstraints = { ...defaultSizeConstraints, ...constraints };
  const maxFramesPerRow = Math.floor(
    fullConstraints.maxWidth / (textureSize * staticDevicePixelRatio)
  );
  const maxRowsPerSprite = Math.floor(
    fullConstraints.maxHeight / (textureSize * staticDevicePixelRatio)
  );
  const maxFramesPerSprite = maxFramesPerRow * maxRowsPerSprite;

  let buffers: ArrayBuffer[];

  const prefix = `${TEXTURE_CACHE_IDB_PREFIX}:${name}`;
  const expectedVersion = `${version}:${textureSize}:${staticDevicePixelRatio}`;
  const cachedTextureVersion = await get(`${prefix}:version`);

  if (cachedTextureVersion !== expectedVersion || noCache) {
    await del(`${prefix}:version`);
    await del(`${prefix}:buffers`);
    buffers = await createBuffers(
      drawTexture,
      textureSize,
      numFrames,
      fullConstraints
    );
    await set(`${prefix}:version`, expectedVersion);
    await set(`${prefix}:buffers`, buffers);
  } else {
    buffers = await get(`${prefix}:buffers`);
  }

  // Ok, strap in, because this next bit is stupid.
  // iOS devices seem to crash when they have some number of large canvases in memory.
  // But! They seem to handle large images just fine.
  // So, we have to convert our canvas into an image!
  // Hooray! The day is saved.
  const caches = new Array(buffers.length);
  for (let i = 0; i < buffers.length; i++) {
    const image = new Image();
    image.src = URL.createObjectURL(
      new Blob([buffers[i]], { type: "image/png" })
    );
    await new Promise(r => (image.onload = r));
    caches[i] = image;
    await task();
  }

  const drawer = (
    idx: number,
    targetCtx: CanvasRenderingContext2D,
    cellSize: number
  ) => {
    idx = Math.floor(idx % numFrames);
    const sprite = Math.floor(idx / maxFramesPerSprite);
    const idxInSprite = idx % maxFramesPerSprite;
    const xIndex = idxInSprite % maxFramesPerRow;
    const yIndex = Math.floor(idxInSprite / maxFramesPerRow);
    const img = caches[sprite];
    const x = xIndex * textureSize;
    const y = yIndex * textureSize;

    targetCtx.drawImage(
      img,
      x * staticDevicePixelRatio,
      y * staticDevicePixelRatio,
      textureSize * staticDevicePixelRatio,
      textureSize * staticDevicePixelRatio,
      0,
      0,
      cellSize,
      cellSize
    );
  };
  return { drawer, caches };
}

async function createBuffers(
  drawTexture: TextureGenerator,
  textureSize: number,
  numFrames: number,
  constraints: SizeConstraints
) {
  const { maxWidth, maxHeight } = constraints;
  const maxFramesPerRow = Math.floor(
    maxWidth / (textureSize * staticDevicePixelRatio)
  );
  const maxRowsPerSprite = Math.floor(
    maxHeight / (textureSize * staticDevicePixelRatio)
  );
  const maxFramesPerSprite = maxFramesPerRow * maxRowsPerSprite;
  const numSprites = Math.ceil(numFrames / maxFramesPerSprite);

  const buffers: ArrayBuffer[] = [];
  for (let spriteIndex = 0; spriteIndex < numSprites; spriteIndex++) {
    const framesLeftToCache = numFrames - spriteIndex * maxFramesPerSprite;
    const width = maxWidth;
    const height = maxHeight;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw Error("Could not instantiate 2D rendering context");
    }
    ctx.scale(staticDevicePixelRatio, staticDevicePixelRatio);

    for (
      let indexInSprite = 0;
      indexInSprite < framesLeftToCache && indexInSprite < maxFramesPerSprite;
      indexInSprite++
    ) {
      const frame = spriteIndex * maxFramesPerSprite + indexInSprite;
      const xIndex = indexInSprite % maxFramesPerRow;
      const yIndex = Math.floor(indexInSprite / maxFramesPerRow);
      const x = xIndex * textureSize;
      const y = yIndex * textureSize;
      ctx.save();
      ctx.translate(x, y);
      drawTexture(frame, ctx);
      ctx.restore();

      // Await a task to give the main thread a chance to breathe.
      await task();
    }
    const blob = await new Promise<Blob | null>(r =>
      canvas.toBlob(r, "image/png")
    );
    const buffer = await new Response(blob!).arrayBuffer();
    buffers.push(buffer);
  }
  return buffers;
}
