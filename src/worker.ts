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

import { Realm } from "actor-helpers/src/realm/Realm.js";
import { PostMessageBridge } from "actor-helpers/src/bridge/PostMessageBridge.js";

import PubSubActor from "./actors/pubsub.js";
import StateActor from "./actors/state.js";
import StorageActor from "./actors/storage.js";

declare var self: DedicatedWorkerGlobalScope;

const realm = new Realm();

realm.hookup("state", new StateActor());
realm.hookup("state.pubsub", new PubSubActor());
realm.hookup("storage", new StorageActor());

const bridge = new PostMessageBridge(self);
bridge.install(realm);