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
import MinesweeperGame, {
  StateChange as GameStateChange
} from "../../gamelogic/index";

export interface GameType {
  width: number;
  height: number;
  toRevealTotal: number;
}

export interface StateChange {
  game?: GameType;
  gameStateChange?: GameStateChange;
}

export default class StateService {
  private _eventTarget: EventTarget = new MessageChannel().port1;
  private _game?: MinesweeperGame;

  initGame(width: number, height: number, numBombs: number) {
    let gameActiveChange = false;

    if (this._game) {
      this._game.unsubscribe();
    } else {
      gameActiveChange = true;
    }

    this._game = new MinesweeperGame(width, height, numBombs);

    if (gameActiveChange) {
      this._notify({
        game: { width, height, toRevealTotal: this._game.toReveal }
      });
    }

    this._game.subscribe(stateChange => {
      this._notify({ gameStateChange: stateChange });
    });
  }

  subscribe(callback: (state: StateChange) => void) {
    this._eventTarget.addEventListener("state-update", (event: Event) => {
      callback((event as CustomEvent<StateChange>).detail);
    });
  }

  reset() {
    if (!this._game) {
      return;
    }
    this._game.unsubscribe();
    this._game = undefined;
    this._notify({ game: undefined });
  }

  flag(x: number, y: number) {
    this._game!.setFlag(x, y, true);
  }

  unflag(x: number, y: number) {
    this._game!.setFlag(x, y, false);
  }

  reveal(x: number, y: number) {
    this._game!.reveal(x, y);
  }

  revealSurrounding(x: number, y: number) {
    this._game!.attemptSurroundingReveal(x, y);
  }

  private _notify(stateChange: StateChange) {
    this._eventTarget.dispatchEvent(
      new CustomEvent<StateChange>("state-update", {
        detail: stateChange
      })
    );
  }
}
