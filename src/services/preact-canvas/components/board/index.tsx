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
  AnimationDesc,
  AnimationName,
  flaggedAnimation,
  flashInAnimation,
  flashOutAnimation,
  idleAnimation,
  initTextureCaches,
  numberAnimation
} from "../../../../rendering/animation.js";

import {
  board,
  button as buttonStyle,
  canvas as canvasStyle,
  container as containerStyle,
  gameCell,
  gameRow,
  gameTable
} from "./style.css";

export interface Props {
  onCellClick: (cell: [number, number, Cell], forceAlt: boolean) => void;
  grid: Cell[][];
  gridChangeSubscribe: (f: GridChangeSubscriptionCallback) => void;
  gridChangeUnsubscribe: (f: GridChangeSubscriptionCallback) => void;
}

function distanceFromCenter(x: number, y: number, size: number): number {
  // Normalize coordinate system and move origin to center
  const dx = x / size - 0.5;
  const dy = y / size - 0.5;
  // Distance of our point to origin
  return Math.sqrt(dx * dx + dy * dy) / Math.sqrt(2);
}

export default class Board extends Component<Props> {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private table?: HTMLTableElement;
  private cellsToRedraw: Set<HTMLButtonElement> = new Set();
  private buttons: HTMLButtonElement[] = [];
  private canvasRect?: ClientRect | DOMRect;
  private flashedCells = new Set<HTMLButtonElement>();
  private firstCellRect?: ClientRect | DOMRect;
  private additionalButtonData = new WeakMap<
    HTMLButtonElement,
    [number, number, Cell]
  >();
  private animationLists = new WeakMap<HTMLButtonElement, AnimationDesc[]>();
  private renderLoopRunning = false;

  componentDidMount() {
    this.createTable(this.props.grid);
    this.props.gridChangeSubscribe(this.doManualDomHandling);
    this.canvasInit();
    this.animationsInit();

    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
    this.props.gridChangeUnsubscribe(this.doManualDomHandling);
    // Stop rAF
    this.renderLoopRunning = false;
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
  }

  @bind
  private doManualDomHandling(gridChanges: GridChanges) {
    // Apply patches
    const width = this.props.grid[0].length;
    for (const [x, y, cellProps] of gridChanges) {
      const btn = this.buttons[y * width + x];
      this.updateButton(btn, cellProps);
      this.cellsToRedraw.add(btn);
      this.updateAnimation(btn);
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
    this.canvas = document.createElement("canvas");
    this.canvas.classList.add(canvasStyle);
    this.base!.appendChild(this.canvas);
    tableContainer!.appendChild(this.table);
    this.table.addEventListener("click", this.click);
  }

  private updateAnimation(btn: HTMLButtonElement) {
    const [x, y, cell] = this.additionalButtonData.get(btn)!;
    const animationList = this.animationLists.get(btn)!;

    if (!cell.revealed && cell.tag !== Tag.Flag) {
      animationList[0].name = AnimationName.IDLE;
    } else if (!cell.revealed && cell.tag === Tag.Flag) {
      animationList[0].name = AnimationName.FLAGGED;
    } else if (cell.revealed && cell.touchingMines <= 0) {
      animationList.length = 0;
    } else if (cell.revealed && cell.touchingMines > 0) {
      // This button already played the flash animation
      if (this.flashedCells.has(btn)) {
        return;
      }
      this.flashedCells.add(btn);
      const ts = performance.now();
      animationList.push(
        {
          name: AnimationName.FLASH_IN,
          start: ts,
          done: () => {
            while (
              animationList[0].name === AnimationName.IDLE ||
              animationList[0].name === AnimationName.FLASH_IN
            ) {
              animationList.shift();
            }
          }
        },
        {
          name: AnimationName.NUMBER,
          start: ts + 100
        },
        {
          name: AnimationName.FLASH_OUT,
          start: ts + 100
        }
      );
    }
  }

  private drawCell(btn: HTMLButtonElement, ts: number) {
    const { width, height, left, top } = this.firstCellRect!;
    const [bx, by] = this.additionalButtonData.get(btn)!;
    const cell = this.props.grid[by][bx];
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
    const animationList = this.animationLists.get(btn);
    if (!animationList) {
      return;
    }
    for (const animation of animationList) {
      const context = { ts, ctx, x, y, width, height, animation };
      switch (animation.name) {
        case AnimationName.IDLE:
          idleAnimation(context);
          break;
        case AnimationName.FLAGGED:
          flaggedAnimation(context);
          break;
        case AnimationName.FLASH_IN:
          flashInAnimation(context);
          break;
        case AnimationName.FLASH_OUT:
          flashOutAnimation(context);
          break;
        case AnimationName.NUMBER:
          numberAnimation(
            cell.touchingMines,
            cell.touchingFlags >= cell.touchingMines,
            context
          );
          break;
      }
    }
  }

  private canvasInit() {
    this.canvasRect = this.canvas!.getBoundingClientRect();
    this.queryFirstCellRect();
    this.canvas!.width = this.canvasRect.width * devicePixelRatio;
    this.canvas!.height = this.canvasRect.height * devicePixelRatio;
    this.ctx = this.canvas!.getContext("2d")!;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);

    if (this.renderLoopRunning) {
      return;
    }

    const that = this;
    requestAnimationFrame(function f(ts) {
      that.renderCanvas(ts);
      if (that.renderLoopRunning) {
        requestAnimationFrame(f);
      }
    });
    this.renderLoopRunning = true;
  }

  private animationsInit() {
    // Assuming square field size
    initTextureCaches(this.firstCellRect!.width);
    const startTime = performance.now();
    for (const button of this.buttons) {
      const [x, y] = this.additionalButtonData.get(button)!;
      this.animationLists.set(button, [
        {
          name: AnimationName.IDLE,
          start:
            startTime -
            5000 +
            distanceFromCenter(x, y, this.props.grid[0].length) * 5000
        }
      ]);
    }
  }

  private renderCanvas(ts: number) {
    this.ctx!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    this.queryFirstCellRect();

    for (const cell of this.buttons) {
      this.drawCell(cell, ts);
    }
    this.cellsToRedraw.clear();
  }

  private queryFirstCellRect() {
    this.firstCellRect = this.buttons[0].getBoundingClientRect();
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
