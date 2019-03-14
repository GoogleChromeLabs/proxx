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

const MagicString = require("magic-string");

const defaultOpts = {
  prefix: "chunk-name:",
  marker: "___TROLOLOLO",
  detector: /["'][^"']+\.js["']/
};

export default function chunkNamePlugin(opts) {
  opts = Object.assign({}, defaultOpts, opts);
  const startMarker = `"${opts.marker}_start"`;
  const endMarker = `"${opts.marker}_end"`;
  return {
    name: "chunk-name-plugin",
    async resolveId(id, importer) {
      if (!id.startsWith(opts.prefix)) {
        return null;
      }
      const path = id.slice(opts.prefix.length);
      const newId = await this.resolveId(path, importer);
      return opts.prefix + newId;
    },
    load(id) {
      if (!id.startsWith(opts.prefix)) {
        return null;
      }
      const input = id.slice(opts.prefix.length);
      return `export default ${startMarker} + import(${JSON.stringify(
        input
      )}) + ${endMarker};`;
    },
    renderChunk(code) {
      const startIdx = code.indexOf(startMarker);
      if (startIdx === -1) {
        return;
      }
      const endIdx = code.indexOf(endMarker) + endMarker.length;
      if (endIdx === -1) {
        this.error(
          "Found a start marker, but no end marker. Something went wrong here."
        );
      }
      const substr = code.slice(startIdx, endIdx);
      const chunkNameMatch = opts.detector.exec(substr);
      if (!chunkNameMatch) {
        this.error("Could not find a chunk name in between markers");
      }
      const ms = new MagicString(code);
      ms.overwrite(startIdx, endIdx, chunkNameMatch[0]);
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true })
      };
    }
  };
}
