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
import ejs from "ejs";
import { readFileSync } from "fs";
import { resolve, parse } from "path";
import escapeStringRegexp from "escape-string-regexp";

const assetPlaceholderPrefix = "__LOLOL_ASSET_PLACEHOLDER_PREFIX__";
const assetPlaceholderSuffix = "__";
const placeholderRe = new RegExp(
  escapeStringRegexp(assetPlaceholderPrefix) +
    "(.*?)" +
    escapeStringRegexp(assetPlaceholderSuffix),
  "g"
);

export default function ejsAssetPlugin(templates) {
  const templateAssetIds = [];

  return {
    name: "ejs-asset-plugin",
    buildStart() {
      for (const [inPath, outPath] of Object.entries(templates)) {
        const template = readFileSync(inPath).toString();
        const output = ejs.render(template, {
          asset: path => {
            const fullPath = resolve(parse(inPath).dir, path);
            const assetId = this.emitAsset(
              parse(path).base,
              readFileSync(fullPath)
            );
            return assetPlaceholderPrefix + assetId + assetPlaceholderSuffix;
          }
        });
        templateAssetIds.push(this.emitAsset(outPath, output));
      }
    },
    generateBundle(_, bundle) {
      for (const templateId of templateAssetIds) {
        const path = this.getAssetFileName(templateId);
        const item = bundle[path];
        item.source = item.source.replace(placeholderRe, (_, assetId) => {
          return this.getAssetFileName(assetId);
        });
      }
    }
  };
}
