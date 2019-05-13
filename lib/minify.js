// Inline for now
import { codeFrameColumns } from "@babel/code-frame";
import * as Terser from "terser";
import nameCache from "./name-cache.js";
let laterOut = 0;
const minifyOpts = {
  nameCache,
  compress: {
    passes: 3,
    global_defs: {
      // see about preimporting require later on
    },
    booleans_as_integers: true
  },
  mangle: {
    reserved: ["require", "define", "self"],
    /* */
    properties: {
      builtins: false,
      debug: false,
      keep_quoted: true,
      regex: /^__|^(?:[A-Z_]+|prevState|state|_(?:width|height|mines|playMode|toReveal|flags|stateChange|minedCells|flagged|hasMine|revealed|touching(?:Flags|Mines)|additionalButtonData)|getSurrounding|grid|subscribe|unsubscribe|reset|restart)$/
      /* Unmaintainable? *
      reserved: [
        // require.js
        "require",
        "define",
        // promises
        "then",
        "catch",
        // regenerator
        "next",
        "return",
        "throw",
        // sw
        "skipWaiting",
        "respondWith",
        "request",
        "waitUntil",
        // cache
        "open",
        "addAll",
        "ignoreSearch",
        // dom
        "class",
        "inputmode",
        "role",
        // storage
        "mines",
        // nav
        "deviceMemory",
        // idk how this happens
        "onSubmit",
        // preact?
        "_doManualDomHandling",
        "_loop",
        "_onBackClick",
        "_onDangerModeChange",
        "_onDangerModeSwitchToggle",
        "_onDangerModeTouchStart",
        "_onDownClick",
        "_onGameChangeSubscribe",
        "_onGameChangeUnsubscribe",
        "_onKeyUp",
        "_onMotionPrefChange",
        "_onResize",
        "_onSelectChange",
        "_onSettingInput",
        "_onSettingsClick",
        "_onSettingsCloseClick",
        "_onStartGame",
        "_onTableScroll",
        "_onUpClick",
        "_onWindowResize",
        "_renderCanvas",
        "_renderLoop",
        "_startGame",
        "moveFocusByKey",
        "moveFocusWithMouse",
        "onCellClick",
        "onDblClick",
        "onGameChange",
        "onKeyDownOnTable",
        "onKeyUp",
        "onKeyUpOnTable",
        "onMouseDown",
        "onMouseUp",
        "onReset",
        "onRestart",
        "removeFocusVisual",
        "setFocus",
        "setFocusVisual",
        "simulateClick"
      ] /* */
      /* Yeah. Reserved list is unmaintainable. */
    }
  },
  sourceMap: true
};

export const terser = {
  name: "terser",
  renderChunk(code, chunk, outputOpts) {
    // async to simplify
    const result = Terser.minify(code, minifyOpts);
    if (laterOut !== -1) {
      if (laterOut !== 0) {
        clearTimeout(laterOut);
        laterOut = 0;
      }
      laterOut = setTimeout(
        cache => console.log("Minify name cache: %O", cache),
        100,
        nameCache
      );
    }
    if (result.error) {
      const { line, col: column, message } = result.error;
      console.error(
        codeFrameColumns(code, { start: { line, column } }, { message })
      );
      throw result.error;
    } else return result;
  }
};
