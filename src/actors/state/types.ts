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

import { Tag } from "../../gamelogic/types.js";

import MinesweeperGame from "../../gamelogic/index.js";

export enum MessageType {
  FLAG_FIELD,
  REVEAL_FIELD,
  REQUEST_STATE
}

export interface MarkFieldMessage {
  type: MessageType.FLAG_FIELD;
  coordinates: [number, number];
  tag: Tag;
}

export interface RevealFieldMessage {
  type: MessageType.REVEAL_FIELD;
  coordinates: [number, number];
}

export interface RequestStateMessage {
  type: MessageType.REQUEST_STATE;
}

export interface StateMessage {
  state: MinesweeperGame;
}

export type Message =
  | MarkFieldMessage
  | RevealFieldMessage
  | RequestStateMessage;

export type State = MinesweeperGame;
