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
import { focusRing, rippleSpeed } from "src/rendering/constants.js";
import { isFeaturePhone } from "src/utils/static-screensize";
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
  minedAnimation,
  numberAnimation
} from "../../../../rendering/animation";
import { bind } from "../../../../utils/bind";
import { staticDevicePixelRatio } from "../../../../utils/static-dpr";
import { GameChangeCallback } from "../../index";
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
  onDangerModeChange: (v: boolean) => void;
  width: number;
  height: number;
  dangerMode: boolean;
  gameChangeSubscribe: (f: GameChangeCallback) => void;
  gameChangeUnsubscribe: (f: GameChangeCallback) => void;
}

interface State {
  keyNavigation: boolean;
}

function distanceFromCenter(
  x: number,
  y: number,
  width: number,
  height: number
): number {
  const centerX = width / 2;
  const centerY = height / 2;
  // Measure the distance from the center point of the game board
  // to the center of the field (hence the +0.5)
  const dx = x + 0.5 - centerX;
  const dy = y + 0.5 - centerY;
  // Distance of our point to origin
  return (
    Math.sqrt(dx * dx + dy * dy) /
    Math.sqrt(centerX * centerX + centerY * centerY)
  );
}

function removeAnimations(
  al: AnimationDesc[],
  names: AnimationName[]
): AnimationDesc[] {
  return al.filter(a => !names.includes(a.name));
}

export default class Board extends Component<Props, State> {
  state: State = {
    keyNavigation: false
  };
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
    window.scrollTo(0, 0);
    document.documentElement.classList.add("in-game");
    this.createTable(this.props.width, this.props.height);
    this.props.gameChangeSubscribe(this.doManualDomHandling);
    this.canvasInit();
    this.animationsInit();

