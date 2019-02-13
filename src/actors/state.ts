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

import { Patch, produce } from "immer";

import { Actor, lookup } from "actor-helpers/src/actor/Actor.js";
import {
  generateUniqueId,
  processResponse,
  Request,
  Response,
  sendRequest,
  sendResponse
} from "../utils/request-response.js";
import {
  Message as PubSubMessage,
  MessageType as PubSubMessageType
} from "./pubsub.js";
import {
  LoadResponseMessage,
  MessageType as StorageMessageType
} from "./storage.js";

import { Todo } from "../types.js";

declare global {
  interface ActorMessageType {
    state: Message;
    "state.pubsub": PubSubMessage;
  }
  interface RequestNameMap {
    RequestStateMessage: RequestStateMessage;
  }
  interface RequestNameResponsePairs {
    RequestStateMessage: StateMessage;
  }
}

export enum MessageType {
  CREATE_TODO,
  DELETE_TODO,
  TOGGLE_TODO,
  REQUEST_STATE
}

export interface CreateMessage {
  type: MessageType.CREATE_TODO;
  title: string;
}

export interface DeleteMessage {
  type: MessageType.DELETE_TODO;
  uid: string;
}

export interface ToggleMessage {
  type: MessageType.TOGGLE_TODO;
  uid: string;
}

export type RequestStateMessage = {
  type: MessageType.REQUEST_STATE;
} & Request;

export type StateMessage = {
  state: State;
} & Response;

export type Message =
  | CreateMessage
  | DeleteMessage
  | ToggleMessage
  | RequestStateMessage
  | LoadResponseMessage;

export interface State {
  items: Todo[];
}

export const defaultState: State = {
  items: []
};

export default class StateActor extends Actor<Message> {
  private storage = lookup("storage");
  private pubsub = lookup("state.pubsub");
  private _state: State = defaultState;

  get state() {
    return this._state;
  }

  set state(val) {
    this._state = val;
    this.storage.send({
      todos: this._state.items,
      type: StorageMessageType.SAVE
    });
  }

  async init() {
    this.loadState();
  }

  async onMessage(msg: Message) {
    if (processResponse(msg)) {
      return;
    }
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.CREATE_TODO](msg: CreateMessage) {
    this.state = produce<State>(
      this.state,
      draft => {
        draft.items.push({
          done: false,
          title: msg.title,
          uid: generateUniqueId()
        });
      },
      p => this.sendPatches(p)
    );
  }

  async [MessageType.DELETE_TODO](msg: DeleteMessage) {
    this.state = produce<State>(
      this.state,
      draft => {
        const idx = draft.items.findIndex(item => item.uid === msg.uid);
        if (idx === -1) {
          return;
        }
        draft.items.splice(idx, 1);
      },
      p => this.sendPatches(p)
    );
  }

  async [MessageType.REQUEST_STATE](msg: RequestStateMessage) {
    sendResponse(msg, {
      state: this.state
    });
  }

  async [MessageType.TOGGLE_TODO](msg: ToggleMessage) {
    this.state = produce<State>(
      this.state,
      draft => {
        const item = draft.items.find(item => item.uid === msg.uid);
        if (!item) {
          return;
        }
        item.done = !item.done;
      },
      p => this.sendPatches(p)
    );
  }

  private sendPatches(patches: Patch[]) {
    this.pubsub.send({
      payload: patches,
      type: PubSubMessageType.PUBLISH
    });
  }

  private async loadState() {
    const response = await sendRequest(this.storage, {
      requester: this.actorName!,
      type: StorageMessageType.LOAD_REQUEST
    });
    this.state = produce<State>(
      this.state,
      draft => {
        draft.items = (response as LoadResponseMessage).todos;
      },
      p => this.sendPatches(p)
    );
  }
}
