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
import path from "path";

import CharacterSet from "characterset";
import ejs from "ejs";
import { hex as nebulaHex } from "./nebula-safe-dark";
import pkg from "../package.json";
import puppeteer from "puppeteer";

function findChunkWithName(bundle, name) {
  return Object.values(bundle).find(desc =>
    (desc.facadeModuleId || "").endsWith(name)
  );
}

function findAssetWithName(bundle, name) {
  const parsedName = path.parse(name);

  return Object.values(bundle).find(desc => {
    if (!desc.isAsset) return false;
    const parsedGraphName = path.parse(desc.fileName);
    if (parsedGraphName.ext !== parsedName.ext) return false;
    if (!parsedGraphName.name.startsWith(parsedName.name)) return false;
    const expectedHash = parsedGraphName.name.slice(parsedName.name.length);
    return /^-[0-9a-f]+$/.test(expectedHash);
  });
}

function generateShell(bundle) {
  const normalCharSet = new CharacterSet(
    "PROXXDifficultyHardEasyMediumCustomWidthHeightBlackholes 0123456789"
  );
  // This has to include a space, else Firefox gets confused.
  const boldCharSet = new CharacterSet("START ");
  const template = readFileSync("src/index.ejs", { encoding: "utf8" });

  return ejs.render(template, {
    bundle,
    bootstrap: findChunkWithName(bundle, "/main/bootstrap.tsx"),
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
    pkg,
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

function correctMarkup(markup) {
  // Remove all dynamically added script tags
  markup = markup.replace(/<script[^>]+src=[^>]+><\/script>/g, "");
  // Remove all inject style calls (as they're already added)
  markup = markup.replace(/\w+\.styleInject\((["']).*?\1\);/g, "");
  return markup;
}

async function prerender(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.viewport(1280, 720);
  page.on("pageerror", err => console.error("static-plugin-error", err));
  const done = page.evaluate(
    () =>
      new Promise(resolve => {
        window.prerenderDone = resolve;
      })
  );
  page.setContent(html);
  await done;
  const content = await page.content();
  browser.close();
  return content;
}

export default function renderStaticPlugin() {
  return {
    name: "render-static-plugin",
    async generateBundle(options, bundle) {
      const html = correctMarkup(await prerender(await generateShell(bundle)));

      for (const key of Object.keys(bundle)) {
        delete bundle[key];
      }
      bundle["index.html"] = {
        fileName: "index.html",
        isAsset: true,
        source: html
      };
    }
  };
}
