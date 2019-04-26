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

export default function assetTransformPlugin(callback) {
  return {
    name: "asset-transform-plugin",
    async generateBundle(_, bundle) {
      for (const bundleEntry of Object.values(bundle)) {
        if (!bundleEntry.isAsset) {
          continue;
        }
        const newBundleEntry = await callback(bundleEntry);
        if (!newBundleEntry) {
          continue;
        }
        delete bundle[bundleEntry.fileName];
        bundle[newBundleEntry.fileName] = newBundleEntry;
      }
    }
  };
}
