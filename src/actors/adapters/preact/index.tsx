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

import { applyPatches, Patch } from "immer";

import { h, render } from "preact";

import { Actor } from "actor-helpers/src/actor/Actor.js";
import {
  processResponse,
  sendRequest
} from "../../../utils/request-response.js";

import {
  MessageType as PubSubMessageType,
  PublishMessage
} from "../../pubsub.js";
import {
  defaultState,
  MessageType as StateMessageType,
  State,
  StateMessage
} from "../../state.js";

declare global {
  interface ActorMessageType {
    ui: Message;
  }
}

export type Message = PublishMessage;

export default class PreactAdapter extends Actor<Message> {
  private state: State = defaultState;
  private stateActorReady?: Promise<void>;

  async init() {
    // Subscribe to state updates
    this.realm!.lookup("state.pubsub").then(() => {
      this.realm!.send("state.pubsub", {
        actorName: this.actorName!,
        type: PubSubMessageType.SUBSCRIBE
      });
    });

    this.stateActorReady = this.realm!.lookup("state");
    this.loadState();
  }

  async onMessage(msg: Message) {
    if (processResponse(msg)) {
      return;
    }
    // @ts-ignore
    this[msg.type](msg);
  }

  [PubSubMessageType.PUBLISH](msg: PublishMessage) {
    console.log("Got a publish");
    this.state = applyPatches(this.state, msg.payload as Patch[]);
    this.render(this.state);
  }

  private render(state: State) {
    render(
      <main onChange={e => this.toggleItem(e)}>
        {state.items.map(item => (
          <label data-uid={item.uid}>
            <input type="checkbox" checked={item.done} />
            {item.title}
            <button onClick={e => this.deleteItem(e)}>-</button>
          </label>
        ))}
        <input type="text" id="new" />
        <button onClick={() => this.newItem()}>+</button>
      </main>,
      document.body,
      document.body.firstChild as any
    );
  }

  private deleteItem(e: Event) {
    const label = (e.target as HTMLElement).closest("label");
    if (!label) {
      return;
    }
    const uid = label.dataset.uid!;
    if (!uid) {
      return;
    }
    this.realm!.send("state", {
      type: StateMessageType.DELETE_TODO,
      uid
    });
  }

  private toggleItem(e: Event) {
    const label = (e.target as HTMLElement).closest("label");
    if (!label) {
      return;
    }
    const uid = label.dataset.uid!;
    if (!uid) {
      return;
    }
    this.realm!.send("state", {
      type: StateMessageType.TOGGLE_TODO,
      uid
    });
  }

  private newItem() {
    const title = (document.querySelector("#new")! as HTMLInputElement).value;
    console.log("Sending new item", title);
    this.realm!.send("state", {
      title,
      type: StateMessageType.CREATE_TODO
    });
  }

  private async loadState() {
    await this.stateActorReady!;
    const response = (await sendRequest(this, "state", {
      type: StateMessageType.REQUEST_STATE
    })) as StateMessage;
    this.state = response.state;
    this.render(this.state);
  }
}
