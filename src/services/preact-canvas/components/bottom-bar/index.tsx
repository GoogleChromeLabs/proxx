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
import { GameType } from "src/services/state";
import { Back } from "../icons/additional";
import { Fullscreen, Settings } from "../icons/initial";
import { bottomBar, icons } from "./style.css";

export interface Props {
  onFullscreenClick: () => void;
  onSettingsClick: () => void;
  onBackClick: () => void;
  game?: GameType;
}

export interface State {}

export default class BottomBar extends Component<Props, State> {
  render({ onFullscreenClick, onSettingsClick, onBackClick, game }: Props) {
    return (
      <div class={bottomBar}>
        {game ? (
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
        <button class={icons} onClick={onFullscreenClick}>
          <Fullscreen />
        </button>
      </div>
    );
  }
}
