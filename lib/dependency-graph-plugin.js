/**
 * Copyright 2018 Google Inc. All Rights Reserved.
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
const fs = require("fs");

const defaults = {
  manifestName: "dependencygraph.json",
  propList: undefined
};

export default function(opts = {}) {
  opts = {
    ...defaults,
    ...opts
  };

  return {
    name: "dependencygraph",
    generateBundle(_outputOptions, bundle) {
      let bundleObj = bundle;

      if (opts.propList) {
        bundleObj = {};
        for (const [key, originalEntry] of Object.entries(bundle)) {
          const entry = {};
          for (const propKey of opts.propList) {
            if (propKey in originalEntry) {
              entry[propKey] = originalEntry[propKey];
            }
          }
          bundleObj[key] = entry;
        }
      }
      fs.writeFileSync(
        opts.manifestName,
        JSON.stringify(bundleObj, null, "  ")
      );
    }
  };
}
