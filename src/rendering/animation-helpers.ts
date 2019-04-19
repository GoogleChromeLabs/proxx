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

import { AnimationDesc, AnimationName } from "./animation";

export function deg2rad(deg: number) {
  return (deg / 180) * Math.PI;
}

// A bunch of easing functions from the book of shaders
// https://thebookofshaders.com/edit.php?log=160909064320
export function easeInQuad(t: number) {
  return t * t;
}

export function easeOutQuad(t: number) {
  return -1.0 * t * (t - 2.0);
}

export function easeInOutQuad(t: number) {
  t *= 2.0;
  if (t < 1.0) {
    return 0.5 * t * t;
  } else {
    return -0.5 * ((t - 1.0) * (t - 3.0) - 1.0);
  }
}

export function easeInCubic(t: number) {
  return t * t * t;
}

export function easeOutCubic(t: number) {
  return (t = t - 1.0) * t * t + 1.0;
}

export function easeInOutCubic(t: number) {
  t *= 2.0;
  if (t < 1.0) {
    return 0.5 * t * t * t;
  } else {
    t -= 2.0;
    return 0.5 * (t * t * t + 2.0);
  }
}

export function easeInExpo(t: number) {
  return t === 0.0 ? 0.0 : Math.pow(2.0, 10.0 * (t - 1.0));
}

export function easeOutExpo(t: number) {
  return t === 1.0 ? 1.0 : -Math.pow(2.0, -10.0 * t) + 1.0;
}

export function easeInOutExpo(t: number) {
  if (t === 0.0 || t === 1.0) {
    return t;
  }
  t *= 2.0;
  if (t < 1.0) {
    return 0.5 * Math.pow(2.0, 10.0 * (t - 1.0));
  } else {
    return 0.5 * (-Math.pow(2.0, -10.0 * (t - 1.0)) + 2.0);
  }
}

// Remaps v from interval [minIn; maxIn] to [minOut; maxOut].
// remap() will extrapolate for values outside the input interval.
export function remap(
  minIn: number,
  maxIn: number,
  minOut: number,
  maxOut: number,
  v: number
) {
  return ((v - minIn) / (maxIn - minIn)) * (maxOut - minOut) + minOut;
}

// Clamps v to [0; 1]
export function clamp(v: number) {
  return Math.min(1, Math.max(0, v));
}

// Like remap, but does not extrapolate outside the input interval.
export function clampedRemap(
  minIn: number,
  maxIn: number,
  minOut: number,
  maxOut: number,
  v: number
) {
  return clamp(remap(minIn, maxIn, minOut, maxOut, v));
}

// Generates a curve with the following characteristics:
// - Starts at 0 for v < inStart
// - Smooth transition from 0 to 1 for v between inStart and outStart
// - Stays at 1 for v between inEnd and outStart
// - Smooth transition from 1 to 0 for v between outStart and outEnd
// - Stays at 0 for v > outEnd
//
//                         .--------.
// Beautiful graph:       /          \
//                  _____.            ._____
export function smoothpulse(
  inStart: number,
  inEnd: number,
  outStart: number,
  outEnd: number,
  v: number
) {
  return easeInOutCubic(
    clampedRemap(inStart, inEnd, 0, 1, v) *
      (1 - clampedRemap(outStart, outEnd, 0, 1, v))
  );
}

export function removeAnimations(
  al: AnimationDesc[],
  names: AnimationName[]
): AnimationDesc[] {
  return al.filter(a => !names.includes(a.name));
}
