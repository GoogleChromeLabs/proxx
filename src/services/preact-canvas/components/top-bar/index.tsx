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
import { minSec } from "../../../../utils/format";
import { Square, Timer } from "../icons/additional";
import {
  squareIcon,
  squaresLeft,
  time,
  timeIcon,
  title,
  topBar
} from "./style.css";

// tslint:disable:max-classes-per-file

interface TimeProps {
  running: boolean;
}

// Using a sub class to avoid Preact diffing every second.
class Time extends Component<TimeProps, {}> {
  private _start?: number;
  private _intervalId?: number;

  componentDidMount() {
    if (this.props.running) {
      this._startTimer();
    }
  }

  componentWillReceiveProps({ running }: TimeProps) {
    if (running === this.props.running) {
      return;
    }

    if (running) {
      this._startTimer();
    } else {
      this._stopTimer();
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  componentWillUnmount() {
    this._stopTimer();
  }

  render() {
    return <div>00:00</div>;
  }

  private _startTimer() {
    this._start = Date.now();

    this._intervalId = setInterval(() => {
      requestAnimationFrame(() => {
        this.base!.textContent = minSec(Date.now() - this._start!);
      });
    }, 1000);
  }

  private _stopTimer() {
    clearInterval(this._intervalId);
  }
}

export interface Props {
  toRevealTotal?: number;
  toReveal?: number;
  timerRunning?: boolean;
  titleOnly?: boolean;
}

export interface State {}

// tslint:disable-next-line:max-classes-per-file
export default class TopBar extends Component<Props, State> {
  render({ toReveal, toRevealTotal, timerRunning, titleOnly }: Props) {
    return (
      <div class={topBar}>
        <h1 class={title}>Proxx</h1>
        {!titleOnly && (
          <div class={squaresLeft}>
            <Square class={squareIcon} />{" "}
            {toReveal!
              .toString()
              .padStart(toRevealTotal!.toString().length, "0")}
            /{toRevealTotal}
          </div>
        )}
        {!titleOnly && (
          <div class={time}>
            <Time running={timerRunning!} />
            <Timer class={timeIcon} animate={timerRunning} />
          </div>
        )}
      </div>
    );
  }
}
