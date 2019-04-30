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
    <circle cx="12" cy="12" r="2" />
    <rect width="16" height="16" x="4" y="4" rx="2" />
  </svg>
);

export const Close = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

export const Star = (props: JSX.HTMLAttributes) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22 9.2l-7.2-.6L12 2 9.2 8.6 2 9.2 7.5 14l-1.7 7 6.2-3.7 6.2 3.7-1.6-7L22 9.2zm-10 6.2l-3.8 2.3 1-4.3L6 10.5l4.4-.4 1.7-4 1.7 4 4.4.4-3.3 2.9 1 4.3-3.8-2.3z" />
  </svg>
);
