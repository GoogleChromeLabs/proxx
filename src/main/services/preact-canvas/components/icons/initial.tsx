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

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.
// rollup-plugin-bundle-guard: group=entry

// tslint:disable:max-line-length variable-name

export const Fullscreen = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

export const Information = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
  </svg>
);

export const Arrow = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 10 5" preserveAspectRatio="none" {...props}>
    <path d="M0 0l5 5 5-5z" />
  </svg>
);

export const Back = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);
