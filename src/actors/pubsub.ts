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

import { Actor, ValidActorMessageName } from "actor-helpers/src/actor/Actor.js";

export enum MessageType {
  SUBSCRIBE,
  PUBLISH
}

export interface SubscribeMessage {
  type: MessageType.SUBSCRIBE;
  actorName: ValidActorMessageName;
}

export interface PublishMessage {
  type: MessageType.PUBLISH;
  sourceActorName?: ValidActorMessageName;
  payload: {};
}

export type Message = SubscribeMessage | PublishMessage;

interface Subscriber {
  name: ValidActorMessageName;
  ready: Promise<void>;
}

export default class PubSubActor extends Actor<Message> {
  subscribers: Subscriber[] = [];

  async onMessage(msg: Message) {
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.SUBSCRIBE](msg: SubscribeMessage) {
    const ready = this.realm!.lookup(msg.actorName as any);
    this.subscribers.push({
      name: msg.actorName,
      ready
    });
  }

  async [MessageType.PUBLISH](msg: PublishMessage) {
    for (const { name, ready } of this.subscribers) {
      if (name === msg.sourceActorName) {
        continue;
      }
      ready.then(() => this.realm!.send(name, msg));
    }
  }
}
