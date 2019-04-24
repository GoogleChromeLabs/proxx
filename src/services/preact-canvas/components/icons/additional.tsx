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
import { timeIcon, timeIconAnimate, timeIconSvg } from "./style.css";

// tslint:disable:max-line-length variable-name

interface TimerProps extends JSX.HTMLAttributes {
  animate?: boolean;
}

export const Timer = (props: TimerProps) => {
  const { animate = false, ...standardProps } = props;

  return (
    <div {...standardProps}>
      <div class={`${timeIcon} ${animate ? timeIconAnimate : ""}`}>
        <svg class={timeIconSvg} viewBox="0 0 24 24">
          <path d="M15 1H9v2h6V1zm4 6.4L20.4 6 19 4.6 17.6 6A9 9 0 0 0 3 13c0 5 4 9 9 9a9 9 0 0 0 7-14.6zM12 20c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z" />
        </svg>
      </div>
    </div>
  );
};

export const Square = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M18 4H6a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H6V6h12v12z" />
  </svg>
);

export const EndSquare = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 124 124" {...props}>
    <g fill="none" fill-rule="evenodd" transform="rotate(45 38.2 71.7)">
      <rect width="94" height="94" x="1" y="1" stroke-width="2" rx="16" />
      <g stroke-dasharray="1 4" stroke-width="2" opacity=".5">
        <path d="M17 6l55.9-3.8a16 16 0 0 1 17 14.8l4 55.9a16 16 0 0 1-14.9 17l-55.9 4A16 16 0 0 1 6.1 79L2 23.1a16 16 0 0 1 15-17z" />
        <path d="M21 13.4l43.5-6a16 16 0 0 1 18 13.5l6.2 43.6a16 16 0 0 1-13.6 18l-43.6 6.2a16 16 0 0 1-18-13.6L7.2 31.5a16 16 0 0 1 13.6-18z" />
        <path d="M28.3 28.3l18.3-8.1a16 16 0 0 1 21 8l8.2 18.4a16 16 0 0 1-8 21l-18.4 8.2a16 16 0 0 1-21-8l-8.2-18.4a16 16 0 0 1 8-21z" />
        <path d="M23.8 21.6l30.8-8.8a16 16 0 0 1 19.8 11l8.8 30.8a16 16 0 0 1-11 19.8l-30.8 8.8a16 16 0 0 1-19.8-11l-8.8-30.8a16 16 0 0 1 11-19.8z" />
        <path d="M34 33.2l6.8-4.3a16 16 0 0 1 22 5.1l4.3 6.8a16 16 0 0 1-5.1 22l-6.8 4.3a16 16 0 0 1-22-5.1l-4.3-6.8a16 16 0 0 1 5.1-22z" />
      </g>
      <path fill="#fff" d="M40 48a8 8 0 1 1 16 0 8 8 0 0 1-16 0z" />
    </g>
  </svg>
);

export const Close = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export const Back = (props: JSX.HTMLAttributes) => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...props}>
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);
