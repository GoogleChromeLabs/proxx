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

// `devicePixelRatio` can change throughout the lifetime of a page. For example
// when a browser window is moved from a low-DPI monitor to a high-DPI monitor.
// Our rendering relies on dPR to generate the sprite sheets at the right
// resolution. If the value changes, the rendering gets messed up. The easy fix
// for now that is implemented here is to take a copy of dPR at the start of the
// game and ignore changes thereafter. In the future we can consider detecting
// changes to dPR and regenerating the sprite sheets on the fly.
export const staticDevicePixelRatio = Math.floor(devicePixelRatio);
