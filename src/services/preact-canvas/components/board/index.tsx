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
  idleSprites,
  lazyGenerateTextures,
  numberAnimation,
  staticSprites
} from "../../../../rendering/animation.js";
import { bind } from "../../../../utils/bind.js";
import { staticDevicePixelRatio } from "../../../../utils/static-dpr.js";
import { GameChangeCallback } from "../../index.js";

import {
  fadedLinesAlpha,
  idleAnimationLength,
  idleAnimationNumFrames,
  rippleSpeed,
  spriteSize
} from "src/rendering/constants.js";
import { getCellSizes } from "src/utils/cell-sizing.js";
import ShaderBox from "src/utils/shaderbox.js";
import fragmentShader from "./fragment.glsl";
import {
  board,
  button as buttonStyle,
  canvas as canvasStyle,
  container as containerStyle,
  gameCell,
  gameRow,
  gameTable
} from "./style.css";
import vertexShader from "./vertex.glsl";

const defaultCell: Cell = {
  flagged: false,
  hasMine: false,
  revealed: false,
  touchingFlags: 0,
  touchingMines: 0
};

const enum DynamicTileData {
  HIGHLIGHT_OPACITY,
  FLASH_OPACITY,
  BORDER_OPACITY,
  BOXES_OPACITY
}

export interface Props {
  onCellClick: (cell: [number, number, Cell], alt: boolean) => void;
  width: number;
  height: number;
  gameChangeSubscribe: (f: GameChangeCallback) => void;
  gameChangeUnsubscribe: (f: GameChangeCallback) => void;
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
  private cellPadding = getCellSizes().cellPadding;
  private shaderBox?: ShaderBox;
  private dynamicTileData?: Float32Array;
  private staticTileData?: Float32Array;

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

