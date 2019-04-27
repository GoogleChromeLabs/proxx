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
export const spriteSize = 1024;

export const numInnerRects = 5;
// 3s delay per 8 fields
export const rippleSpeed = 3000 / 8;

export type ShaderColor = [number, number, number, number];
export type Color = [number, number, number];
export function toShaderColor(x: Color): ShaderColor {
  return [...x.map(x => x / 255), 1] as any;
}

export function toRGB(color: Color): string {
  return `rgb(${color.join(",")})`;
}

// Colors
export const nebulaDangerDark: Color = [53, 0, 0];
export const nebulaDangerLight: Color = [117, 32, 61];
export const nebulaSafeDark: Color = [58, 10, 78];
export const nebulaSafeLight: Color = [43, 41, 111];
export const nebulaSettingDark: Color = [0, 0, 0];
export const nebulaSettingLight: Color = [41, 41, 41];

export const focusRing = "rgb(122, 244, 66)";
export const turquoise = "rgb(109, 205, 218)";
export const white = "#fff";

// Animation durations
export const idleAnimationLength = 5000;
export const fadeInAnimationLength = 300;
export const fadeOutAnimationLength = 300;
export const flashInAnimationLength = 100;
export const flashOutAnimationLength = 700;

// Texture constants
export const revealedAlpha = 0.3;
export const fadedLinesAlpha = 0.3;
export const safetyBufferFactor = 0.97;
export const thickLine = 20 / 650;
export const thinLine = 12 / 650;
export const borderRadius = 76 / 650;
export const innerCircleRadius = 64 / 650;
export const numberCircleRadius = 0.9;
export const numberFontSizeFactor = 0.5;
export const blurFactor = 0.1;

export const idleAnimationNumFrames = (idleAnimationLength * 60) / 1000;
