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

let doneDetection = false;
let isSupported = Promise.resolve(false);

export default async function detect(): Promise<boolean> {
  if (doneDetection) {
    return isSupported;
  }
  doneDetection = true;
  isSupported = redetect();
  return isSupported;
}

export async function redetect(): Promise<boolean> {
  if (!("permissions" in navigator)) {
    return false;
  }
  if (!("Accelerometer" in self)) {
    return false;
  }
  const result = await navigator.permissions.query({ name: "accelerometer" });
  if (result.state !== "granted") {
    return false;
  }
  const acl = new Accelerometer({ frequency: 60 });
  acl.start();
  await new Promise(resolve => {
    acl.onactivate = resolve;
  });
  const hasData = await new Promise<boolean>(resolve => {
    acl.onreading = () => resolve(acl.x !== undefined);
    setTimeout(() => resolve(false), 100);
  });
  acl.stop();
  return hasData;
}
