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

const el = document.createElement("div");
Object.assign(el.style, {
  backgroundColor: "red",
  height: "100px",
  position: "absolute",
  right: "50px",
  top: "50px",
  width: "100px",
  willChange: "transform"
});
document.body.appendChild(el);

let angle = 0;
let start = 0;
requestAnimationFrame(function f(ts) {
  if (!start) {
    start = ts;
  }
  el.style.transform = "rotate(" + angle + "deg)";
  angle = ((ts - start) * 360) / 1000;
  requestAnimationFrame(f);
});

export default 0;
