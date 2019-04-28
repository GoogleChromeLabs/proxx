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
import { prerender } from "./utils/constants.js";
import { nextEvent } from "./utils/scheduling.js";
import { RemoteServices } from "./worker.js";

async function startWorker(): Promise<Remote<RemoteServices>> {
  const worker = new Worker(workerURL);

  const [{ wrap }] = await Promise.all([
    import("comlink/src/comlink.js"),
    nextEvent(worker, "message")
  ]);
  // iOS Safari seems to kill a worker that doesn’t receive
  // messages after a while. So we prevent that by sending
  // dummy keep-alive messages.
  setInterval(() => {
    worker.postMessage("");
  }, 3000);
  return wrap(worker);
}

async function bootstrap() {
  const remoteServices = startWorker();
  gameUI(remoteServices.then(remoteServices => remoteServices.stateService));
}

bootstrap().catch(e => console.error(e));

if (!prerender) {
  window.ga = window.ga || ((...args: any[]) => (ga.q = ga.q || []).push(args));
  ga("create", "UA-139146337-1", "auto");
  ga("set", "transport", "beacon");
  ga("send", "pageview");
  // Load the GA script
  const s = document.createElement("script");
  s.src = "https://www.google-analytics.com/analytics.js";
  document.head!.appendChild(s);
}
