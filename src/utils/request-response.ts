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

import { ActorHandle, lookup } from "actor-helpers/src/actor/Actor.js";

export interface Response {
  requestId: RequestId;
}
declare global {
  interface RequestNameMap {}
  interface RequestNameResponsePairs {}
}

type ValidRequestName = keyof RequestNameMap;
type PromiseResolver = (x: any) => void;
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type ValidActorName = keyof ActorMessageType;
export type RequestId = string;

const waitingRequesters = new Map<RequestId, PromiseResolver>();

export function generateUniqueId(): RequestId {
  return [...new Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

export interface Request {
  requester: string;
  requestId: RequestId;
}

export function sendRequest<
  T extends ValidActorName,
  R extends ValidRequestName
>(
  handle: ActorHandle<T>,
  request: Omit<ActorMessageType[T] & Request, "requestId">
): Promise<RequestNameResponsePairs[R]> {
  return new Promise(resolve => {
    const requestId = generateUniqueId();
    // @ts-ignore
    const augmentedRequest: ActorMessageType[T] & Request = {
      ...request,
      requestId
    };
    waitingRequesters.set(requestId, resolve);
    handle.send(augmentedRequest);
  });
}

function isResponse(x: any): x is Response {
  return "requestId" in x && waitingRequesters.has(x.requestId);
}

export function processResponse(msg: any): boolean {
  if (!isResponse(msg)) {
    return false;
  }
  if (waitingRequesters.has(msg.requestId)) {
    const resolver = waitingRequesters.get(msg.requestId)!;
    resolver(msg);
  }
  return true;
}

export async function sendResponse<R extends ValidRequestName>(
  req: RequestNameMap[R],
  resp: Omit<RequestNameResponsePairs[R], "requestId">
) {
  // @ts-ignore
  const actor = lookup(req.requester);
  actor.send({
    // @ts-ignore
    ...resp,
    requestId: req.requestId
  });
}
