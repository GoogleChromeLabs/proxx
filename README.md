# PROXX

This is a repository for [PROXX](https://proxx.app) - a game build for every device with web borwser (even for feature phones!)

## About this repository

The app is build with [Preact](https://github.com/developit/preact) for the UI framework, [PostCSS](https://github.com/postcss/postcss) for the style, [Comlink](https://github.com/GoogleChromeLabs/comlink) for the web worker handling, and use [Rollup](https://github.com/rollup/rollup) to bundle it all.

There are three main directories

- `/src/services`
- `/src/rendering`
- `/src/gamelogic`

### `/src/services`

This directory contains application code for the game. `/preact-canvas/components` is where UI components for the app lives.

### `/src/rendering`

The app has two rendering mode, WebGL backed animated mode & 2D canvas backed static mode (`webgl-renderer` and `canvas-2d-renderer`). Each has corresponding animator which keeps track of animation state.

We generate all of sprite sheets for animation on the initial load and store them in indexedDB.

### `/src/gamelogic`

This is pure game logic for the the app. Game logic is run inside of a web worker to unlock the main thread as much as possible for graphics work.

## Debugging flag

There are few flags you can set as URL query param to test certain state.

- `prerender`: loads the app in prerender mode
- `debug`: turns on controlls for the Nebula animation
- `no-cache`: install service worker on load
- `cell-focus`: start the game with mouse & key forcus enabled.
- `motion=0`: start the game in no animation mode
- `motion=1`: start the game in animation mode

## Building locally

Clone the repo, then:

```sh
npm install
npm run build
```

You can run the development server with:

```sh
npm run serve
```

Format the code with Prettier before commit:

```
npm run fmt
```
