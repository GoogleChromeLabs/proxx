const walker = require("acorn-walk");
const MagicString = require("magic-string");

const defaultOpts = {
  // Unique marker that temporarily injected to mark Worker imports. Should be
  // unique enough to not appear in (minified) code accidentally.
  marker: "_____TROLOLOLOL",
  // Regexp that finds the new chunk filename in between the markers after
  // Rollup has done it’s thing.
  filenameRegexp: /(["']).+?\.js\1/
};

export default function(opts) {
  opts = { ...defaultOpts, ...opts };
  return {
    transform(code, id) {
      const ast = this.parse(code);

      // The walker calls a method for each node type on a “base” before calling
      // the method on our visitor object. The default base doesn’t handle
      // dynamic import. Here we create a copy of the original base
      // using `make()` and put add an empty handler for dynamic imports
      // ourselves. Seems to work :shrug:
      const newBase = walker.make({
        Import(node) {}
      });

      // Collect all the worker calls in this array.
      const newWorkerCalls = [];
      walker.simple(
        ast,
        {
          NewExpression(node) {
            if (node.callee.name !== "Worker") {
              return;
            }
            newWorkerCalls.push(node.arguments[0]);
          }
        },
        newBase
      );

      // Surround the worker constructor call with markers so we can find it
      // later and inject a dynamic import so that Rollup has to create an edge
      // in the dependency graph. We have to use markers as the import might get
      // processed by Rollup for AMD/CommonJS or something and the file name
      // will be changed by Rollup as well.
      const ms = new MagicString(code);
      newWorkerCalls.forEach(node => {
        // Insert marker
        ms.appendLeft(node.start, `"${opts.marker}_start" +import(`);
        ms.appendRight(node.end, `)+ "${opts.marker}_end"`);
      });
      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true })
      };
    },
    renderChunk(code) {
      const magicCode = new MagicString(code);
      // Find all the markers in this file
      const matcher = new RegExp(
        `"${opts.marker}_start.+?${opts.marker}_end"`,
        "g"
      );
      while (true) {
        const match = matcher.exec(code);
        if (!match) {
          break;
        }
        // Extract the new filename that has to be somewhere between these markers.
        const newFilename = opts.filenameRegexp.exec(match[0])[0];
        // Replace the marked section with just the filename, which will
        // leave the file with a normal `new Worker(<new filename>)` call.
        magicCode.overwrite(
          match.index,
          match.index + match[0].length,
          newFilename
        );
      }
      return {
        code: magicCode.toString(),
        map: magicCode.generateMap({ hires: true })
      };
    }
  };
}
