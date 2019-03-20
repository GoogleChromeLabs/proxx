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
import { Tag } from "../../../../gamelogic/types.js";
import { bind } from "../../../../utils/bind.js";
import StateService, { GridChanges } from "../../../state.js";
import { GridChangeSubscriptionCallback } from "../../index.js";

function flatten<T>(v: T[][]): T[] {
  return Array.prototype.concat.apply([], v);
}

import {
  button as buttonStyle,
  canvas as canvasStyle,
  container as containerStyle,
  gameCell,
  gameRow,
  gameTable
} from "./style.css";

interface Props {
  stateService: Remote<StateService>;
  grid: Cell[][];
  gridChangeSubscribe: (f: GridChangeSubscriptionCallback) => void;
}

export default class Game extends Component<Props> {
  static updateButton(btn: HTMLButtonElement, cell: Cell) {
    btn.setAttribute(
      "data-state",
      !cell.revealed
        ? cell.tag === Tag.Flag
          ? "flagged"
          : "unrevealed"
        : cell.hasMine
        ? "mine"
        : `${cell.touching}`
    );

    // FIXME
    btn.textContent = btn.dataset.state!;
  }
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private table?: HTMLTableElement;
  private cellsToRedraw: Set<HTMLButtonElement> = new Set();
  private canvasRenderPending = false;
  private buttons: HTMLButtonElement[] = [];

  componentDidMount() {
    this.props.gridChangeSubscribe(this.doManualDomHandling);
    this.createTable(this.props.grid);
    this.canvasInit();
    // Force initial render
    const gridChanges = this.props.grid.map((row, y) =>
      row.map((cell, x) => [x, y, cell] as [number, number, Cell])
    );
    this.doManualDomHandling(flatten(gridChanges));
  }

  shouldComponentUpdate(nextProps: Props) {
    return false;
  }

  render() {
    return <div class={containerStyle} />;
  }

  @bind
  private doManualDomHandling(gridChanges: GridChanges) {
    // Table has not been created
    if (this.buttons.length === 0) {
      this.createTable(this.props.grid);
    }

    // Apply patches
    const width = this.props.grid[0].length;
    for (const [x, y, cellProps] of gridChanges) {
      const btn = this.buttons[y * width + x];
      Game.updateButton(btn, cellProps);
    }
  }

  private createTable(grid: Cell[][]) {
    while (this.base!.firstChild) {
      this.base!.firstChild.remove();
    }
    this.table = document.createElement("table");
    this.table.classList.add(gameTable);
    for (let row = 0; row < grid.length; row++) {
      const tr = document.createElement("tr");
      tr.classList.add(gameRow);
      for (let col = 0; col < grid[0].length; col++) {
        const td = document.createElement("td");
        td.classList.add(gameCell);
        const button = document.createElement("button");
        button.classList.add(buttonStyle);
        button.dataset.x = `${col}`;
        button.dataset.y = `${row}`;
        button.onclick = this.click;
        Game.updateButton(button, grid[col][row]);
        this.buttons.push(button);
        td.appendChild(button);
        tr.appendChild(td);
      }
      this.table.appendChild(tr);
    }
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add(canvasStyle);
    this.base!.appendChild(this.canvas);
    this.base!.appendChild(this.table);

    this.observe();
  }

  private async observe() {
    let myResizeObserver;
    if ("ResizeObserver" in self) {
      myResizeObserver = (self as any).ResizeObserver;
    } else {
      myResizeObserver = await import("resize-observer-polyfill").then(
        m => m.default
      );
    }
    // @ts-ignore
    new myResizeObserver(() => this.canvasInit()).observe(this.canvas!);
    new MutationObserver(entries => {
      for (const entry of entries) {
        const element = entry.target as HTMLElement;
        if (element.classList.contains(buttonStyle)) {
          this.cellsToRedraw.add(element as HTMLButtonElement);
        }
      }
      this.updateCanvas();
    }).observe(this.table!, { attributes: true, subtree: true });
  }

  private drawCell(cell: HTMLButtonElement, tableRect: ClientRect | DOMRect) {
    const cellRect = cell.getBoundingClientRect();
    const x = cellRect.left - tableRect.left;
    const y = cellRect.top - tableRect.top;
    const { width, height } = cellRect;
    const ctx = this.ctx!;
    const state = cell.dataset.state!;

    if (state === "unrevealed" || state === "flagged") {
      ctx.fillStyle = "#ccc";
      ctx.strokeStyle = "#333";
      ctx.fillRect(x, y, width, height);
      ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

      if (state === "flagged") {
        ctx.fillStyle = "#f00";
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, height / 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      return;
    }

    if (state === "mine") {
      ctx.fillStyle = "#f00";
      ctx.fillRect(x, y, width, height);
      return;
    }

    // state is the number touching
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#eee";
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.fillStyle = "#000";
    if (Number(state) > 0) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `${height / 2}px sans-serif`;
      ctx.fillText(state, x + width / 2, y + height / 2);
    }
  }

  private canvasInit() {
    const { width, height } = this.canvas!.getBoundingClientRect();
    this.canvas!.width = width * devicePixelRatio;
    this.canvas!.height = height * devicePixelRatio;
    this.ctx = this.canvas!.getContext("2d")!;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    for (const cell of this.buttons) {
      this.cellsToRedraw.add(cell);
    }

    this.updateCanvas();
  }

  private updateCanvas() {
    if (this.canvasRenderPending) {
      return;
    }
    this.canvasRenderPending = true;
    requestAnimationFrame(() => {
      const tableRect = this.table!.getBoundingClientRect();
      for (const cell of this.cellsToRedraw) {
        this.drawCell(cell, tableRect);
      }
      this.cellsToRedraw.clear();
      this.canvasRenderPending = false;
    });
  }

  @bind
  private async click({ target, shiftKey }: MouseEvent) {
    const btn = target! as HTMLButtonElement;
    const x = Number(btn.dataset.x);
    const y = Number(btn.dataset.y);
    const state = btn.dataset.state!.toLowerCase();

    if (state === "unrevealed" && !shiftKey) {
      await this.props.stateService.reveal(x, y);
    } else if (state === "unrevealed" && shiftKey) {
      await this.props.stateService.flag(x, y);
    } else if (state === "flagged" && shiftKey) {
      await this.props.stateService.unflag(x, y);
    } else if (Number(state) !== Number.NaN && shiftKey) {
      await this.props.stateService.revealSurrounding(x, y);
    }
  }
}
