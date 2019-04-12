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
import { Cell, GridChanges, Tag } from "../../../../gamelogic/types.js";
import { bind } from "../../../../utils/bind.js";
import { GridChangeSubscriptionCallback } from "../../index.js";

import {
  blank,
  board,
  button as buttonStyle,
  canvas as canvasStyle,
  container as containerStyle,
  gameCell,
  gameRow,
  gameTable,
  showVal
} from "./style.css";

export interface Props {
  onCellClick: (cell: [number, number, Cell], forceAlt: boolean) => void;
  grid: Cell[][];
  gridChangeSubscribe: (f: GridChangeSubscriptionCallback) => void;
  gridChangeUnsubscribe: (f: GridChangeSubscriptionCallback) => void;
}

export default class Board extends Component<Props> {
  private table?: HTMLTableElement;
  private cellsToRedraw: Set<HTMLButtonElement> = new Set();
  private buttons: HTMLButtonElement[] = [];
  private canvasRect?: ClientRect | DOMRect;
  private firstCellRect?: ClientRect | DOMRect;
  private additionalButtonData = new WeakMap<
    HTMLButtonElement,
    [number, number, Cell]
  >();

  componentDidMount() {
    this.createTable(this.props.grid);
    this.props.gridChangeSubscribe(this.doManualDomHandling);
  }

  componentWillUnmount() {
    this.props.gridChangeUnsubscribe(this.doManualDomHandling);
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div class={board}>
        <div class={containerStyle} />
      </div>
    );
  }

  @bind
  private doManualDomHandling(gridChanges: GridChanges) {
    // Apply patches
    const width = this.props.grid[0].length;
    for (const [i, [x, y, cellProps]] of gridChanges.entries()) {
      const btn = this.buttons[y * width + x];
      this.updateButton(btn, cellProps, i);
      this.cellsToRedraw.add(btn);
    }
  }

  private createTable(grid: Cell[][]) {
    const tableContainer = document.querySelector("." + containerStyle);
    this.table = document.createElement("table");
    this.table.classList.add(gameTable);
    for (let row = 0; row < grid.length; row++) {
      const tr = document.createElement("tr");
      tr.classList.add(gameRow);
      for (let col = 0; col < grid[0].length; col++) {
        const y = row;
        const x = col;
        const td = document.createElement("td");
        td.classList.add(gameCell);
        const button = document.createElement("button");
        button.classList.add(buttonStyle);
        this.additionalButtonData.set(button, [x, y, grid[y][x]]);
        this.updateButton(button, grid[y][x]);
        this.buttons.push(button);
        td.appendChild(button);
        tr.appendChild(td);
      }
      this.table.appendChild(tr);
    }
    tableContainer!.appendChild(this.table);
    this.table.addEventListener("click", this.click);
  }

  @bind
  private click(event: MouseEvent | TouchEvent) {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    if (!button) {
      return;
    }
    event.preventDefault();

    const cell = this.additionalButtonData.get(button)!;
    this.props.onCellClick(cell, event.shiftKey);
  }

  private updateButton(btn: HTMLButtonElement, cell: Cell, distance = -1) {
    const cellState = !cell.revealed
      ? cell.tag === Tag.Flag
        ? "F"
        : "unrevealed"
      : cell.hasMine
      ? "M"
      : `${cell.touchingMines}`;

    function set() {
      btn.setAttribute("aria-label", cellState);
      if (cell.revealed) {
        if (cellState === "0") {
          btn.classList.add(blank);
        } else {
          btn.classList.add(showVal);
        }
      }
    }

    if (distance === -1) {
      set();
    } else {
      setTimeout(set, distance);
    }

    this.additionalButtonData.get(btn)![2] = cell;
  }
}
