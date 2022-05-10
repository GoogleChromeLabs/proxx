declare module "consts:nebulaSafeDark" {
  const value: import("./rendering/constants").Color;
  export default value;
}

declare module "consts:prerender" {
  const value: boolean;
  export default value;
}

interface GA {
  (...args: any[]): void;
  q: any[];
}
declare var ga: GA;
interface Window {
  ga: GA;
}

declare var prerenderDone: () => void;

interface HTMLElement {
  webkitRequestFullscreen?: () => void;
}

// tslint:disable-next-line:no-namespace
declare namespace JSX {
  interface HTMLAttributes {
    inputmode?: string;
  }
}

/**
 * This Gamepad API interface defines an individual gamepad or other controller, allowing access to
 * information such as button presses, axis positions, and id. Available only in secure contexts.
 */
interface Gamepad {
  readonly axes: ReadonlyArray<number>;
  readonly buttons: ReadonlyArray<GamepadButton>;
  readonly connected: boolean;
  readonly hapticActuators: ReadonlyArray<GamepadHapticActuator>;
  readonly id: string;
  readonly index: number;
  readonly mapping: GamepadMappingType;
  readonly timestamp: DOMHighResTimeStamp;
}

declare var Gamepad: {
  prototype: Gamepad;
  new (): Gamepad;
};

/**
 * An individual button of a gamepad or other controller, allowing access to the current state of
 * different types of buttons available on the control device. Available only in secure contexts.
 */
interface GamepadButton {
  readonly pressed: boolean;
  readonly touched: boolean;
  readonly value: number;
}

declare var GamepadButton: {
  prototype: GamepadButton;
  new (): GamepadButton;
};

/**
 * This Gamepad API interface contains references to gamepads connected to the system, which is what
 * the gamepad events Window.gamepadconnected and Window.gamepaddisconnected are fired in response to.
 * Available only in secure contexts.
 */
interface GamepadEvent extends Event {
  readonly gamepad: Gamepad;
}

declare var GamepadEvent: {
  prototype: GamepadEvent;
  new (type: string, eventInitDict: GamepadEventInit): GamepadEvent;
};