  private generateGameFieldMesh() {
    const { cellPadding, cellSize } = getCellSizes();
    const tileSize = cellSize + 2 * cellPadding;

    const gap = 0;
    const { width, height } = this.props;
    const vertices = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        vertices.push(
          ...generateCoords(
            x * (tileSize + gap),
            y * (tileSize + gap),
            x * (tileSize + gap) + tileSize,
            y * (tileSize + gap) + tileSize
          )
        );
      }
    }
    return new Float32Array(vertices);
  }

  private generateVertexIndices() {
    const { width, height } = this.props;
    const indices = [];
    for (let i = 0; i < width * height; i++) {
      indices.push(
        i * 4,
        i * 4 + 1,
        i * 4 + 2,
        i * 4 + 2,
        i * 4 + 1,
        i * 4 + 3
      );
    }
    return indices;
  }

  private async canvasInit() {
    this.canvasRect = this.canvas!.getBoundingClientRect();
    this.queryFirstCellRect();
    this.canvas!.width = this.canvasRect.width * staticDevicePixelRatio;
    this.canvas!.height = this.canvasRect.height * staticDevicePixelRatio;
    if (this.shaderBox) {
      this.shaderBox.resize();
    }
    if (this.renderLoopRunning) {
      return;
    }

    const numTiles = this.props.width * this.props.height;
    const uvs = [0, 1, 0, 0, 1, 1, 1, 0];
    const mesh = this.generateGameFieldMesh();
    this.shaderBox = new ShaderBox(vertexShader, fragmentShader, {
      canvas: this.canvas!,
      uniforms: [
        "offset",
        "idle_sprites[0]",
        "idle_sprites[1]",
        "idle_sprites[2]",
        "idle_sprites[3]",
        "static_sprite",
        "sprite_size",
        "tile_size",
        "frame"
      ],
      scaling: staticDevicePixelRatio,
      mesh: [
        {
          dimensions: 2,
          name: "pos"
        },
        {
          dimensions: 2,
          name: "tile_uv"
        },
        {
          name: "static_tile_data",
          dimensions: 3
        },
        {
          name: "dynamic_tile_data",
          dimensions: 4,
          usage: "DYNAMIC_DRAW"
        }
      ],
      indices: this.generateVertexIndices(),
      clearColor: [0, 0, 0, 0]
    });
    this.shaderBox.updateVBO("pos", mesh);
    this.shaderBox.updateVBO(
      "tile_uv",
      mesh.map((_, idx) => uvs[idx % uvs.length])
    );
    this.staticTileData = new Float32Array(
      new Array(numTiles * 4 * 3).fill(0).map((_, idx) => {
        const fieldIdx = Math.floor(idx / 12);
        const x = fieldIdx % this.props.width;
        const y = Math.floor(fieldIdx / this.props.width);
        switch (idx % 3) {
          case 0:
            return x;
          case 1:
            return y;
          case 2:
            return -1;
          default:
            return -2;
        }
      })
    );
    this.shaderBox.updateVBO("static_tile_data", this.staticTileData);
    this.dynamicTileData = new Float32Array(
      new Array(numTiles * 4 * 4).fill(0).map((_, idx) => {
        switch (idx % 4) {
          case DynamicTileData.BORDER_OPACITY:
            return 1;
          case DynamicTileData.BOXES_OPACITY:
            return fadedLinesAlpha;
          case DynamicTileData.FLASH_OPACITY:
            return 0;
          case DynamicTileData.HIGHLIGHT_OPACITY:
            return 0;
          default:
            return -1;
        }
      })
    );
    this.shaderBox.updateVBO("dynamic_tile_data", this.dynamicTileData);
    this.shaderBox.setUniform2f("offset", [0, 0]);
    this.shaderBox.resize();

    await lazyGenerateTextures();
    // Due to the way internal WebGL state handling works, we
    // have to add all the textures first before we bind them.
    this.shaderBox.addTexture(`staticSprite`, staticSprites![0]);
    for (let i = 0; i < idleSprites!.length; i++) {
      this.shaderBox.addTexture(`idleSprite${i}`, idleSprites![i]);
    }

    for (let i = 0; i < idleSprites!.length; i++) {
      this.shaderBox.activateTexture(`idleSprite${i}`, i + 1);
      this.shaderBox.setUniform1i(`idle_sprites[${i}]`, i + 1);
    }
    this.shaderBox.activateTexture(`staticSprite`, 0);
    this.shaderBox.setUniform1i(`static_sprite`, 0);

    const { cellPadding, cellSize } = getCellSizes();
    const tileSize = (cellSize + 2 * cellPadding) * staticDevicePixelRatio;
    const framesPerAxis = Math.floor(spriteSize / tileSize);
    const framesPerSprite = framesPerAxis * framesPerAxis;

    this.shaderBox!.setUniform1f("sprite_size", spriteSize);
    this.shaderBox!.setUniform1f("tile_size", tileSize);

    const that = this;
    let lastTs = performance.now();
    requestAnimationFrame(function f(ts) {
      that.consumeChangeBuffer(ts - lastTs);
      lastTs = ts;

      const normalizedTime = (ts % idleAnimationLength) / idleAnimationLength;
      let frame = Math.floor(normalizedTime * idleAnimationNumFrames);
      const sprite = Math.floor(frame / framesPerSprite);
      frame = frame % framesPerSprite;
      const y = Math.floor(frame / framesPerAxis);
      const x = frame % framesPerAxis;
      that.shaderBox!.setUniform4f("frame", [x, y, 0, sprite]);
      that.shaderBox!.updateVBO("dynamic_tile_data", that.dynamicTileData!);
      that.queryFirstCellRect();
      that.shaderBox!.setUniform2f("offset", [
        that.firstCellRect!.left,
        that.firstCellRect!.top
      ]);
      that.shaderBox!.draw();
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
    this.additionalButtonData.get(btn)![2] = cell;
  }
}

function generateCoords(x1: number, y1: number, x2: number, y2: number) {
  return [x1, y1, x1, y2, x2, y1, x2, y2];
}
