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
export const numberCircleRadius = 0.8;
export const numberFontSizeFactor = 0.45;
// The font doesn't center well by default
export const numberFontTopShiftFactor = 0.03;
export const glowFactor = 1 / 50;
export const glowAlpha = 0.5;

export const blackHoleInnerRed = "255, 40, 75";
export const blackHoleOuterRed = "255, 34, 106";
export const blackHoleOuterRadius = 1;
export const blackHoleInnerRadius = 0.9;
export const blackHoleRadius = 0.75;

export const idleAnimationNumFrames = (idleAnimationLength * 60) / 1000;
