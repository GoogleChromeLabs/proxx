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

import { Patch, produce } from "immer";

import { Actor } from "actor-helpers/src/actor/Actor.js";
import {
  generateUniqueId,
  processResponse,
  sendRequest,
  sendResponse
} from "../../utils/request-response.js";
import {
  Message as PubSubMessage,
  MessageType as PubSubMessageType
} from "../pubsub/types.js";

import {
  CreateMessage,
  defaultState,
  DeleteMessage,
  Message,
  MessageType,
  RequestStateMessage,
  State,
  StateMessage,
  ToggleMessage
} from "./types.js";

import {
  LoadResponseMessage,
  MessageType as StorageMessageType
} from "../storage/types.js";

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

export default class StateActor extends Actor<Message> {
  private storageReady?: Promise<void>;
  private statePubSubReady?: Promise<void>;
  private _state: State = defaultState;

  get state() {
    return this._state;
  }

  set state(val) {
    this._state = val;
    this.storageReady!.then(() =>
      this.realm!.send("storage", {
        todos: this._state.items,
        type: StorageMessageType.SAVE
      })
    );
  }

  async init() {
    this.storageReady = this.realm!.lookup("storage");
    this.statePubSubReady = this.realm!.lookup("state.pubsub");
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
    sendResponse(this, msg, {
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

  private async sendPatches(patches: Patch[]) {
    await this.statePubSubReady!;
    this.send("state.pubsub", {
      payload: patches,
      type: PubSubMessageType.PUBLISH
    });
  }

  private async loadState() {
    await this.storageReady!;
    const response = await sendRequest(this, "storage", {
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
