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
import { StateChange } from "src/gamelogic/index.js";
import { Cell, GridChanges } from "../../../../gamelogic/types.js";
import {
  AnimationDesc,
  AnimationName,
  Context,
  flaggedAnimation,
  flashInAnimation,
  flashOutAnimation,
  highlightInAnimation,
  highlightOutAnimation,
  idleAnimation,
  initTextureCaches,
  numberAnimation
} from "../../../../rendering/animation.js";
import { bind } from "../../../../utils/bind.js";
import { GameChangeCallback } from "../../index.js";

import {
  board,
  button as buttonStyle,
  canvas as canvasStyle,
  container as containerStyle,
  gameCell,
  gameRow,
  gameTable
} from "./style.css";

const defaultCell: Cell = {
  flagged: false,
  hasMine: false,
  revealed: false,
  touchingFlags: 0,
  touchingMines: 0
};

export interface Props {
  onCellClick: (cell: [number, number, Cell], alt: boolean) => void;
  width: number;
  height: number;
  gameChangeSubscribe: (f: GameChangeCallback) => void;
  gameChangeUnsubscribe: (f: GameChangeCallback) => void;
}

function distanceFromCenter(x: number, y: number, size: number): number {
  // Normalize coordinate system and move origin to center
  const dx = x / size - 0.5;
  const dy = y / size - 0.5;
  // Distance of our point to origin
  return Math.sqrt(dx * dx + dy * dy) / Math.sqrt(2);
}

