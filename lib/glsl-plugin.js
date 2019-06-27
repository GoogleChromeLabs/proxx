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

import * as fs from "fs";
import { createFilter } from "rollup-pluginutils";
import tokenizer from "glsl-tokenizer";
import parser from "glsl-parser";
import deparser from "glsl-deparser";
import minify from "glsl-min-stream";
import Stream from "stream";

function collectStream(readableStream) {
  return new Promise(resolve => {
    let chunks = [];
    readableStream.on("data", chunk => chunks.push(chunk));
    readableStream.on("end", () => resolve(chunks));
  });
}

const defaultOpts = {
  include: "**/*.glsl",
  exclude: [],
  minify: true
};

export default function glslPlugin(opts) {
  opts = Object.assign({}, defaultOpts, opts);
  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: "glsl-plugin",
    load(id) {
      if (!filter(id)) {
        return;
      }
      this.addWatchFile(id);
      const code = fs.readFileSync(id);
      const tokens = tokenizer(code);
      const readable = new Stream.Readable({
        objectMode: true,
        read() {
          if (tokens.length > 0) {
            return this.push(tokens.shift());
          }
          this.push(null);
        }
      });
      if (opts.minify) {
        const stream = readable
          .pipe(parser())
          .pipe(minify())
          .pipe(deparser(false /* remove all optional whitespace */));
        return collectStream(stream).then(chunks => {
          const minified = chunks.map(c => c.toString()).join("");
          return `export default ${JSON.stringify(minified)};`;
        });
      }
      return `export default ${JSON.stringify(code.toString())};`;
    }
  };
}
