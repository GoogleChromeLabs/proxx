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

import { applyPatches, Patch } from "immer";

import { h, render } from "preact";

import { Actor, lookup } from "actor-helpers/src/actor/Actor.js";
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
  private stateActor = lookup("state");
  private pubsubActor = lookup("state.pubsub");

  async init() {
    // Subscribe to state updates
    this.pubsubActor.send({
      actorName: this.actorName!,
      type: PubSubMessageType.SUBSCRIBE
    });

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
    this.stateActor.send({
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
    this.stateActor.send({
      type: StateMessageType.TOGGLE_TODO,
      uid
    });
  }

  private newItem() {
    const title = (document.querySelector("#new")! as HTMLInputElement).value;
    this.stateActor.send({
      title,
      type: StateMessageType.CREATE_TODO
    });
  }

  private async loadState() {
    const response = (await sendRequest(this.stateActor, {
      requester: this.actorName!,
      type: StateMessageType.REQUEST_STATE
    })) as StateMessage;
    this.state = response.state;
    this.render(this.state);
  }
}
