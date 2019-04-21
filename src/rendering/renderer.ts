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

import { Cell } from "src/gamelogic/types";
import ShaderBox from "src/utils/shaderbox";
import { AnimationDesc } from "./animation";
import fragmentShader from "./fragment.glsl";
import vertexShader from "./vertex.glsl";

export interface Renderer {
  init(width: number, height: number): void;
  createCanvas(): HTMLCanvasElement;
  onResize(): void;
  updateFirstRect(rect: ClientRect | DOMRect): void;
  beforeRenderFrame(): void;
  render(
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ): void;
  stop(): void;
}

let bestRendererPromise: Promise<Renderer>;
let webGlRendererPromise: Promise<Renderer>;
let canvasRendererPromise: Promise<Renderer>;

function supportsSufficientWebGL(): boolean {
  try {
    // tslint:disable-next-line:no-unused-expression
    new ShaderBox(vertexShader, fragmentShader);
  } catch (e) {
    console.warn(`Cannot use WebGL:`, e);
    return false;
  }
  return true;
}

const enum RendererType {
  WebGL,
  Canvas2D
}

export async function getBestRenderer(): Promise<Renderer> {
  if (bestRendererPromise) {
    return bestRendererPromise;
  }
  const parsedURL = new URL(location.toString());
  let isForcedRendererType = false;
  let rendererType = RendererType.Canvas2D;

  // Allow the user to force a certain renderer with a query parameter.
  if (parsedURL.searchParams.has("force-renderer")) {
    isForcedRendererType = true;
    switch (parsedURL.searchParams.get("force-renderer")!.toLowerCase()) {
      case "webgl":
        rendererType = RendererType.WebGL;
        break;
      case "2d":
        rendererType = RendererType.Canvas2D;
        break;
      default:
        console.error("Unknown renderer");
    }
  }

  // If no force has been used, use feature detection.
  if (!isForcedRendererType) {
    if (supportsSufficientWebGL()) {
      rendererType = RendererType.WebGL;
    }
  }

  switch (rendererType) {
    case RendererType.WebGL:
      bestRendererPromise = getWebGlRenderer();
      break;
    case RendererType.Canvas2D:
      bestRendererPromise = getCanvasRenderer();
      break;
  }
  return bestRendererPromise;
}

export async function getCanvasRenderer(): Promise<Renderer> {
  if (!canvasRendererPromise) {
    canvasRendererPromise = import("./canvas-2d-renderer/index.js").then(
      m => new m.default()
    );
  }
  return canvasRendererPromise;
}

export async function getWebGlRenderer(): Promise<Renderer> {
  if (!webGlRendererPromise) {
    webGlRendererPromise = import("./webgl-renderer/index.js").then(
      m => new m.default()
    );
  }
  return webGlRendererPromise;
}
