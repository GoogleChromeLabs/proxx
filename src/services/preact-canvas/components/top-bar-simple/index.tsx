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
import { Component, h } from "preact";
import { title, topBar } from "./style.css";

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

// tslint:disable-next-line:max-classes-per-file
export default class TopBarSimple extends Component<{}, {}> {
  render() {
    return (
      <div class={topBar} role="banner">
        <h1 class={title}>Proxx</h1>
      </div>
    );
  }
}
