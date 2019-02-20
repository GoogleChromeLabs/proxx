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

import {
  Actor,
  ActorHandle,
  ValidActorMessageName
} from "actor-helpers/src/actor/Actor";

declare global {
  interface RequestNameMap {}
  interface RequestNameResponsePairs {}
}

interface Request {
  requester: ValidActorMessageName;
  requestId: string;
}

const secretMarker = "___reqresmarker";

interface ResponseWrapper<T> {
  original: T;
  requestId: string;
  [secretMarker]: true;
}

type ValidRequestName = keyof RequestNameMap;
type PromiseResolver = (x: any) => void;
export type RequestId = string;

const waitingRequesters = new Map<RequestId, PromiseResolver>();

export function generateUniqueId(): RequestId {
  return [...new Array(16)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

interface Request {
  requester: ValidActorMessageName;
  requestId: RequestId;
}

export function sendRequest<
  T extends ValidActorMessageName,
  R extends ValidRequestName
>(
  sourceActor: Actor<any>,
  actor: ActorHandle<T>,
  request: ActorMessageType[T]
): Promise<RequestNameResponsePairs[R]> {
  return new Promise(resolve => {
    const requestId = generateUniqueId();
    // @ts-ignore
    const augmentedRequest: ActorMessageType[T] & Request = {
      ...request,
      requestId,
      requester: sourceActor.actorName!
    };
    waitingRequesters.set(requestId, resolve);
    sourceActor.realm!.send(actor.actorName, augmentedRequest as any);
  });
}

function isResponse(x: any): x is ResponseWrapper<any> {
  return secretMarker in x && waitingRequesters.has(x.requestId);
}

export function processResponse(msg: any): boolean {
  if (!isResponse(msg)) {
    return false;
  }
  if (waitingRequesters.has(msg.requestId)) {
    const resolver = waitingRequesters.get(msg.requestId)!;
    resolver(msg.original);
  }
  return true;
}

export async function sendResponse<R extends ValidRequestName>(
  sourceActor: Actor<any>,
  req: RequestNameMap[R],
  resp: RequestNameResponsePairs[R]
) {
  const augmentedRequest = req as RequestNameMap[R] & Request;
  const augmentedResponse: ResponseWrapper<RequestNameResponsePairs[R]> = {
    original: resp,
    requestId: augmentedRequest.requestId,
    [secretMarker]: true
  };
  // @ts-ignore
  sourceActor.realm!.send(req.requester, augmentedResponse);
}
