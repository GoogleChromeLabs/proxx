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

const hasGenericSensorAPI = detectGenericSensorAPI();
const hasDeviceMotionAPI = detectDeviceMotionAPI();

async function detectGenericSensorAPI(): Promise<boolean> {
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

async function detectDeviceMotionAPI(): Promise<boolean> {
  return new Promise(resolve => {
    window.addEventListener("devicemotion", ev => {
      if (
        !ev.accelerationIncludingGravity ||
        !ev.accelerationIncludingGravity.x
      ) {
        resolve(false);
      }
      resolve(true);
    });
    setTimeout(() => resolve(false), 100);
  });
}

export type UnsubscribeFunction = () => void;
export interface SubscriptionOpts {
  frequency: number;
}
const defaultOpts: SubscriptionOpts = {
  frequency: 10
};

export async function subscribe(
  cb: (data: DeviceMotionEvent) => void,
  opts: Partial<SubscriptionOpts> = {}
): Promise<UnsubscribeFunction> {
  const fullOpts = Object.assign({}, defaultOpts, opts) as SubscriptionOpts;
  if (await hasGenericSensorAPI) {
    return subscribeGenericSensor(cb, fullOpts);
  } else if (await hasDeviceMotionAPI) {
    return subscribeDeviceMotion(cb, fullOpts);
  }
  console.warn("No accelerometer available");
  return () => null;
}

async function subscribeGenericSensor(
  cb: (data: DeviceMotionEvent) => void,
  opts: SubscriptionOpts
): Promise<UnsubscribeFunction> {
  const accelerometer = new Accelerometer({
    frequency: opts.frequency
  });
  accelerometer.start();
  await new Promise((resolve, reject) => {
    accelerometer!.onactivate = resolve;
    accelerometer!.onerror = reject;
  });
  accelerometer.onreading = () => {
    cb({
      accelerationIncludingGravity: {
        x: accelerometer!.x,
        y: accelerometer!.y,
        z: accelerometer!.z
      }
    } as any);
  };
  return () => accelerometer.stop();
}

async function subscribeDeviceMotion(
  cb: (data: DeviceMotionEvent) => void,
  opts: SubscriptionOpts
): Promise<UnsubscribeFunction> {
  window.addEventListener("devicemotion", cb);
  return () => window.removeEventListener("devicemotion", cb);
}
