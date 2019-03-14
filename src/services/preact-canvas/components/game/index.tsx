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
import { bind } from "../../../../utils/bind.js";
import StateService from "../../../state.js";
import { Action } from "../cell/index.js";
import { cellInner } from "../cell/style.css";
import Row from "../row/index.js";
import { canvas, container, gameTable } from "./style.css";

interface Props {
  stateService: Remote<StateService>;
  grid: Cell[][];
}

export default class Game extends Component<Props> {
  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private table?: HTMLTableElement;
  private cellsToRedraw: Set<Element> = new Set();
  private canvasRenderPending = false;

  async componentDidMount() {
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
        if (element.classList.contains(cellInner)) {
          this.cellsToRedraw.add(element);
        }
      }
      this.updateCanvas();
    }).observe(this.table!, { attributes: true, subtree: true });
  }

  render({ grid }: Props) {
    return (
      <div class={container}>
        <canvas ref={c => (this.canvas = c)} class={canvas} />
        <table ref={t => (this.table = t)} class={gameTable}>
          {grid.map((row, i) => (
            // tslint:disable-next-line:jsx-no-lambda
            <Row
              row={row}
              onClick={(col, action) => this.click(i, col, action)}
            />
          ))}
        </table>
      </div>
    );
  }

  private drawCell(cell: Element, tableRect: ClientRect | DOMRect) {
    const cellRect = cell.getBoundingClientRect();
    const x = cellRect.left - tableRect.left;
    const y = cellRect.top - tableRect.top;
    const { width, height } = cellRect;
    const ctx = this.ctx!;
    const state = cell.getAttribute("data-state")!;

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

    for (const cell of this.table!.querySelectorAll("." + cellInner)) {
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
  private async click(row: number, col: number, action: Action) {
    switch (action) {
      case Action.Unflag: {
        await this.props.stateService.unflag(col, row);
        break;
      }
      case Action.Flag: {
        await this.props.stateService.flag(col, row);
        break;
      }
      case Action.Reveal: {
        await this.props.stateService.reveal(col, row);
        break;
      }
      case Action.RevealSurrounding: {
        await this.props.stateService.revealSurrounding(col, row);
        break;
      }
    }
  }
}
