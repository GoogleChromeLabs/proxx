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

import nodeResolve from "rollup-plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import loadz0r from "rollup-plugin-loadz0r";
import chunkNamePlugin from "./lib/chunk-name-plugin.js";
import resourceListPlugin from "./lib/resource-list-plugin";
import postcss from "rollup-plugin-postcss";
import glsl from "./lib/glsl-plugin.js";
import cssModuleTypes from "./lib/css-module-types.js";
import assetPlugin from "./lib/asset-plugin.js";
import { readFileSync } from "fs";
import constsPlugin from "./lib/consts-plugin.js";
import ejsAssetPlugin from "./lib/ejs-asset-plugin.js";
import assetTransformPlugin from "./lib/asset-transform-plugin.js";
import postCSSUrl from "postcss-url";
import rimraf from "rimraf";
import simpleTS from "./lib/simple-ts.js";
import renderStaticPlugin from "./lib/render-static.js";
import { color as nebulaColor, hex as nebulaHex } from "./lib/nebula-safe-dark";
import pkg from "./package.json";
import createHTMLPlugin from "./lib/create-html";

// Delete 'dist'
rimraf.sync("dist");
rimraf.sync("dist-prerender");
rimraf.sync(".rpt2_cache");

function buildConfig({ prerender } = {}) {
  return {
    input: {
      bootstrap: "src/main/bootstrap.tsx",
      sw: "src/sw/index.ts"
    },
    output: {
      dir: "dist",
      format: "amd",
      sourcemap: !prerender,
      entryFileNames: "[name].js",
      chunkFileNames: "[name]-[hash].js"
    },
    plugins: [
      {
        resolveFileUrl({ fileName }) {
          return JSON.stringify("/" + fileName);
        }
      },
      !prerender && cssModuleTypes("src"),
      postcss({
        minimize: true,
        modules: {
          generateScopedName: "[hash:base64:5]"
        },
        namedExports(name) {
          return name.replace(/-\w/g, val => val.slice(1).toUpperCase());
        },
        plugins: [
          postCSSUrl({
            url: "inline"
          })
        ]
      }),
      constsPlugin({
        version: pkg.version,
        nebulaSafeDark: nebulaColor,
        prerender
      }),
      glsl(),
      ejsAssetPlugin("./src/manifest.ejs", "manifest.json", {
        data: {
          nebulaSafeDark: nebulaHex
        }
      }),
      assetPlugin({
        initialAssets: [
          "./src/assets/space-mono-normal.woff2",
          "./src/assets/space-mono-bold.woff2",
          "./src/assets/favicon.png",
          "./src/assets/social-cover.jpg",
          "./src/assets/assetlinks.json"
        ]
      }),
      assetTransformPlugin(asset => {
        if (asset.fileName.includes("manifest-")) {
          // Remove name hashing
          asset.fileName = "manifest.json";
          // Minify
          asset.source = JSON.stringify(JSON.parse(asset.source));
        } else if (asset.fileName.includes("assetlinks")) {
          asset.fileName = ".well-known/assetlinks.json";
        }
      }),
      chunkNamePlugin(),
      nodeResolve(),
      loadz0r({
        loader: readFileSync("./lib/loadz0r-loader.ejs").toString(),
        // `prependLoader` will be called for every chunk. If it returns `true`,
        // the loader code will be prepended.
        prependLoader: (chunk, inputs) => {
          // If the filename ends with `index/worker`, prepend the loader.
          return (
            Object.keys(chunk.modules).some(mod =>
              /worker\/index\.[jt]s$/.test(mod)
            ) || loadz0r.isEntryModule(chunk, inputs)
          );
        }
      }),
      simpleTS("src/main"),
      resourceListPlugin(),
      !prerender && terser(),
      prerender ? renderStaticPlugin() : createHTMLPlugin()
    ].filter(item => item)
  };
}

export default [
  buildConfig({ prerender: false }),
  buildConfig({ prerender: true })
];
