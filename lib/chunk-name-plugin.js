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
const defaultOpts = {
  prefix: "chunk-name:"
};

export default function chunkNamePlugin(opts) {
  opts = Object.assign({}, defaultOpts, opts);

  return {
    name: "chunk-name-plugin",
    async resolveId(id, importer) {
      if (!id.startsWith(opts.prefix)) {
        return null;
      }
      const path = id.slice(opts.prefix.length);
      const newId = (await this.resolve(path, importer)).id;
      return opts.prefix + newId;
    },
    load(id) {
      if (!id.startsWith(opts.prefix)) {
        return null;
      }
      const input = id.slice(opts.prefix.length);
      const chunkRef = this.emitChunk(input);
      return `export default import.meta.ROLLUP_CHUNK_URL_${chunkRef};`;
    }
  };
}
