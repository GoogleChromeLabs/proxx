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
const moduleStart = "consts:";

export default function constsPlugin(consts) {
  return {
    name: "consts-plugin",
    resolveId(id) {
      if (!id.startsWith(moduleStart)) return;
      return id;
    },
    load(id) {
      if (!id.startsWith(moduleStart)) return;
      const key = id.slice(moduleStart.length);

      if (!(key in consts)) {
        this.error(`Cannot find const: ${key}`);
        return;
      }

      return `export default ${JSON.stringify(consts[key])}`;
    }
  };
}
