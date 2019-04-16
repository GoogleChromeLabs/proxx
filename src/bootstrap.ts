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

import workerURL from "chunk-name:./worker.js";
import { Remote } from "comlink/src/comlink.js";
import { game as gameUI } from "./services/preact-canvas/index.js";
import { RemoteServices } from "./worker.js";

async function startWorker(): Promise<Remote<RemoteServices>> {
  const worker = new Worker(workerURL);
  const { wrap } = await import("comlink/src/comlink.js");
  return wrap(worker);
}

async function bootstrap() {
  const parsedURL = new URL(location.toString());

  let remoteServices: Promise<Remote<RemoteServices>>;

  if (parsedURL.searchParams.has("debug")) {
    self.debug = import("./services/debug/index.js");
  }

  if (parsedURL.searchParams.has("prerender")) {
    // This will behave the same as if the worker is loading indefinitey. As a
    // result, our UI will stay in the “not ready to play”state for the
    // prerender.
    remoteServices = new Promise(resolve => {
      /* intentionally blank */
    });
  } else {
    remoteServices = startWorker();
  }

  gameUI(remoteServices.then(remoteServices => remoteServices.stateService));

  if (parsedURL.searchParams.has("square")) {
    import("./utils/square-spinner.js");
  }
}

bootstrap().catch(e => console.error(e));
