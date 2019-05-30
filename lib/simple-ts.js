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

import { spawn } from "child_process";
import { relative, join, dirname } from "path";
import { readFileSync } from "fs";

import * as ts from "typescript";

const extRe = /\.tsx?$/;

function loadConfig() {
  const fileName = ts.findConfigFile(process.cwd(), ts.sys.fileExists);
  if (!fileName) throw Error("tsconfig not found");
  const text = ts.sys.readFile(fileName);
  const loadedConfig = ts.parseConfigFileTextToJson(fileName, text).config;
  const baseDir = dirname(fileName);
  const parsedTsConfig = ts.parseJsonConfigFileContent(
    loadedConfig,
    ts.sys,
    baseDir,
    undefined,
    fileName
  );
  return parsedTsConfig;
}

export default function simpleTS() {
  let config;

  return {
    name: "simple-ts",
    options(buildOpts) {
      if (buildOpts.watch) {
        buildOpts.watch.clearScreen = false;
      }
      return buildOpts;
    },
    async buildStart(buildOpts) {
      config = loadConfig();
      const proc = spawn("tsc", ["-b"], {
        stdio: "inherit"
      });

      await new Promise(resolve => {
        proc.on("exit", code => {
          if (code !== 0) {
            this.error("TypeScript build failed");
          }
          resolve();
        });
      });

      if (buildOpts.watch) {
        spawn("tsc", ["-b", "--watch", "--preserveWatchOutput"], {
          stdio: "inherit"
        });
      }
    },
    resolveId(id, importer) {
      if (!importer) return null;
      // TODO: we could use a cache here (additional arg to resolveModuleName)
      const tsResolve = ts.resolveModuleName(
        id,
        importer,
        config.options,
        ts.sys
      );
      if (!tsResolve.resolvedModule) return null;
      return tsResolve.resolvedModule.resolvedFileName;
    },
    async load(id) {
      if (!extRe.test(id)) return null;
      const newId = join(
        config.options.outDir,
        relative(process.cwd(), id)
      ).replace(extRe, ".js");
      this.addWatchFile(newId);
      return readFileSync(newId).toString();
    }
  };
}
