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
  board,
  button as buttonStyle,
  canvas as canvasStyle,
  container as containerStyle,
  gameCell,
  gameRow,
  gameTable
} from "./style.css";

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export interface Props {
  onCellClick: (cell: [number, number, Cell], forceAlt: boolean) => void;
  grid: Cell[][];
  gridChangeSubscribe: (f: GridChangeSubscriptionCallback) => void;
}

export default class Board extends Component<Props> {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
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
    this.canvasInit();

    window.addEventListener("scroll", this.onWindowScroll);
    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.onWindowScroll);
    window.removeEventListener("resize", this.onWindowResize);
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
  private onWindowResize() {
    this.canvasInit();
    this.renderCanvas({ forceRedrawAll: true });
  }

  @bind
  private onWindowScroll() {
    this.renderCanvas({ forceRedrawAll: true });
  }

  @bind
  private doManualDomHandling(gridChanges: GridChanges) {
    // Apply patches
    const width = this.props.grid[0].length;
    for (const [x, y, cellProps] of gridChanges) {
      const btn = this.buttons[y * width + x];
      this.updateButton(btn, cellProps);
      this.cellsToRedraw.add(btn);
    }
    this.renderCanvas();
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
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add(canvasStyle);
    this.base!.appendChild(this.canvas);
    tableContainer!.appendChild(this.table);
    this.table.addEventListener("click", this.click);
  }

  private drawCell(button: HTMLButtonElement) {
    const { width, height, left, top } = this.firstCellRect!;
    const [bx, by, cell] = this.additionalButtonData.get(button)!;
    const x = bx * width + left;
    const y = by * height + top;

    // If cell is out of bounds, skip it
    if (
      x + width < 0 ||
      y + height < 0 ||
      x > this.canvasRect!.width ||
      y > this.canvasRect!.height
    ) {
      return;
    }

    const ctx = this.ctx!;

    ctx.clearRect(x, y, width, height);

    if (!cell.revealed || cell.tag === Tag.Flag) {
      ctx.fillStyle = "#ccc";
      ctx.strokeStyle = "#fff";

      roundedRect(ctx, x + 5, y + 5, width - 10, height - 10, 5);
      ctx.stroke();

      if (cell.tag === Tag.Flag) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, height / 8, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    if (cell.hasMine) {
      ctx.fillStyle = "#f00";
      ctx.fillRect(x, y, width, height);
      return;
    }

    // state is the number touching
    if (cell.touchingMines > 0) {
      ctx.fillStyle =
        cell.touchingFlags >= cell.touchingMines ? "#5f5" : "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${height / 2.5}px sans-serif`;
      ctx.fillText(cell.touchingMines + "", x + width / 2, y + height / 2);
    }
  }

  private canvasInit() {
    this.canvasRect = this.canvas!.getBoundingClientRect();
    this.canvas!.width = this.canvasRect.width * devicePixelRatio;
    this.canvas!.height = this.canvasRect.height * devicePixelRatio;
    this.ctx = this.canvas!.getContext("2d")!;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.renderCanvas({ forceRedrawAll: true });
  }

  private renderCanvas({ forceRedrawAll = false } = {}) {
    if (forceRedrawAll) {
      this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
      this.firstCellRect = this.buttons[0].getBoundingClientRect();
    }

    const toRedraw = forceRedrawAll ? this.buttons : this.cellsToRedraw;

    for (const cell of toRedraw) {
      this.drawCell(cell);
    }
    this.cellsToRedraw.clear();
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

  private updateButton(btn: HTMLButtonElement, cell: Cell) {
    const cellState = !cell.revealed
      ? cell.tag === Tag.Flag
        ? "flagged"
        : "unrevealed"
      : cell.hasMine
      ? "mine"
      : `${cell.touchingMines}`;

    btn.setAttribute("aria-label", cellState);
    this.additionalButtonData.get(btn)![2] = cell;
  }
}
