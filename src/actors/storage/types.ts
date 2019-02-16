import { Todo } from "../../types.js";

export enum MessageType {
  SAVE,
  LOAD_REQUEST,
  LOAD_RESPONSE
}

export interface SaveMessage {
  type: MessageType.SAVE;
  todos: Todo[];
}

export interface LoadRequestMessage {
  type: MessageType.LOAD_REQUEST;
}

export interface LoadResponseMessage {
  todos: Todo[];
}

export type Message = SaveMessage | LoadRequestMessage;