function removeAnimations(
  al: AnimationDesc[],
  names: AnimationName[]
): AnimationDesc[] {
  return al.filter(a => !names.includes(a.name));
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
  private changeBuffer: GridChanges = [];

  componentDidMount() {
    this.createTable(this.props.width, this.props.height);
    this.props.gameChangeSubscribe(this.doManualDomHandling);
    this.canvasInit();
    this.animationsInit();

    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
    this.props.gameChangeUnsubscribe(this.doManualDomHandling);
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
  private doManualDomHandling(stateChange: StateChange) {
    if (!stateChange.gridChanges) {
      return;
    }
    this.changeBuffer.push(...stateChange.gridChanges);
  }

  private createTable(width: number, height: number) {
    const tableContainer = document.querySelector("." + containerStyle);
    this.table = document.createElement("table");
    this.table.classList.add(gameTable);
    for (let row = 0; row < height; row++) {
      const tr = document.createElement("tr");
      tr.classList.add(gameRow);
      for (let col = 0; col < width; col++) {
        const y = row;
        const x = col;
        const td = document.createElement("td");
        td.classList.add(gameCell);
        const button = document.createElement("button");
        button.classList.add(buttonStyle);
        this.additionalButtonData.set(button, [x, y, defaultCell]);
        this.updateButton(button, defaultCell, x, y);
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
    this.table.addEventListener("click", this.onClick);
    this.table.addEventListener("mouseup", this.onMouseUp);
    this.table.addEventListener("contextmenu", event => event.preventDefault());
  }

  private updateAnimation(btn: HTMLButtonElement) {
    const ts = performance.now();
    const [x, y, cell] = this.additionalButtonData.get(btn)!;
    let animationList = this.animationLists.get(btn)!;

    if (!cell.revealed && !cell.flagged) {
      animationList[0].name = AnimationName.IDLE;
      animationList[0].fadeStart = ts;
      animationList = removeAnimations(animationList, [
        AnimationName.HIGHLIGHT_IN,
        AnimationName.HIGHLIGHT_OUT
      ]);
      animationList.push({
        name: AnimationName.HIGHLIGHT_OUT,
        start: ts,
        done: () => {
          animationList = removeAnimations(animationList, [
            AnimationName.HIGHLIGHT_IN,
            AnimationName.HIGHLIGHT_OUT
          ]);
          this.animationLists.set(btn, animationList);
        }
      });
    } else if (!cell.revealed && cell.flagged) {
      animationList[0].name = AnimationName.FLAGGED;
      animationList[0].fadeStart = ts;
      animationList.push({
        name: AnimationName.HIGHLIGHT_IN,
        start: ts
      });
    } else if (cell.revealed) {
      const isHighlighted = animationList.some(
        a => a.name === AnimationName.HIGHLIGHT_IN
      );
      if (cell.touchingFlags >= cell.touchingMines && !isHighlighted) {
        animationList.push({
          name: AnimationName.HIGHLIGHT_IN,
          start: ts
        });
      } else if (cell.touchingFlags < cell.touchingMines && isHighlighted) {
        animationList = removeAnimations(animationList, [
          AnimationName.HIGHLIGHT_IN,
          AnimationName.HIGHLIGHT_OUT
        ]);
        animationList.push({
          name: AnimationName.HIGHLIGHT_OUT,
          start: ts
        });
      }
      this.animationLists.set(btn, animationList);
      // This button already played the flash animation
      if (this.flashedCells.has(btn)) {
        return;
      }
      animationList = removeAnimations(animationList, [AnimationName.IDLE]);
      this.flashedCells.add(btn);
      animationList.push({
        name: AnimationName.FLASH_IN,
        start: ts,
        done: () => {
          animationList = removeAnimations(animationList, [
            AnimationName.FLASH_IN
          ]);
          this.animationLists.set(btn, animationList);
        }
      });
      if (cell.touchingMines > 0) {
        animationList.unshift({
          name: AnimationName.NUMBER,
          start: ts + 100
        });
      }
      animationList.push({
        name: AnimationName.FLASH_OUT,
        start: ts + 100
      });
    }

    this.animationLists.set(btn, animationList);
  }

  private drawCell(btn: HTMLButtonElement, ts: number) {
    const { width, height, left, top } = this.firstCellRect!;
    const [bx, by, cell] = this.additionalButtonData.get(btn)!;
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
      const context: Context = { ts, ctx, width, height, animation };
      ctx.save();
      ctx.translate(x, y);
      switch (animation.name) {
        case AnimationName.IDLE:
          idleAnimation(context);
          break;
        case AnimationName.FLAGGED:
          flaggedAnimation(context);
          break;
        case AnimationName.HIGHLIGHT_IN:
          highlightInAnimation(context);
          break;
        case AnimationName.HIGHLIGHT_OUT:
          highlightOutAnimation(context);
          break;
        case AnimationName.FLASH_IN:
          flashInAnimation(context);
          break;
        case AnimationName.FLASH_OUT:
          flashOutAnimation(context);
          break;
        case AnimationName.NUMBER:
          numberAnimation(cell.touchingMines, context);
          break;
      }
      ctx.restore();
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
    let lastTs = performance.now();
    requestAnimationFrame(function f(ts) {
      that.consumeChangeBuffer(ts - lastTs);
      lastTs = ts;

      that.renderCanvas(ts);
      if (that.renderLoopRunning) {
        requestAnimationFrame(f);
      }
    });
    this.renderLoopRunning = true;
  }

  private consumeChangeBuffer(delta: number) {
    const width = this.props.width;
    // Reveal ~5 fields per frame
    const numConsume = Math.floor((delta * 5) / 16);
    const slice = this.changeBuffer.splice(0, numConsume);
    for (const [x, y, cellProps] of slice) {
      const btn = this.buttons[y * width + x];
      this.updateButton(btn, cellProps, x, y);
      this.cellsToRedraw.add(btn);
      this.updateAnimation(btn);
    }
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
            startTime - 5000 + distanceFromCenter(x, y, this.props.width) * 5000
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
  private onMouseUp(event: MouseEvent) {
    if (event.button !== 2) {
      return;
    }

    event.preventDefault();
    this.onClick(event, true);
  }

  @bind
  private onClick(event: MouseEvent | TouchEvent, alt = false) {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    if (!button) {
      return;
    }
    event.preventDefault();

    const cell = this.additionalButtonData.get(button)!;
    this.props.onCellClick(cell, alt);
  }

  private updateButton(
    btn: HTMLButtonElement,
    cell: Cell,
    x: number,
    y: number
  ) {
    let cellState;

    if (!cell.revealed) {
      cell.flagged
        ? (cellState = `flag at ${x + 1}, ${y + 1}`)
        : (cellState = `hidden at ${x + 1}, ${y + 1}`);
    } else if (cell.hasMine) {
      cellState = `mine at ${x + 1}, ${y + 1}`; // should it say black hole?
    } else if (cell.touchingMines === 0) {
      cellState = `blank at ${x + 1}, ${y + 1}`;
    } else {
      cellState = `${cell.touchingMines} at ${x + 1}, ${y + 1}`;
    }

    btn.setAttribute("aria-label", cellState);
    this.additionalButtonData.get(btn)![2] = cell;
  }
}
