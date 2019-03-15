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
import { Cell, Tag } from "../../../../gamelogic/types.js";
import { bind } from "../../../../utils/bind.js";
import { cellInner, tableCell } from "./style.css";

interface State {}

interface Props {
  cell: Cell;
  onClick(action: Action): void;
}

interface ItemProps {
  cell: Cell;
  onUnrevealedClick(event: MouseEvent): void;
  onTouchingClick(event: MouseEvent): void;
}

export const enum Action {
  Reveal,
  Flag,
  Unflag,
  RevealSurrounding
}

// tslint:disable-next-line:variable-name
const Item = ({ cell, onUnrevealedClick, onTouchingClick }: ItemProps) => {
  if (!cell.revealed) {
    return (
      <button onClick={onUnrevealedClick} class="cell unrevealed">
        {cell.tag === Tag.Flag ? "🚩" : " "}
      </button>
    );
  }
  if (cell.hasMine) {
    return <button class="cell mine">💣</button>;
  }
  if (cell.touching > 0) {
    return <button onClick={onTouchingClick}>{cell.touching}</button>;
  }

  return <button class="cell empty" />;
};

export default class GridCell extends Component<Props, State> {
  shouldComponentUpdate(nextProps: Props) {
    return this.props.cell !== nextProps.cell;
  }

  @bind
  onUnrevealedClick(event: MouseEvent) {
    if (event.shiftKey) {
      this.props.onClick(
        this.props.cell.tag === Tag.Flag ? Action.Unflag : Action.Flag
      );
      return;
    }

    // Don't allow clicking on flagged squares
    if (this.props.cell.tag === Tag.Flag) {
      return;
    }

    this.props.onClick(Action.Reveal);
  }

  @bind
  onTouchingClick(event: MouseEvent) {
    if (!event.shiftKey) {
      return;
    }
    this.props.onClick(Action.RevealSurrounding);
  }

  render({ cell }: Props) {
    const cellState = !cell.revealed
      ? cell.tag === Tag.Flag
        ? "flagged"
        : "unrevealed"
      : cell.hasMine
      ? "mine"
      : cell.touching;

    return (
      <td class={tableCell}>
        <div class={cellInner} data-state={cellState}>
          <Item
            cell={cell}
            onUnrevealedClick={this.onUnrevealedClick}
            onTouchingClick={this.onTouchingClick}
          />
        </div>
      </td>
    );
  }
}
