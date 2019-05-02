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

import { expose, proxy } from "comlink/src/comlink.js";

import StateService from "./services/state/index.js";

declare var self: DedicatedWorkerGlobalScope;

const services = {
  stateService: proxy(new StateService())
};

export type RemoteServices = typeof services;

expose(services, self);
performance.mark("State ready");

addEventListener("message", event => {
  if (event.data === "ready?") {
    self.postMessage("READY");
  }
});

self.postMessage("READY");
