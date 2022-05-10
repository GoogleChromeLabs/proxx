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

import { bind } from "src/utils/bind";

// WARNING: This module is part of the main bundle. Avoid adding to it if possible.

export interface GamepadState {
  // For each button, how many ticks it has been held down for.
  buttonsHeldTicks: number[];
}

export class GamepadController {
  get isGamepadConnected(): boolean {
    return this._hasConnectedGamepads;
  }
  private _state: GamepadState[] = [];

  private _hasConnectedGamepads = false;
  private _tickScheduled = false;

  private _buttonDownCallbacks = new Set<(button: number) => void>();
  private _buttonPressCallbacks = new Set<(button: number) => void>();
  private _connectedCallbacks = new Set<() => void>();

  constructor() {
    // @ts-ignore This version of TS is not aware of this event.
    window.addEventListener("gamepadconnected", this._onGamepadConnected);
    this._scheduleTick();
  }

  addButtonDownCallback(callback: (button: number) => void) {
    this._buttonDownCallbacks.add(callback);
  }

  removeButtonDownCallback(callback: (button: number) => void) {
    this._buttonDownCallbacks.delete(callback);
  }

  addButtonPressCallback(callback: (button: number) => void) {
    this._buttonPressCallbacks.add(callback);
  }

  removeButtonPressCallback(callback: (button: number) => void) {
    this._buttonPressCallbacks.delete(callback);
  }

  addConnectedCallback(callback: () => void) {
    this._connectedCallbacks.add(callback);
  }

  removeConnectedCallback(callback: () => void) {
    this._connectedCallbacks.delete(callback);
  }

  @bind
  private _onGamepadConnected() {
    this._scheduleTick();
  }

  private _scheduleTick() {
    if (!this._tickScheduled) {
      this._tickScheduled = true;
      requestAnimationFrame(this._tick);
    }
  }

  @bind
  private _tick() {
    this._tickScheduled = false;
    if (typeof navigator.getGamepads === "undefined") {
      return;
    }
    const gamepads = navigator.getGamepads();

    // Iterate over all gamepads, and update the state.
    const currentlyIsConnected = this._hasConnectedGamepads;
    this._hasConnectedGamepads = false;
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad !== null) {
        this._hasConnectedGamepads = true;
        let state = this._state[i];
        if (state === undefined) {
          state = this._state[i] = {
            buttonsHeldTicks: new Array(gamepad.buttons.length).fill(0)
          };
        }

        for (let j = 0; j < gamepad.buttons.length; j++) {
          const button = gamepad.buttons[j];
          if (button.pressed) {
            state.buttonsHeldTicks[j]++;
          } else {
            state.buttonsHeldTicks[j] = 0;
          }
        }
      }
    }

    if (currentlyIsConnected !== this._hasConnectedGamepads) {
      this._connectedCallbacks.forEach(callback => callback());
    }

    // Iterate over all gamepads, and emit "buttonPress" and "buttonup" events.
    for (const state of this._state) {
      for (let j = 0; j < state.buttonsHeldTicks.length; j++) {
        // If the button just started being pressed we emit a "down" and a "hold"
        // event.
        const tick = state.buttonsHeldTicks[j];
        if (tick === 1) {
          this._buttonDownCallbacks.forEach(callback => callback(j));
        }
        // If the button is being held down, we emit an event every 5 ticks
        // (16.6 * 5 =~ 80ms) after an initial wait of 18 ticks
        // (16.6 * 18 =~ 300ms). We also emit
        if (tick === 1 || (tick >= 18 && (tick - 18) % 5 === 0)) {
          this._buttonPressCallbacks.forEach(callback => {
            callback(j);
          });
        }
      }
    }

    // Schedule the next tick if there are still gamepads connected.
    if (this._hasConnectedGamepads) {
      this._scheduleTick();
    }
  }
}

export const gamepad = new GamepadController();
