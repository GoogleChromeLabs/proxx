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
const resourceListMarker = "___REPLACE_THIS_WITH_RESOURCE_LIST_LATER";

export default function resourceList() {
  return {
    name: "dependencygraph",
    resolveId(id) {
      if (id !== "resource-list:") {
        return null;
      }
      return id;
    },
    load(id) {
      if (id !== "resource-list:") {
        return null;
      }
      return `export default ${resourceListMarker};`;
    },
    generateBundle(_outputOptions, bundle) {
      const resourceListJSON = JSON.stringify(Object.keys(bundle));

      for (const item of Object.values(bundle)) {
        if (!item.code) {
          continue;
        }
        item.code = item.code.replace(resourceListMarker, resourceListJSON);
      }
    }
  };
}
