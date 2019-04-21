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
import { Close } from "../icons/initial";
import {
  button as btnStyle,
  buttonOff as btnOffStyle,
  buttonOn as btnOnStyle,
  closeButton as closebtnStyle,
  closed as closedStyle,
  settings as settingsStyle,
  settingsWindow as settingsWindowStyle
} from "./style.css";

export interface Props {
  onCloseClicked: () => void;
  open: boolean;
}

export default class Settings extends Component<Props> {
  private focusItem?: HTMLElement;

  render({ onCloseClicked, open }: Props) {
    return (
      <div
        role="dialog"
        aria-label="settings dialog"
        class={[settingsStyle, `${open ? "" : closedStyle}`].join(" ")}
      >
        <div class={settingsWindowStyle}>
          <button
            aria-label="close settings dialog"
            class={closebtnStyle}
            ref={focusItem => (this.focusItem = focusItem)}
            onClick={onCloseClicked}
          >
            <Close />
          </button>
          <button class={true ? btnOnStyle : btnOffStyle}>Animations</button>
          <button class={btnStyle}>About</button>
        </div>
      </div>
    );
  }

  componentDidUpdate() {
    if (this.props.open) {
      this.focusItem!.focus();
    }
  }
}
