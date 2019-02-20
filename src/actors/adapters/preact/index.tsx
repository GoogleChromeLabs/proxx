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

import { Actor, ActorHandle } from "actor-helpers/src/actor/Actor.js";
import {
  processResponse,
  sendRequest
} from "../../../utils/request-response.js";

import {
  MessageType as PubSubMessageType,
  PublishMessage
} from "../../pubsub/types.js";
import {
  // defaultState,
  MessageType as StateMessageType,
  State,
  StateMessage
} from "../../state/types.js";

import { Tag } from "../../../gamelogic/types.js";

declare global {
  interface ActorMessageType {
    ui: Message;
  }
}

export type Message = PublishMessage;

export default class PreactAdapter extends Actor<Message> {
  private state?: State;
  private stateActor?: Promise<ActorHandle<"state">>;

  async init() {
    // Subscribe to state updates
    this.realm!.lookup("state.pubsub").then(pubsubActor => {
      pubsubActor.send({
        actorName: this.actorName!,
        type: PubSubMessageType.SUBSCRIBE
      });
    });

    this.click = this.click.bind(this);

    this.stateActor = this.realm!.lookup("state");
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
    this.render(this.state!);
  }

  private render(state: State) {
    render(
      <table>
        {state.grid.map((row, y) => (
          <tr>
            {row.map((cell, x) => (
              <td data-x={x} data-y={y} onClick={this.click}>
                {cell.revealed
                  ? cell.hasMine
                    ? "B"
                    : cell.touching
                  : cell.tag !== Tag.None
                  ? "F"
                  : "?"}
              </td>
            ))}
          </tr>
        ))}
      </table>,
      document.body,
      document.body.firstChild as any
    );
  }

  private click(ev: MouseEvent) {
    const { x, y } = (ev.target! as HTMLElement).dataset;
    if (ev.shiftKey) {
      this.mark(Number(x), Number(y));
    } else {
      this.reveal(Number(x), Number(y));
    }
  }

  private async reveal(x: number, y: number) {
    (await this.stateActor!).send({
      coordinates: [Number(x), Number(y)],
      type: StateMessageType.REVEAL_FIELD
    });
  }

  private async mark(x: number, y: number) {
    (await this.stateActor!).send({
      coordinates: [Number(x), Number(y)],
      tag: Tag.Mark,
      type: StateMessageType.MARK_FIELD
    });
  }

  private async loadState() {
    const stateActor = await this.stateActor!;
    const response = (await sendRequest(this, stateActor, {
      type: StateMessageType.REQUEST_STATE
    })) as StateMessage;
    this.state = response.state;
    this.render(this.state);
  }
}
