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

  constructor(private path: string, public sensitivity = 0.1) {
    this._el.classList.add(tiltimage);
    this._el.style.backgroundImage = "url(http://placekitten.com/g/2000/2000)";
    document.body.appendChild(this._el);
  }
}
