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

import { proxy, wrap } from "comlink/src/comlink";
import { init, skipWaiting, updateReady } from "../../offline";
import { lazyGenerateTextures } from "../../rendering/animation";
import { supportsSufficientWebGL } from "../../rendering/renderer";
import { nextEvent } from "../../utils/scheduling";
import { getBest, submitTime } from "../state/best-times";
import { getGridDefault, setGridDefault } from "../state/grid-default";
import {
  getMotionPreference,
  setMotionPreference,
  shouldUseMotion
} from "../state/motion-preference";

export {
  supportsSufficientWebGL,
  wrap as comlinkWrap,
  proxy as comlinkProxy,
  nextEvent,
  getGridDefault,
  setGridDefault,
  getBest as getBestTime,
  submitTime,
  init as initOffline,
  updateReady,
  skipWaiting,
  lazyGenerateTextures,
  setMotionPreference,
  getMotionPreference,
  shouldUseMotion
};
