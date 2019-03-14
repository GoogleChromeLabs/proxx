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

import { wrap } from "comlink/src/comlink.js";

import workerURL from "chunk-name:./worker.js";

const logEl = document.querySelector("#log")!;
function log(msg: string) {
  logEl.innerHTML += `${msg}\n`;
}

async function bootstrap() {
  log("Booting!");
  try {
    const worker = new Worker(workerURL);
    worker.addEventListener("error", e => {
      log(`Worker error: ${e.toString()}`);
    });

    const { stateService } = wrap(worker);
    const uiServiceName = (
      new URL(location.toString()).searchParams.get("ui") || "preact"
    ).toLowerCase();
    switch (uiServiceName) {
      case "preact":
        {
          const preactService = await import("./services/preact/index.js");
          preactService.game(stateService);
        }
        break;
      case "canvas":
        {
          const canvasService = await import("./services/canvas/index.js");
          // tslint:disable-next-line:no-unused-expression
          new canvasService.default(stateService);
        }
        break;
      case "lit":
        {
          const litService = await import("./services/lit-element/index.js");
          // tslint:disable-next-line:no-unused-expression
          new litService.default(stateService);
        }
        break;
      default:
        throw Error("Invalid UI service name");
    }
  } catch (e) {
    log(`Caught throw: ${e.message}\n${e.stack}`);
  }
}

bootstrap();
