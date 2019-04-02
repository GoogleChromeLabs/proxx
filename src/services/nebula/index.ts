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

import ShaderBox from "./shaderbox.js";
import { nebula as nebulaStyle } from "./style.css";

// @ts-ignore
import fragmentShader from "./fragment.glsl";

export function run() {
  const shaderBox = new ShaderBox(fragmentShader, {
    canvas: document.querySelector("#nebula") as any
  });
  document.body.appendChild(shaderBox.canvas);
  shaderBox.canvas.id = "nebula";
  shaderBox.canvas.classList.add(nebulaStyle);
  shaderBox.resize();
  shaderBox.start();
}
