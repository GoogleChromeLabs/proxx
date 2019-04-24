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
import { AnimationDesc } from "./animation";

export interface Renderer {
  init(width: number, height: number): void;
  createCanvas(): HTMLCanvasElement;
  onResize(): void;
  updateFirstRect(rect: ClientRect | DOMRect): void;
  render(
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ): void;
  stop(): void;
}

// TODO: Do feature detection for WebGL and required extensions and fall back to
// 2D if necessary.
const renderer = import("./webgl-renderer/index.js").then(m => new m.default());

export function getRendererInstance(): Promise<Renderer> {
  return renderer;
}
