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

import { ProxyResult, proxyValue } from "comlinkjs";
import { h, render } from "preact";

import StateService, { State } from "../state.js";

import Row from "./components/row/index.js";

import { bind } from "../../utils/bind.js";
import { forEach } from "../../utils/streams.js";

import { Action } from "./components/cell/index.js";

// @ts-ignore
import { table } from "./style.css";

export default class PreactService {
  constructor(private stateService: ProxyResult<StateService>) {
    const stateStream = new ReadableStream<State>({
      async start(controller: ReadableStreamDefaultController<State>) {
        // Make initial render ASAP
        controller.enqueue(await stateService.state);
        stateService.subscribe(
          proxyValue((state: State) => controller.enqueue(state))
        );
      }
    });
    forEach(stateStream, async state => this.render(state));
  }

  private render(state: State) {
    render(
      <table class={table}>
        {state.grid.map((row, i) => (
          // tslint:disable-next-line:jsx-no-lambda
          <Row
            key={i}
            row={row}
            onClick={(col, action) => this.click(i, col, action)}
          />
        ))}
      </table>,
      document.body,
      document.body.firstChild as any
    );
  }

  @bind
  private async click(row: number, col: number, action: Action) {
    switch (action) {
      case Action.Flag: {
        await this.stateService.flag(col, row);
        break;
      }
      case Action.Reveal: {
        await this.stateService.reveal(col, row);
        break;
      }
    }
  }
}
