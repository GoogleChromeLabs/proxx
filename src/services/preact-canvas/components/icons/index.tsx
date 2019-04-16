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
import { h } from "preact";
import { timeIcon } from "./style.css";

// tslint:disable:max-line-length variable-name

export const Fullscreen = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

export const Timer = (props: JSX.HTMLAttributes) => (
  <div {...props}>
    <div class={timeIcon}>
      <svg viewBox="0 0 24 24">
        <path d="M15 1H9v2h6V1zm4 6.4L20.4 6 19 4.6 17.6 6A9 9 0 0 0 3 13c0 5 4 9 9 9a9 9 0 0 0 7-14.6zM12 20c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
      </svg>
    </div>
  </div>
);
