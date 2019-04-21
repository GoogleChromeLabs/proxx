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
  AnimationName
} from "../../../../rendering/animation.js";
import { bind } from "../../../../utils/bind.js";
import { GameChangeCallback } from "../../index.js";

import { removeAnimations } from "src/rendering/animation-helpers.js";
import { rippleSpeed } from "src/rendering/constants.js";
import { Renderer } from "src/rendering/renderer.js";
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
  renderer: Renderer;
  gameChangeSubscribe: (f: GameChangeCallback) => void;
  gameChangeUnsubscribe: (f: GameChangeCallback) => void;
}

export default class Board extends Component<Props> {
  private _canvas?: HTMLCanvasElement;
  private _table?: HTMLTableElement;
  private _buttons: HTMLButtonElement[] = [];
  private _flashedCells = new Set<HTMLButtonElement>();
  private _firstCellRect?: ClientRect | DOMRect;
  private _additionalButtonData = new WeakMap<
    HTMLButtonElement,
    [number, number, Cell]
  >();
  private _animationLists = new WeakMap<HTMLButtonElement, AnimationDesc[]>();
  private _updateLoopRunning = false;
  private _changeBuffer: GridChanges = [];
  private _lastTs: number = performance.now();

  componentDidMount() {
    this._createTable(this.props.width, this.props.height);
    this.props.gameChangeSubscribe(this._doManualDomHandling);
    this._animationsInit();
    this._rendererInit();
    this.queryFirstCellRect();
    this.props.renderer.updateFirstRect(this._firstCellRect!);
    this._updateLoopRunning = true;
    requestAnimationFrame(this._animationLoop);

    window.addEventListener("resize", this._onWindowResize);
    window.addEventListener("scroll", this._onWindowScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this._onWindowResize);
    this.props.gameChangeUnsubscribe(this._doManualDomHandling);
    // Stop rAF
    this._updateLoopRunning = false;
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
  private _onWindowResize() {
    this.props.renderer.onResize();
  }

  @bind
  private _onWindowScroll() {
    this.queryFirstCellRect();
    this.props.renderer.updateFirstRect(this._firstCellRect!);
  }

  @bind
  private _doManualDomHandling(stateChange: StateChange) {
    if (!stateChange.gridChanges) {
      return;
    }
    // Queue up changes to be consumed by animation rAF
    this._changeBuffer.push(...stateChange.gridChanges);

    // Update DOM straight away
    for (const [x, y, cell] of stateChange.gridChanges) {
      const btn = this._buttons[y * this.props.width + x];
      this.updateButton(btn, cell, x, y);
    }
  }

  private _createTable(width: number, height: number) {
    const tableContainer = document.querySelector("." + containerStyle);
    this._table = document.createElement("table");
    this._table.classList.add(gameTable);
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
        this._additionalButtonData.set(button, [x, y, defaultCell]);
        this.updateButton(button, defaultCell, x, y);
        this._buttons.push(button);
        td.appendChild(button);
        tr.appendChild(td);
      }
      this._table.appendChild(tr);
    }
    this._canvas = this.props.renderer.createCanvas();
    this._canvas.classList.add(canvasStyle);
    this.base!.appendChild(this._canvas);
    tableContainer!.appendChild(this._table);
    this._table.addEventListener("click", this.onClick);
    this._table.addEventListener("mouseup", this.onMouseUp);
    this._table.addEventListener("contextmenu", event =>
      event.preventDefault()
    );
  }

  private _updateAnimation(btn: HTMLButtonElement) {
    const ts = performance.now();
    const [x, y, cell] = this._additionalButtonData.get(btn)!;
    let animationList = this._animationLists.get(btn)!;

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
          this._animationLists.set(btn, animationList);
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
      if (
        cell.touchingFlags >= cell.touchingMines &&
        cell.touchingMines > 0 &&
        !isHighlighted
      ) {
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
      this._animationLists.set(btn, animationList);
      // This button already played the flash animation
      if (this._flashedCells.has(btn)) {
        return;
      }
      animationList = removeAnimations(animationList, [AnimationName.IDLE]);
      this._flashedCells.add(btn);
      animationList.push({
        name: AnimationName.FLASH_IN,
        start: ts,
        done: () => {
          animationList = removeAnimations(animationList, [
            AnimationName.FLASH_IN
          ]);
          this._animationLists.set(btn, animationList);
        }
      });
      animationList.unshift({
        name: AnimationName.NUMBER,
        start: ts + 100
      });
      animationList.push({
        name: AnimationName.FLASH_OUT,
        start: ts + 100
      });
    }

    this._animationLists.set(btn, animationList);
  }

  private _maybeAnimateTile(btn: HTMLButtonElement, ts: number) {
    const { width, height, left, top } = this._firstCellRect!;
    const [bx, by, cell] = this._additionalButtonData.get(btn)!;
    const x = bx * width + left;
    const y = by * height + top;

    // If cell is out of bounds, skip it
    if (
      x + width < 0 ||
      y + height < 0 ||
      x > window.innerWidth ||
      y > window.innerHeight
    ) {
      return;
    }

    const animationList = this._animationLists.get(btn);
    if (!animationList) {
      return;
    }
    for (const animation of animationList) {
      this.props.renderer.render(bx, by, cell, animation, ts);
    }
  }

  private _rendererInit() {
    this.props.renderer.init(this.props.width, this.props.height);
  }

  @bind
  private _animationLoop(ts: number) {
    const delta = ts - this._lastTs;
    this._lastTs = ts;

    // Update DOM and animations according to incoming grid changes
    this._consumeChangeBuffer(delta);

    // Iterate over all the buttons and update the data in the `dynamicTileData`
    // buffer.
    for (const cell of this._buttons) {
      this._maybeAnimateTile(cell, ts);
    }
    if (this._updateLoopRunning) {
      requestAnimationFrame(this._animationLoop);
    }
  }

  private _consumeChangeBuffer(delta: number) {
    const { width } = this.props;
    // Reveal ~5 fields per frame
    const numConsume = Math.floor((delta * 5) / 16);
    const slice = this._changeBuffer.splice(0, numConsume);
    for (const [x, y, cellProps] of slice) {
      const btn = this._buttons[y * width + x];
      this._updateAnimation(btn);
    }
  }

  private _animationsInit() {
    const startTime = performance.now();
    const rippleFactor =
      rippleSpeed * Math.max(this.props.width, this.props.height);
    for (const button of this._buttons) {
      const [x, y] = this._additionalButtonData.get(button)!;
      this._animationLists.set(button, [
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

  private queryFirstCellRect() {
    this._firstCellRect = this._buttons[0]
      .closest("td")!
      .getBoundingClientRect();
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

    const cell = this._additionalButtonData.get(button)!;
    this.props.onCellClick(cell, alt);
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
      cellState = cell.flagged
        ? `flag at ${position}`
        : `hidden at ${position}`;
    } else if (cell.hasMine) {
      cellState = `mine at ${position}`; // should it say black hole?
    } else if (cell.touchingMines === 0) {
      cellState = `blank at ${position}`;
    } else {
      cellState = `${cell.touchingMines} at ${position}`;
    }

    btn.setAttribute("aria-label", cellState);
    this._additionalButtonData.get(btn)![2] = cell;
  }
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
