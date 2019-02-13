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

import { Actor, ActorHandle, lookup } from "actor-helpers/src/actor/Actor.js";

export enum MessageType {
  SUBSCRIBE,
  PUBLISH
}

export interface SubscribeMessage {
  type: MessageType.SUBSCRIBE;
  actorName: string;
}

export interface PublishMessage {
  type: MessageType.PUBLISH;
  sourceActorName?: string;
  payload: {};
}

export type Message = SubscribeMessage | PublishMessage;

interface Subscriber {
  name: string;
  handle: ActorHandle<any>;
}

export default class PubSubActor extends Actor<Message> {
  subscribers: Subscriber[] = [];

  async onMessage(msg: Message) {
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.SUBSCRIBE](msg: SubscribeMessage) {
    const handle = lookup(msg.actorName as any);
    this.subscribers.push({
      handle,
      name: msg.actorName
    });
  }

  async [MessageType.PUBLISH](msg: PublishMessage) {
    for (const { name, handle } of this.subscribers) {
      if (name === msg.sourceActorName) {
        continue;
      }
      handle.send(msg);
    }
  }
}
