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

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

export default async function localStateSubscribe(
  stateService: import("comlink/src/comlink").Remote<
    import("../../../worker/state-service").default
  >,
  callback: (
    stateChanges: import("../../../worker/state-service").StateChange
  ) => void
) {
  const { comlinkProxy } = await import("../preact-canvas/lazy-load");
  stateService.subscribe(comlinkProxy(callback));
}
