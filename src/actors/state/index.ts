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

import { immerable, Patch, produce } from "immer";

import { Actor } from "actor-helpers/src/actor/Actor.js";
import {
  processResponse,
  sendRequest,
  sendResponse
} from "../../utils/request-response.js";

import {
  Message as PubSubMessage,
  MessageType as PubSubMessageType
} from "../pubsub/types.js";

import {
  MarkFieldMessage,
  Message,
  MessageType,
  RequestStateMessage,
  RevealFieldMessage,
  State,
  StateMessage
} from "./types.js";

import MinesweeperGame from "../../gamelogic/index.js";
import { Tag } from "../../gamelogic/types.js";

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
  private game: MinesweeperGame = new MinesweeperGame(10, 10, 10);
  private statePubSubReady?: Promise<void>;

  async init() {
    this.statePubSubReady = this.realm!.lookup("state.pubsub");
    (this.game as any)[immerable] = true;
  }

  async onMessage(msg: Message) {
    if (processResponse(msg)) {
      return;
    }
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.MARK_FIELD](msg: MarkFieldMessage) {
    this.game = produce<MinesweeperGame>(
      this.game!,
      draft => {
        console.log(draft);
        this.game.tag.call(
          draft,
          msg.coordinates[0],
          msg.coordinates[1],
          msg.tag
        );
      },
      patches => {
        console.log("Mark patches", patches);
        this.sendPatches(patches);
      }
    );
  }

  async [MessageType.REVEAL_FIELD](msg: RevealFieldMessage) {
    this.game = produce<MinesweeperGame>(
      this.game!,
      draft => {
        draft.reveal(msg.coordinates[0], msg.coordinates[1]);
        draft.attemptSurroundingReveal(msg.coordinates[0], msg.coordinates[1]);
      },
      patches => {
        console.log("Reveal patches", patches);
        this.sendPatches(patches);
      }
    );
  }

  async [MessageType.REQUEST_STATE](msg: RequestStateMessage) {
    sendResponse(this, msg, {
      state: this.game
    });
  }

  private async sendPatches(patches: Patch[]) {
    await this.statePubSubReady!;
    this.send("state.pubsub", {
      payload: patches,
      type: PubSubMessageType.PUBLISH
    });
  }
}
