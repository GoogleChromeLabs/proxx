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
import { bind } from "src/utils/bind";
import { Back } from "../icons/additional";
import { Fullscreen, Settings } from "../icons/initial";
import {
  bottomBar,
  checkbox,
  fullscreen,
  hidden,
  icons,
  leftToggleLabel,
  rightToggleLabel,
  toggle,
  toggleContainer
} from "./style.css";

export interface Props {
  onFullscreenClick: () => void;
  onSettingsClick: () => void;
  onBackClick: () => void;
  onDangerModeChange: (newSetting: boolean) => void;
  buttonType: "back" | "settings";
  display: boolean;
  dangerMode: boolean;
  showDangerModeToggle: boolean;
}

export interface State {
  flagModeAnnouncement: string;
}

export default class BottomBar extends Component<Props, State> {
  state: State = {
    flagModeAnnouncement: ""
  };

  private _flagCheckbox?: HTMLInputElement;

  render(
    {
      onFullscreenClick,
      onSettingsClick,
      onBackClick,
      buttonType,
      display,
      showDangerModeToggle,
      dangerMode
    }: Props,
    { flagModeAnnouncement }: State
  ) {
    return (
      <div class={[bottomBar, display ? "" : hidden].join("")} role="menubar">
        {buttonType === "back" ? (
          <button
            class={icons}
            onClick={onBackClick}
            aria-label="Back to main menu"
          >
            <Back />
          </button>
        ) : (
          <button
            class={icons}
            onClick={onSettingsClick}
            aria-label="Open settings menu"
          >
            <Settings />
          </button>
        )}
        {showDangerModeToggle && (
          <div
            class={toggleContainer}
            onTouchStart={this._onDangerModeTouchStart}
          >
            <label>
              <span aria-hidden="true" class={leftToggleLabel}>
                Clear
              </span>
              <input
                class={checkbox}
                type="checkbox"
                role="switch checkbox"
                onChange={this._onDangerModeSwitchToggle}
                checked={!dangerMode}
                aria-label="flag mode"
                ref={el => (this._flagCheckbox = el)}
              />
              <svg viewBox="0 0 32 16" class={toggle}>
                <defs>
                  <mask id="flag-toggle-mask">
                    <rect fill="#fff" x="0" y="0" width="32" height="16" />
                    <circle cx={dangerMode ? 8 : 24} cy="8" fill="#000" r="4" />
                  </mask>
                </defs>
                <rect
                  fill="#fff"
                  x="0"
                  y="0"
                  width="32"
                  height="16"
                  rx="8"
                  ry="8"
                  mask="url(#flag-toggle-mask)"
                />
              </svg>
              <span aria-hidden="true" class={rightToggleLabel}>
                Flag
              </span>
            </label>
            <span
              role="status"
              aria-live="assertive"
              aria-label={flagModeAnnouncement}
            />
          </div>
        )}
        <button
          class={fullscreen}
          onClick={onFullscreenClick}
          aria-label="fullscreen mode"
        >
          <Fullscreen />
        </button>
      </div>
    );
  }

  componentDidMount() {
    window.addEventListener("keyup", this._onKeyUp);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this._onKeyUp);
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (
      this.props.showDangerModeToggle &&
      (event.key === "f" || event.key === "#")
    ) {
      this._dangerModeChange(!this.props.dangerMode, true);
    }
  }

  private _dangerModeChange(newVal: boolean, announce: boolean) {
    this.props.onDangerModeChange(newVal);

    // We need to clear the announcement when the input is interacted with, so if we need to
    // announce a change later, we aren't setting it to the same value it already has (which would
    // mean no announcement).
    let flagModeAnnouncement = "";

    if (announce) {
      flagModeAnnouncement = newVal ? "flag mode off" : "flag mode on";
    }

    this.setState({ flagModeAnnouncement });
  }

  @bind
  private _onDangerModeTouchStart(event: TouchEvent) {
    event.preventDefault();
    this._dangerModeChange(this._flagCheckbox!.checked, true);
  }

  @bind
  private _onDangerModeSwitchToggle() {
    this._dangerModeChange(!this._flagCheckbox!.checked, false);
  }
}
