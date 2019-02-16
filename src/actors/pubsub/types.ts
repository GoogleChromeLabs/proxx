import { ValidActorMessageName } from "actor-helpers/src/actor/Actor.js";

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
