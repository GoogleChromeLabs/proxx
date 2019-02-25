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

import { Actor, ActorHandle } from "actor-helpers/src/actor/Actor.js";
import { processResponse, sendResponse } from "../../utils/request-response.js";

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
  StateMessage
} from "./types.js";

import MinesweeperGame from "../../gamelogic/index.js";

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

const BOARD_SIZE = 100;
const DENSITY = 0.1;

export default class StateActor extends Actor<Message> {
  private game: MinesweeperGame = new MinesweeperGame(
    BOARD_SIZE,
    BOARD_SIZE,
    Math.floor(BOARD_SIZE * BOARD_SIZE * DENSITY)
  );
  private statePubSub?: Promise<ActorHandle<"state.pubsub">>;

  async init() {
    this.statePubSub = this.realm!.lookup("state.pubsub");

    // Make the game instance work with ImmerJS
    (this.game as any)[immerable] = true;
  }

  async onMessage(msg: Message) {
    if (processResponse(msg)) {
      return;
    }
    // @ts-ignore
    this[msg.type](msg);
  }

  async [MessageType.FLAG_FIELD](msg: MarkFieldMessage) {
    this.game = produce<MinesweeperGame>(
      this.game!,
      draft => {
        draft.tag(msg.coordinates[0], msg.coordinates[1], msg.tag);
      },
      patches => this.sendPatches(patches)
    );
  }

  async [MessageType.REVEAL_FIELD](msg: RevealFieldMessage) {
    this.game = produce<MinesweeperGame>(
      this.game!,
      draft => {
        draft.reveal(msg.coordinates[0], msg.coordinates[1]);
        draft.attemptSurroundingReveal(msg.coordinates[0], msg.coordinates[1]);
      },
      patches => this.sendPatches(patches)
    );
  }

  async [MessageType.REQUEST_STATE](msg: RequestStateMessage) {
    sendResponse(this, msg, {
      state: this.game
    });
  }

  private async sendPatches(patches: Patch[]) {
    (await this.statePubSub!).send({
      payload: patches,
      type: PubSubMessageType.PUBLISH
    });
  }
}
