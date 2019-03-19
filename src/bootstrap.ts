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

import { Remote, wrap } from "comlink/src/comlink.js";

import workerURL from "chunk-name:./worker.js";
import StateService from "./services/state";

const logEl = document.querySelector("#log")!;
function log(msg: string) {
  logEl.innerHTML += `${msg}\n`;
}

const parsedURL = new URL(location.toString());

async function bootstrap() {
  const worker = new Worker(workerURL);

  const { stateService } = wrap(worker);

  if (parsedURL.searchParams.has("deterministic")) {
    await stateService.loadDeterministicField();
  }
  spawnUIService(stateService);

  if (parsedURL.searchParams.has("square")) {
    import("./utils/square-spinner.js");
  }

  import("./services/tilt-image/index.js");
}

async function spawnUIService(stateService: Remote<StateService>) {
  const uiServiceName = (
    parsedURL.searchParams.get("ui") || "preact-canvas"
  ).toLowerCase();
  switch (uiServiceName) {
    case "preact":
      {
        const preactService = await import("./services/preact/index");
        preactService.game(stateService);
      }
      break;
    case "preact-canvas":
      {
        const preactService = await import("./services/preact-canvas/index");
        preactService.game(stateService);
      }
      break;
    case "canvas":
      {
        const canvasService = await import("./services/canvas/index");
        // tslint:disable-next-line:no-unused-expression
        new canvasService.default(stateService);
      }
      break;
    case "lit":
      {
        const litService = await import("./services/lit-element/index");
        // tslint:disable-next-line:no-unused-expression
        new litService.default(stateService);
      }
      break;
    default:
      throw Error("Invalid UI service name");
  }
}

bootstrap().catch(e => log(e.toString()));
