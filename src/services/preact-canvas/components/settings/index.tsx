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
import { bind } from "src/utils/bind.js";
import { isFeaturePhone } from "src/utils/static-display";
import About from "../about";
import { Close } from "../icons/additional";
import {
  buttonOff as btnOffStyle,
  buttonOn as btnOnStyle,
  closeButton as closebtnStyle,
  closeContainer as closeContainerStyle,
  fpCloseButton as fpCloseBtnStyle,
  fpCloseContainer as fpCloseContainerStyle,
  keyshortcut as keyshortcutStyle,
  settings as settingsStyle,
  settingsContent as settingsContentStyle,
  settingsWindow as settingsWindowStyle
} from "./style.css";

interface Props {
  onCloseClicked: () => void;
  onMotionPrefChange: () => void;
  motion: boolean;
  disableAnimationBtn: boolean;
  texturePromise: Promise<any>;
  supportsSufficientWebGL: boolean;
}

interface State {}

export default class Settings extends Component<Props, State> {
  private focusItem?: HTMLElement;

  render({
    onCloseClicked,
    onMotionPrefChange,
    motion,
    texturePromise,
    supportsSufficientWebGL
  }: Props) {
    const closeBtn = isFeaturePhone ? (
      <button
        aria-label={`close button`}
        ref={focusItem => (this.focusItem = focusItem)}
        class={fpCloseBtnStyle}
        onClick={onCloseClicked}
      >
        <span class={keyshortcutStyle}>*</span> close
      </button>
    ) : (
      <button
        aria-label={`close button`}
        ref={focusItem => (this.focusItem = focusItem)}
        class={closebtnStyle}
        onClick={onCloseClicked}
      >
        <Close />
      </button>
    );

    return (
      <div role="dialog" aria-label="settings dialog" class={settingsStyle}>
        <div
          class={isFeaturePhone ? fpCloseContainerStyle : closeContainerStyle}
        >
          {closeBtn}
        </div>
        <div class={settingsWindowStyle}>
          <div class={settingsContentStyle}>
            <h1>Settings</h1>
            <button
              class={motion ? btnOnStyle : btnOffStyle}
              onClick={onMotionPrefChange}
            >
              Animations {motion ? "on" : "off"}
            </button>
            <About
              motion={motion}
              texturePromise={texturePromise}
              supportsSufficientWebGL={supportsSufficientWebGL}
            />
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    window.scrollTo(0, 0);
    this.focusItem!.focus();
    window.addEventListener("keyup", this._onKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this._onKeyUp);
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (event.key === "Escape" || event.key === "*") {
      this.props.onCloseClicked();
    }
  }
}
