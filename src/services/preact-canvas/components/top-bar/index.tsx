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
import { Square, Timer } from "../icons";
import {
  squareIcon,
  squaresLeft,
  time,
  timeIcon,
  title,
  topBar
} from "./style.css";

// tslint:disable:max-classes-per-file

// Using a sub class to avoid Preact diffing every second.
class Time extends Component<{}, {}> {
  private _start = Date.now();
  private _intervalId?: number;

  componentDidMount() {
    this._intervalId = setInterval(() => {
      requestAnimationFrame(() => {
        const diff = Date.now() - this._start;
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff / 1000) % 60);
        const minStr = minutes < 10 ? "0" + minutes : "" + minutes;
        const secStr = seconds < 10 ? "0" + seconds : "" + seconds;
        this.base!.textContent = `${minStr}:${secStr}`;
      });
    }, 1000);
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    clearInterval(this._intervalId);
  }

  render() {
    return <div>00:00</div>;
  }
}

export interface Props {
  toRevealTotal: number;
  toReveal: number;
}

export interface State {}

// tslint:disable-next-line:max-classes-per-file
export default class TopBar extends Component<Props, State> {
  render({ toReveal, toRevealTotal }: Props) {
    return (
      <div class={topBar}>
        <h1 class={title}>Graviton</h1>
        <div class={squaresLeft}>
          <Square class={squareIcon} /> {toReveal} / {toRevealTotal}
        </div>
        <div class={time}>
          <Time /> <Timer class={timeIcon} />
        </div>
      </div>
    );
  }
}
