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
import { Remote } from "comlink/src/comlink.js";
import { Component, h } from "preact";
import { Cell } from "../../../../gamelogic/types";
import { bind } from "../../../../utils/bind.js";
import StateService from "../../../state.js";
import { Action } from "../cell/index.js";
import Row from "../row/index.js";
import "./style.css";

interface Props {
  stateService: Remote<StateService>;
  grid: Cell[][];
}

export default class Game extends Component<Props> {
  render({ grid }: Props) {
    return (
      <table>
        {grid.map((row, i) => (
          // tslint:disable-next-line:jsx-no-lambda
          <Row
            row={row}
            onClick={(col, action) => this.click(i, col, action)}
          />
        ))}
      </table>
    );
  }

  @bind
  private async click(row: number, col: number, action: Action) {
    switch (action) {
      case Action.Unflag: {
        await this.props.stateService.unflag(col, row);
        break;
      }
      case Action.Flag: {
        await this.props.stateService.flag(col, row);
        break;
      }
      case Action.Reveal: {
        await this.props.stateService.reveal(col, row);
        break;
      }
    }
  }
}
