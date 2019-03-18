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

import { tiltimage } from "./style.css";

export default class TiltImage {
  private _el = document.createElement("div");
  private _target = [0, 0];
  private _current = [0, 0];
  private _started = false;

  constructor(private path: string, public smoothing = 20) {
    this._el.classList.add(tiltimage);
    this._el.style.backgroundImage = `url(${path})`;
    document.body.appendChild(this._el);

    this.ontilt = this.ontilt.bind(this);
  }

  start() {
    if (this._started) {
      return;
    }
    this._started = true;
    window.addEventListener("devicemotion", this.ontilt);
    this.onrender = this.onrender.bind(this);
    this.onrender();
  }

  stop() {
    if (!this._started) {
      return;
    }
    this._started = false;
    window.removeEventListener("devicemotion", this.ontilt);
  }

  private ontilt({ accelerationIncludingGravity }: DeviceMotionEvent) {
    this._target[0] = accelerationIncludingGravity!.x!;
    this._target[1] = accelerationIncludingGravity!.y!;
  }

  private onrender() {
    this._el.style.transform = `translate(${this._current[0]}vmax, ${-this
      ._current[1]}vmax)`;
    this._current[0] += (this._target[0] - this._current[0]) / this.smoothing;
    this._current[1] += (this._target[1] - this._current[1]) / this.smoothing;
    if (this._started) {
      requestAnimationFrame(this.onrender);
    }
  }
}
