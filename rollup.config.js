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

import typescript from "rollup-plugin-typescript2";
import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import loadz0r from "rollup-plugin-loadz0r";
import dependencyGraph from "./dependency-graph-plugin.js";
import chunkNamePlugin from "./chunk-name-plugin.js";
import resourceListPlugin from "./resource-list-plugin";
import postcss from "rollup-plugin-postcss";
import glsl from "./glsl-plugin.js";
import cssModuleTypes from "./css-module-types.js";
import assetPlugin from "./asset-plugin.js";
import { readFileSync } from "fs";
import constsPlugin from "./consts-plugin.js";
import ejsAssetPlugin from "./ejs-asset-plugin.js";

// Delete 'dist'
require("rimraf").sync("dist");

export default {
  input: {
    bootstrap: "src/bootstrap.ts",
    sw: "src/sw/index.ts"
  },
  output: {
    dir: "dist",
    format: "amd",
    sourcemap: true,
    entryFileNames: "[name].js",
    chunkFileNames: "[name]-[hash].js"
  },
  plugins: [
    cssModuleTypes("src"),
    postcss({
      minimize: true,
      modules: {
        generateScopedName: "[hash:base64:5]"
      },
      //extract: true,
      namedExports(name) {
        return name.replace(/-\w/g, val => val.slice(1).toUpperCase());
      }
    }),
    constsPlugin({
      version: require("./package.json").version
    }),
    typescript({
      // Make sure we are using our version of TypeScript.
      typescript: require("typescript"),
      tsconfigOverride: {
        compilerOptions: {
          sourceMap: true
        }
      },
      // We need to set this so we can use async functions in our
      // plugin code. :shurg:
      // https://github.com/ezolenko/rollup-plugin-typescript2/issues/105
      clean: true
    }),
    glsl(),
    ejsAssetPlugin({
      "./src/manifest.ejs": "manifest.json"
    }),
    assetPlugin({
      initialAssets: [
        "./src/assets/space-mono-normal.woff2",
        "./src/assets/space-mono-bold.woff2",
        "./src/assets/favicon.ico"
      ],
      transformAssets(asset) {
        if (asset.fileName.includes("manifest-")) {
          // Remove name hashing
          asset.fileName = "manifest.json";
          // Minify
          asset.source = JSON.stringify(JSON.parse(asset.source));
        }
      }
    }),
    chunkNamePlugin(),
    nodeResolve(),
    loadz0r({
      loader: readFileSync("./loadz0r-loader.ejs").toString(),
      // `prependLoader` will be called for every chunk. If it returns `true`,
      // the loader code will be prepended.
      prependLoader: (chunk, inputs) => {
        // If the filename ends with `worker`, prepend the loader.
        if (
          Object.keys(chunk.modules).some(mod => /worker\.[jt]s$/.test(mod))
        ) {
          return true;
        }
        // If not, fall back to the default behavior.
        return loadz0r.isEntryModule(chunk, inputs);
      }
    }),
    dependencyGraph({
      propList: ["facadeModuleId", "fileName", "imports", "code", "isAsset"]
    }),
    resourceListPlugin(),
    terser()
  ]
};
