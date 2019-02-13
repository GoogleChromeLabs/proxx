/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { get, set } from "idb-keyval";

import { Actor } from "actor-helpers/src/actor/Actor.js";

import { Request, Response, sendResponse } from "../utils/request-response.js";

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

export type LoadRequestMessage = {
  type: MessageType.LOAD_REQUEST;
} & Request;

export type LoadResponseMessage = {
  type: MessageType.LOAD_RESPONSE;
  todos: Todo[];
} & Response;

export type Message = SaveMessage | LoadRequestMessage;

export default class StorageActor extends Actor<Message> {
  async onMessage(msg: Message) {
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.LOAD_REQUEST](msg: LoadRequestMessage) {
    const todos = (await get("todos")) as Todo[];
    sendResponse(msg, {
      todos: todos || []
    });
  }

  async [MessageType.SAVE](msg: SaveMessage) {
    await set("todos", msg.todos);
  }
}
