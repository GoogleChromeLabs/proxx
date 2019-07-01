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

const canvasPool: HTMLCanvasElement[] = [];
export function getCanvas(context: "2d" | "webgl"): HTMLCanvasElement {
  if (canvasPool.length > 0) {
    const pooledCanvas = canvasPool.shift()!;
    // check if the pooled canvas has same context as the requested one
    if (pooledCanvas.getContext(context)) {
      return pooledCanvas;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  return canvas;
}

export function putCanvas(canvas: HTMLCanvasElement) {
  canvasPool.push(canvas);
}
