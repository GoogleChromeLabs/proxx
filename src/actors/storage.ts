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

import { get, set } from "idb-keyval";

import { Actor } from "actor-helpers/src/actor/Actor.js";

import { sendResponse } from "../utils/request-response.js";

import { Todo } from "../types.js";

declare global {
  interface ActorMessageType {
    storage: Message;
  }
  interface RequestNameMap {
    LoadRequestMessage: LoadRequestMessage;
  }
  interface RequestNameResponsePairs {
    LoadRequestMessage: LoadResponseMessage;
  }
}

export enum MessageType {
  SAVE,
  LOAD_REQUEST,
  LOAD_RESPONSE
}

export interface SaveMessage {
  type: MessageType.SAVE;
  todos: Todo[];
}

export interface LoadRequestMessage {
  type: MessageType.LOAD_REQUEST;
};

export interface LoadResponseMessage {
  type: MessageType.LOAD_RESPONSE;
  todos: Todo[];
};

export type Message = SaveMessage | LoadRequestMessage;

export default class StorageActor extends Actor<Message> {
  async onMessage(msg: Message) {
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.LOAD_REQUEST](msg: LoadRequestMessage) {
    const todos = (await get("todos")) as Todo[];
    sendResponse(this, msg, {
      todos: todos || []
    });
  }

  async [MessageType.SAVE](msg: SaveMessage) {
    await set("todos", msg.todos);
  }
}