    window.addEventListener("resize", this.onWindowResize);
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
  }

  componentWillUnmount() {
    document.documentElement.classList.remove("in-game");
    this.props.gameChangeUnsubscribe(this.doManualDomHandling);

    window.removeEventListener("resize", this.onWindowResize);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("keyup", this._onKeyUp);

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
  private _onKeyDown(event: KeyboardEvent) {
    if (event.key === "Shift" || event.key === "#") {
      this.props.onDangerModeChange(!this.props.dangerMode);
    }
  }

  @bind
  private _onKeyUp(event: KeyboardEvent) {
    if (event.key === "Shift") {
      this.props.onDangerModeChange(!this.props.dangerMode);
    }
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
    this.table.setAttribute("role", "grid");
    this.table.setAttribute("aria-label", "game grid");
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

        // set only 1st cell tab focusable
        if (row === 0 && col === 0) {
          button.setAttribute("tabindex", "0");
        } else {
          button.setAttribute("tabindex", "-1");
        }
        button.addEventListener("mouseenter", event => {
          this.moveFocusOnHover(event);
        });
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
    this.table.addEventListener("keydown", this.onKeyDownOnTable);
    this.table.addEventListener("keyup", this.onKeyUpOnTable);
    this.table.addEventListener("mouseup", this.onMouseUp);
    this.table.addEventListener("mousedown", this.onMouseDown);
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
      if (cell.hasMine) {
        animationList.push({
          name: AnimationName.MINED,
          start: ts + 100
        });
      } else if (cell.touchingMines > 0) {
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

    const isFocused = btn === document.activeElement;
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
        case AnimationName.MINED:
          minedAnimation(context);
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

      if (isFocused && (isFeaturePhone || this.state.keyNavigation)) {
        // TODO: Design
        // currently just a green focus ring
        ctx.strokeStyle = focusRing;
        ctx.strokeRect(0, 0, width, height);
      }

      ctx.restore();
    }
  }

  private canvasInit() {
    this.canvasRect = this.canvas!.getBoundingClientRect();
    this.queryFirstCellRect();
    this.canvas!.width = this.canvasRect.width * staticDevicePixelRatio;
    this.canvas!.height = this.canvasRect.height * staticDevicePixelRatio;
    this.ctx = this.canvas!.getContext("2d")!;
    this.ctx.scale(staticDevicePixelRatio, staticDevicePixelRatio);

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
    const startTime = performance.now();
    const rippleFactor =
      rippleSpeed * Math.max(this.props.width, this.props.height);
    for (const button of this.buttons) {
      const [x, y] = this.additionalButtonData.get(button)!;
      this.animationLists.set(button, [
        {
          name: AnimationName.IDLE,
          start:
            startTime -
            rippleFactor +
            distanceFromCenter(x, y, this.props.width, this.props.height) *
              rippleFactor
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
    this.firstCellRect = this.buttons[0].closest("td")!.getBoundingClientRect();
  }

  // Mouse move will change focused button. This is needed for simulateClick.
  @bind
  private moveFocusOnHover(event: MouseEvent) {
    this.setState({ keyNavigation: false });
    const target = event.target as HTMLElement;
    target.focus();
  }

  @bind
  private moveFocusByKey(event: KeyboardEvent, h: number, v: number) {
    this.setState({ keyNavigation: true });
    const currentBtn = document.activeElement as HTMLButtonElement;
    const btnInfo = this.additionalButtonData.get(currentBtn);
    if (!btnInfo) {
      return;
    }
    const x = btnInfo[0] as number;
    const y = btnInfo[1] as number;
    const width = this.props.width;
    const height = this.props.height;

    // move x, y position by passed steps h:horizontal, v:vertical
    const newX = x + h;
    const newY = y + v;

    // Check if [newX, newY] position is out of the game field.
    if (newX < 0 || newX >= width || (newY < 0 || newY >= height)) {
      return;
    }

    event.stopPropagation();
    const nextIndex = newX + newY * width;
    const nextBtn = this.buttons[nextIndex];

    // Change `tabindex="0"` to the next button so that when user tab out of the game
    // (to select setting menu, for example) they comeback to where they left off.
    currentBtn.setAttribute("tabindex", "-1");
    nextBtn.setAttribute("tabindex", "0");

    nextBtn.focus();
  }

  @bind
  private onKeyUpOnTable(event: KeyboardEvent) {
    if (event.key === "Tab") {
      this.setState({ keyNavigation: true });
      this.moveFocusByKey(event, 0, 0);
    }
  }

  @bind
  private onKeyDownOnTable(event: KeyboardEvent) {
    // Since click action is tied to mouseup event,
    // listen to Enter in case of key navigation click.
    // Key 8 support is for T9 navigation
    if (event.key === "Enter" || event.key === "8") {
      this.simulateClick(event);
    } else if (event.key === "ArrowRight" || event.key === "9") {
      this.moveFocusByKey(event, 1, 0);
    } else if (event.key === "ArrowLeft" || event.key === "7") {
      this.moveFocusByKey(event, -1, 0);
    } else if (event.key === "ArrowUp" || event.key === "5") {
      this.moveFocusByKey(event, 0, -1);
    } else if (event.key === "ArrowDown" || event.key === "0") {
      this.moveFocusByKey(event, 0, 1);
    }
  }

  // Stopping event is necessary for preventing click event on KaiOS
  // which moves focus to the mouse and end up clicking two cells,
  // one under the mouse and one that is currently focused
  @bind
  private onMouseUp(event: MouseEvent) {
    event.preventDefault();

    if (event.button !== 2) {
      // normal click
      this.simulateClick(event);
      return;
    }
    // right (two finger) click
    this.simulateClick(event, true);
  }

  // Same as mouseup, necessary for preventing click event on KaiOS
  @bind
  private onMouseDown(event: MouseEvent) {
    event.preventDefault();
  }

  @bind
  private simulateClick(
    event: MouseEvent | TouchEvent | KeyboardEvent,
    alt = false
  ) {
    // find which button = cell has current focus
    const button = document.activeElement as HTMLButtonElement;
    if (!button) {
      return;
    }
    event.preventDefault();

    const buttonData = this.additionalButtonData.get(button)!;
    this.props.onCellClick(buttonData, alt);
  }

  private updateButton(
    btn: HTMLButtonElement,
    cell: Cell,
    x: number,
    y: number
  ) {
    let cellState;
    const position = `${x + 1}, ${y + 1}`;
    if (!cell.revealed) {
      cellState = cell.flagged ? `flag` : `hidden`;
    } else if (cell.hasMine) {
      cellState = `mine`; // should it say black hole?
    } else if (cell.touchingMines === 0) {
      cellState = `blank`;
    } else {
      cellState = `${cell.touchingMines}`;
    }

    btn.setAttribute("aria-label", cellState);
    this.additionalButtonData.get(btn)![2] = cell;
  }
}
