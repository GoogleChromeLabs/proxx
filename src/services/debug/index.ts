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

// @ts-ignore
import * as dat from "dat.gui/build/dat.gui.module.js";

import ShaderBox from "../../utils/shaderbox.js";

export interface Params {
  nebula: ShaderBox;
}
export function run({ nebula }: Params) {
  const gui = new dat.GUI();

  const nebulaSettings: any = {
    logSettings() {
      console.log(this);
    }
  };
  for (const name of nebula.uniforms) {
    nebulaSettings[name] = nebula.getUniform(name)[0];
  }
  const nebulaF = gui.addFolder("Nebula");
  nebulaF
    .add(nebulaSettings, "contrast", 0, 5)
    .onChange((v: number) => nebula.setUniform1f("contrast", v));
  nebulaF
    .add(nebulaSettings, "speed", -100, 100)
    .onChange((v: number) => nebula.setUniform1f("speed", v));
  nebulaF
    .add(nebulaSettings, "nebulaScale", 0, 40)
    .onChange((v: number) => nebula.setUniform1f("nebulaScale", v));
  nebulaF
    .add(nebulaSettings, "vortexInfluence", -0.1, 0.1)
    .onChange((v: number) => nebula.setUniform1f("vortexInfluence", v));
  nebulaF.add(nebulaSettings, "logSettings");
}
