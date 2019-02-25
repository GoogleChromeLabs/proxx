import { Cell, State as GameState, Tag } from "../../gamelogic/types.js";

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
  // state: State;
  state: MinesweeperGame;
}

export type Message =
  | MarkFieldMessage
  | RevealFieldMessage
  | RequestStateMessage;

// export interface State {
//   gameState: GameState;
//   grid: Cell[][];
// }

export type State = MinesweeperGame;

// export const defaultState: State = {
//   gameState: GameState.Pending,
//   grid: [],
// };
