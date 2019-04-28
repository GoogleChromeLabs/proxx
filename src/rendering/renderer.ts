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
import { getMotionPreference } from "../services/state/motion-preference";
import { motionMode } from "../utils/constants";
import { isFeaturePhone } from "../utils/static-dpr";
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

export const deviceMotionCapable = supportsSufficientWebGL() && !isFeaturePhone;

export async function shouldUseMotion(): Promise<boolean> {
  // Whenever `motion` query flag is set, it is honoured regardless of device or user preference
  if (motionMode) {
    if (motionMode === "1") {
      return true;
    } else if (motionMode === "0") {
      return false;
    }
  }
  // If device is capable of animation, then inquire user preference
  if (deviceMotionCapable) {
    return await getMotionPreference();
  }
  return false;
}
