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
  setFocus(x: number, y: number): void;
  beforeRenderFrame(): void;
  beforeCell(
    x: number,
    y: number,
    cell: Cell,
    animationList: AnimationDesc[],
    ts: number
  ): void;
  afterCell(
    x: number,
    y: number,
    cell: Cell,
    animationList: AnimationDesc[],
    ts: number
  ): void;
  render(
    x: number,
    y: number,
    cell: Cell,
    animation: AnimationDesc,
    ts: number
  ): void;
  stop(): void;
}

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

const parsedURL = new URL(location.href);
export function shouldUseMotion(): boolean {
  if (parsedURL.searchParams.has("force-nomotion")) {
    return false;
  }
  if (parsedURL.searchParams.has("force-motion")) {
    return true;
  }
  return supportsSufficientWebGL() && matchMedia("(min-width: 320px)").matches;
}
