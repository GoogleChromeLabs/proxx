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

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.
// rollup-plugin-bundle-guard: group=entry

import { fpmode } from "./constants";

// `devicePixelRatio` can change throughout the lifetime of a page. For example
// when a browser window is moved from a low-DPI monitor to a high-DPI monitor.
// Our rendering relies on dPR to generate the sprite sheets at the right
// resolution. If the value changes, the rendering gets messed up. The easy fix
// for now that is implemented here is to take a copy of dPR at the start of the
// game and ignore changes thereafter. In the future we can consider detecting
// changes to dPR and regenerating the sprite sheets on the fly.
export const staticDevicePixelRatio = Math.min(devicePixelRatio, 2);

// On KaiOS browser, zoom in/out changes both screen.width and window.innerWidth.
// This makes it hard to detect an actual screen size in order to provide
// better visual guide (such as focus on mouse hover) for the smaller screen.
//
// Since zoom level is set to default every time a page gets loaded,
// implementation below stores initial screen width and height.
const staticScreenWidth = screen.width;
const staticScreenHeight = screen.height;

// Our assumption here is that every feature phone has qvga or less screen size,
// so this says nothing about the input interface and may be busted in the future.
// in Q1 2019, all KaiOS devices ship with QVGA and Xiaomi's Qin1 is also QVGA.
// IF query pram `fpmode` was passed, force the app to be in feature phone mode.
export const isFeaturePhone =
  fpmode || Math.min(staticScreenWidth, staticScreenHeight) <= 240;
