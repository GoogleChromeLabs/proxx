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
import { version } from "consts:";
import { Component, h } from "preact";
import {
  isFeaturePhone,
  staticDevicePixelRatio
} from "../../../../utils/static-dpr";
import { Arrow } from "../icons/initial";
import {
  aboutWrapper as aboutWrapperStyle,
  shortcutKey as shortcutKeyStyle,
  shortcutList as shortcutListStyle,
  systemData as systemDataStyle
} from "./style.css";

interface Props {
  motion: boolean;
}

let navigator: any;
navigator = window.navigator;

export default class About extends Component<Props> {
  render() {
    return (
      <div class={aboutWrapperStyle}>
        <h1>About</h1>

        <h2>How to play</h2>
        <p>
          You are on a space mission to a galaxy far away. Your job is to survey
          the space field and flag where black holes are.
        </p>
        <p>
          If the square you click on is not a black hole, you'll see how many of
          its neighboring squares are black holes. Clear all of the squares
          without hitting a black hole to win.
        </p>

        <div>image guide</div>

        <h2>Keyboard Shortcuts</h2>
        <ul class={shortcutListStyle}>
          <li>
            <span class={shortcutKeyStyle} aria-label="f key">
              F
            </span>
            Switch between Clear and Flag mode
          </li>
        </ul>

        <h2>Github</h2>
        <p>
          Source code can be found at our{" "}
          <a href="https://github.com/GoogleChromeLabs/proxx">
            Github repository
          </a>
          .
        </p>

        <h2>Privacy policy</h2>
        <p>
          Google Analytics is used to record{" "}
          <a href="https://support.google.com/analytics/answer/6004245?ref_topic=2919631">
            basic visit data
          </a>
          . Highscores and your user preference are saved locally. No additional
          data is sent to the server.
        </p>

        <h2>System Information</h2>
        <ul class={systemDataStyle}>
          <li>Version: {version} </li>
          <li>Motion: {this.props.motion ? "on" : "off"}</li>
          <li>Feature Phone: {isFeaturePhone ? "yes" : "no"}</li>
          <li>
            Standalone Mode:{" "}
            {window.matchMedia("(display-mode: standalone)").matches
              ? "yes"
              : "no"}{" "}
          </li>
          <li>Screen Width: {window.innerWidth}px</li>
          <li>Screen Height: {window.innerHeight}px</li>
          <li>DPR: {staticDevicePixelRatio}</li>
          <li>Device Memory: {navigator.deviceMemory}</li>
          <li>Concurrency: {navigator.hardwareConcurrency}</li>
          <li>UA: {navigator.userAgent}</li>
        </ul>
      </div>
    );
  }
}
