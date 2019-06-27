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

import puppeteer from "puppeteer";
import { getCodeAndDependencies } from "./bundle-utils";

async function prerender(bundle, html) {
  // Make all scripts in the page inert. These are the non-preload scripts,
  // we don't want to run them.
  const noScriptHTML = html.replace(/<(\/?)script/g, "<$1noscript");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.viewport(1280, 720);
  page.on("pageerror", err => console.error("static-plugin-error", err));

  // prerenderDone is called by our main component on first mount.
  const done = page.evaluate(
    () =>
      new Promise(resolve => {
        window.prerenderDone = resolve;
      })
  );

  await page.setContent(noScriptHTML);

  // This is the prerender version of the JS.
  const scriptToRun = getCodeAndDependencies(bundle, "/main/bootstrap.tsx");
  page.evaluate(scriptToRun);

  await done;

  const renderedHTML = await page.content();
  browser.close();

  const finalHTML = renderedHTML
    // Remove all dynamically added script tags
    .replace(/<script[^>]+src=[^>]+><\/script>/g, "")
    // Remove all inject style calls (as they're already added)
    .replace(/\w+\.styleInject\((["']).*?\1\);/g, "")
    // Re-enable scripts
    .replace(/<(\/?)noscript/g, "<$1script");
  return finalHTML;
}

export default function renderStaticPlugin() {
  const htmlPath = "dist/no-prerender.html";

  return {
    name: "render-static-plugin",
    buildStart() {
      this.addWatchFile(htmlPath);
    },
    async generateBundle(options, bundle) {
      const originalHTML = readFileSync(htmlPath, {
        encoding: "utf8"
      });
      const html = await prerender(bundle, originalHTML);

      // Get rid of everything else in this build. We only care about the HTML.
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
