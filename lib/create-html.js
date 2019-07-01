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
import { readFileSync } from "fs";

import CharacterSet from "characterset";
import ejs from "ejs";
import { hex as nebulaHex } from "./nebula-safe-dark";
import {
  findChunkWithName,
  findAssetWithName,
  getCodeAndDependencies
} from "./bundle-utils";

function generateShell(bundle, templatePath) {
  const normalCharSet = new CharacterSet(
    "PROXXDifficultyHardEasyMediumCustomWidthHeightBlackholes 0123456789"
  );
  // This has to include a space, else Firefox gets confused.
  const boldCharSet = new CharacterSet("START ");
  const template = readFileSync(templatePath, { encoding: "utf8" });

  return ejs.render(template, {
    inlineCode: getCodeAndDependencies(bundle, "/main/bootstrap.tsx"),
    workerFile: findChunkWithName(bundle, "/worker/index.ts").fileName,
    fonts: [
      {
        asset: findAssetWithName(bundle, "space-mono-normal.woff2").fileName,
        weight: 400,
        inline: readFileSync("src/assets/space-mono-inline.woff2").toString(
          "base64"
        ),
        inlineRange: normalCharSet.toHexRangeString()
      },
      {
        asset: findAssetWithName(bundle, "space-mono-bold.woff2").fileName,
        weight: 700,
        inline: readFileSync(
          "src/assets/space-mono-bold-inline.woff2"
        ).toString("base64"),
        inlineRange: boldCharSet.toHexRangeString()
      }
    ],
    nebulaSafeDark: nebulaHex,
    favicon: findAssetWithName(bundle, "favicon.png").fileName,
    icon: findAssetWithName(bundle, "icon-maskable.png").fileName,
    title: "PROXX — a game of proximity",
    description:
      "Help your crew navigate space by marking out the black holes using proxx, your proximity scanner.",
    image_url: `https://proxx.app/${
      findAssetWithName(bundle, "social-cover.jpg").fileName
    }`,
    image_alt: "Game screen of the PROXX game",
    image_width: "1200",
    image_height: "675",
    image_type: "image/jpeg",
    twitter_account: "@chromiumdev",
    url: "https://proxx.app/",
    locale: "en_US"
  });
}

export default function createHTMLPlugin() {
  const templatePath = "src/index.ejs";

  return {
    name: "create-html-plugin",
    buildStart() {
      this.addWatchFile(templatePath);
    },
    async generateBundle(options, bundle) {
      bundle["no-prerender.html"] = {
        fileName: "no-prerender.html",
        isAsset: true,
        source: await generateShell(bundle, templatePath)
      };
    }
  };
}
