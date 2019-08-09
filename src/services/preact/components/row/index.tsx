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
import { Cell } from "../../../../gamelogic/types.js";
import GridCell, { Action } from "../cell/index.js";

interface State {}

interface Props {
  row: Cell[];
  onClick(x: number, action: Action): void;
}

export default class Row extends Component<Props, State> {
  shouldComponentUpdate(nextProps: Props) {
    return true; //this.props.row !== nextProps.row;
  }

  render({ row, onClick }: Props) {
    return (
      <tr>
        {row.map((cell, i) => (
          <GridCell key={i} onClick={onClick.bind(this, i)} cell={cell} />
        ))}
      </tr>
    );
  }
}
