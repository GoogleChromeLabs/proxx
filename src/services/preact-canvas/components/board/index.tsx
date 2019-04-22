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
import { bind } from "../../../../utils/bind.js";
import { GameChangeCallback } from "../../index.js";

import { Animator } from "src/rendering/animator.js";
import MotionAnimator from "src/rendering/motion-animator/index.js";
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
  private _animator?: Animator;
  private _buttons: HTMLButtonElement[] = [];
  private _firstCellRect?: ClientRect | DOMRect;
  private _additionalButtonData = new WeakMap<
    HTMLButtonElement,
    [number, number, Cell]
  >();

  componentDidMount() {
    this._createTable(this.props.width, this.props.height);
    this.props.gameChangeSubscribe(this._doManualDomHandling);
    this._rendererInit();
    this._animatorInit();
    this._queryFirstCellRect();
    this.props.renderer.updateFirstRect(this._firstCellRect!);

    window.addEventListener("resize", this._onWindowResize);
    window.addEventListener("scroll", this._onWindowScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this._onWindowResize);
    this.props.gameChangeUnsubscribe(this._doManualDomHandling);
    this.props.renderer.stop();
    if (this._animator) {
      this._animator.stop();
    }
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
    this._queryFirstCellRect();
    this.props.renderer.updateFirstRect(this._firstCellRect!);
  }

  @bind
  private _doManualDomHandling(stateChange: StateChange) {
    if (!stateChange.gridChanges) {
      return;
    }

    // Update DOM straight away
    for (const [x, y, cell] of stateChange.gridChanges) {
      const btn = this._buttons[y * this.props.width + x];
      this._updateButton(btn, cell, x, y);
    }
    if (this._animator) {
      this._animator.updateCells(stateChange.gridChanges);
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
        this._updateButton(button, defaultCell, x, y);
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
    this._table.addEventListener("click", this._onClick);
    this._table.addEventListener("mouseup", this._onMouseUp);
    this._table.addEventListener("contextmenu", event =>
      event.preventDefault()
    );
  }

  private _rendererInit() {
    this.props.renderer.init(this.props.width, this.props.height);
  }

  private _animatorInit() {
    this._animator = new MotionAnimator(
      this.props.width,
      this.props.height,
      this.props.renderer
    );
  }

  private _queryFirstCellRect() {
    this._firstCellRect = this._buttons[0]
      .closest("td")!
      .getBoundingClientRect();
  }

  @bind
  private _onMouseUp(event: MouseEvent) {
    if (event.button !== 2) {
      return;
    }

    event.preventDefault();
    this._onClick(event, true);
  }

  @bind
  private _onClick(event: MouseEvent | TouchEvent, alt = false) {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    if (!button) {
      return;
    }
    event.preventDefault();

    const cell = this._additionalButtonData.get(button)!;
    this.props.onCellClick(cell, alt);
  }

  private _updateButton(
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
