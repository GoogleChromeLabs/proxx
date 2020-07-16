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

import { readFileSync } from "fs";
import { basename } from "path";

const defaultOpts = {
  initialAssets: []
};

export default function assetPlugin(opts) {
  opts = Object.assign({}, defaultOpts, opts);
  return {
    name: "asset-plugin",
    buildStart() {
      for (const asset of opts.initialAssets) {
        this.emitAsset(basename(asset), readFileSync(asset));
      }
    }
  };
}
