# PROXX

![proxx-social-blue-v2 0](https://user-images.githubusercontent.com/234957/57080494-8caff680-6cea-11e9-8477-54ea0e1670e2.png)

This is the repository for [PROXX](https://proxx.app) - a game built for every device with a web browser (including feature phones!)

## About this repository

The app is built with [Preact](https://github.com/developit/preact) for UI components, [PostCSS](https://github.com/postcss/postcss) for styles, [Comlink](https://github.com/GoogleChromeLabs/comlink) for handling web workers and uses [Rollup](https://github.com/rollup/rollup) to bundle it all up.

There are three main directories:

- `/src/services`
- `/src/rendering`
- `/src/gamelogic`

### `/src/services`

Originally, we had a service-based architecture. Over time, the code evolved to two main services: The UI service (`preact-canvas`) and the state service.

### `/src/rendering`

The app has two rendering modes. One backed by WebGL and one backed by Canvas 2D (`webgl-renderer` and `canvas-2d-renderer`). Each renderer can be plugged into an animator — one that uses motion and one that doesn’t use motion. In reality, however, the WebGL renderer is only ever used with the motion animator, and the Canvas 2D renderer is only ever used for no motion.

We generate all the sprites for our animations in the background at load time and store them in IndexedDB.

### `/src/gamelogic`

This is the pure game logic for the app. The game logic is run inside of a web worker through the state service to keep the main thread as free as possible for animation work.

## Debugging flag

There are few flags you can set as URL query parameter for debugging purposes:

- `prerender`: Load the app in prerender mode (used for building the static `index.html`).
- `debug`: Turn on controls for the Nebula animation.
- `no-cache`: Bypass ServiceWorker and IndexedDB caches.
- `cell-focus`: Start the game with mouse & key forcus enabled.
- `motion=0`: Start the game in no animation mode.
- `motion=1`: Start the game in animation mode.

## Building locally

Clone the repository, then:

```sh
npm install
npm run build
```

You can run the development server with:

```sh
npm run serve
```

Format the code with `prettier` and `tslint` before commit:

```
npm run fmt
```
