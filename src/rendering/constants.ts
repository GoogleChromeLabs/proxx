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

export const numRects = 5;

function shaderColor(
  x: [number, number, number]
): [number, number, number, number] {
  return [...x.map(x => x / 255), 1] as any;
}
// Colors
export const nebulaDangerDark = shaderColor([53, 0, 0]);
export const nebulaDangerLight = shaderColor([117, 32, 61]);
export const nebulaSafeDark = shaderColor([58, 10, 78]);
export const nebulaSafeLight = shaderColor([43, 41, 111]);

export const turquoise = "rgb(109, 205, 218)";
export const white = "#fff";

// Animation durations
export const idleAnimationLength = 5000;
export const flashInAnimationLength = 100;
export const flashOutAnimationLength = 700;

// Texture constanst
export const safetyBufferFactor = 0.97;
export const thickLine = 20 / 650;
export const thinLine = 12 / 650;
export const borderRadius = 76 / 650;
export const innerCircleRadius = 64 / 650;
export const numberCircleRadius = 0.9;
export const numberFontSizeFactor = 0.5;
export const blurFactor = 0.1;
