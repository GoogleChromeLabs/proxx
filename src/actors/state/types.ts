import { Todo } from "../../types.js";
import { LoadResponseMessage } from "../storage/types.js";

export enum MessageType {
  CREATE_TODO,
  DELETE_TODO,
  TOGGLE_TODO,
  REQUEST_STATE
}

export interface CreateMessage {
  type: MessageType.CREATE_TODO;
  title: string;
}

export interface DeleteMessage {
  type: MessageType.DELETE_TODO;
  uid: string;
}

export interface ToggleMessage {
  type: MessageType.TOGGLE_TODO;
  uid: string;
}

export interface RequestStateMessage {
  type: MessageType.REQUEST_STATE;
}

export interface StateMessage {
  state: State;
}

export type Message =
  | CreateMessage
  | DeleteMessage
  | ToggleMessage
  | RequestStateMessage
  | LoadResponseMessage;

export interface State {
  items: Todo[];
}

export const defaultState: State = {
  items: []
};
