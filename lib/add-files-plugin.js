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

import { promises as fsp } from "fs";

export default function addFilesPlugin(files) {
  let fileReadPromises;

  return {
    name: "add-files-plugin",
    buildStart() {
      fileReadPromises = new Map();

      for (const inputPath of Object.keys(files)) {
        fileReadPromises.set(inputPath, fsp.readFile(inputPath));
      }
    },
    async generateBundle(options, bundle) {
      for (const [inputPath, outputPath] of Object.entries(files)) {
        bundle[outputPath] = {
          fileName: outputPath,
          isAsset: true,
          source: await fileReadPromises.get(inputPath)
        };
      }
    }
  };
}
