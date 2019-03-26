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
import { game as gameUI } from "./services/preact-canvas/index.js";

const logEl = document.querySelector("#log")!;
function log(msg: string) {
  logEl.innerHTML += `${msg}\n`;
}

async function bootstrap() {
  const worker = new Worker(workerURL);

  const parsedURL = new URL(location.toString());
  const { stateService } = wrap(worker);

  if (parsedURL.searchParams.has("deterministic")) {
    await stateService.loadDeterministicField();
  }

  gameUI(stateService);

  if (parsedURL.searchParams.has("square")) {
    import("./utils/square-spinner.js");
  }
}

bootstrap().catch(e => log(e.toString()));
