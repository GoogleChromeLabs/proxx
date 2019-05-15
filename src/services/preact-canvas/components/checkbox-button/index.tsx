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
import {
  checkbox as checkboxStyle,
  checkOff as checkOffStyle,
  checkOn as checkOnStyle,
  label as labelStyle
} from "./style.css";

export interface Props {
  disabled?: boolean;
  label: string;
  onChange: () => void;
  checked: boolean;
  name: string;
}

export interface State {}

export default class CheckboxButton extends Component<Props, State> {
  render({ disabled, label, onChange, checked, name }: Props) {
    return (
      <div>
        <input
          type="checkbox"
          role="switch checkbox"
          onChange={onChange}
          disabled={disabled}
          checked={checked}
          class={checkboxStyle}
          name={name}
          id={name}
        />
        <label
          for={name}
          class={[labelStyle, checked ? checkOnStyle : checkOffStyle].join(" ")}
        >
          {label}
        </label>
      </div>
    );
  }
}
