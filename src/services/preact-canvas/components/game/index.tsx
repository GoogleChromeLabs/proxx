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
import { Remote } from "comlink/src/comlink";
import { Component, h } from "preact";
import StateService from "src/services/state";
import { bind } from "src/utils/bind";
import { GridChangeSubscriptionCallback } from "../..";
import { Cell } from "../../../../gamelogic/types";
import Board from "../board";
import { checkbox, toggle, toggleLabel } from "./style.css";

export interface Props {
  stateService: Remote<StateService>;
  grid: Cell[][];
  gridChangeSubscribe: (f: GridChangeSubscriptionCallback) => void;
}

interface State {
  altActionChecked: boolean;
}

export default class Game extends Component<Props, State> {
  state: State = {
    altActionChecked: false
  };

  render({ grid, gridChangeSubscribe }: Props, { altActionChecked }: State) {
    return (
      <div>
        <Board
          grid={grid}
          gridChangeSubscribe={gridChangeSubscribe}
          onCellClick={this.onCellClick}
        />
        <label class={toggleLabel}>
          Reveal
          <input
            class={checkbox}
            type="checkbox"
            onChange={this.onAltChange}
            checked={altActionChecked}
          />
          <span class={toggle} /> Flag
        </label>
      </div>
    );
  }

  @bind
  private onAltChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.setState({
      altActionChecked: target.checked
    });
  }

  @bind
  private onCellClick(cell: [number, number, string], forceAlt: boolean) {
    const [x, y, state] = cell;
    const { altActionChecked } = this.state;

    const altAction = forceAlt || altActionChecked;

    if (state === "unrevealed" && !altAction) {
      this.props.stateService.reveal(x, y);
    } else if (state === "unrevealed" && altAction) {
      this.props.stateService.flag(x, y);
    } else if (state === "flagged" && altAction) {
      this.props.stateService.unflag(x, y);
    } else if (Number(state) !== Number.NaN && altAction) {
      this.props.stateService.revealSurrounding(x, y);
    }
  }
}
