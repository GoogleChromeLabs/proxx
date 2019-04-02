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

// This promise is used to prevent premature idle-loading. None of the IUU
// promises will be triggered by idle time unless this promise gets resolved.
const { resolve: start, promise: globalBlock } = externalizedPromise<void>();
export { start };

export interface IUUPromise<T> {
  trigger: () => void;
  promise: Promise<T>;
}

function externalizedPromise<T>() {
  let resolve: () => void = {} as any;
  const promise = new Promise<T>(r => (resolve = r));
  return { promise, resolve };
}

export function iuu<T>(executor: () => PromiseLike<T> | T): IUUPromise<T> {
  const { promise, resolve } = externalizedPromise<void>();

  // We don’t start idle-loading until we have the global go signal.
  globalBlock.then(() => maybeRequestIdleCallback(resolve));

  return {
    promise: promise.then(() => executor()),
    trigger: resolve
  };
}

export function maybeRequestIdleCallback(executor: () => void) {
  if (requestIdleCallback) {
    requestIdleCallback(executor);
  } else {
    // TODO: Probably something better?
    setTimeout(executor, 100);
  }
}
