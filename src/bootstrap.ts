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

import { PostMessageBridge } from "actor-helpers/src/bridge/PostMessageBridge.js";
import { Realm } from "actor-helpers/src/realm/Realm.js";

import PreactAdapter from "./actors/adapters/preact";

async function bootstrap() {
  const worker = new Worker("worker.js");

  const realm = new Realm();
  const bridge = new PostMessageBridge(worker);
  bridge.install(realm);

  realm.hookup("ui", new PreactAdapter());
}

bootstrap();
