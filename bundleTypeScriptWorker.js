import { getDefaultCompilerOptions } from "typescript";

const walker = require("acorn-walk");
const MagicString = require("magic-string");

const defaultOpts = {
  marker: "_____TROLOLOLOL",
  filenameRegexp: /["'][^.]+\.js["']/
};

export default function(opts) {
  opts = {...defaultOpts, ...opts};
  return {
    transform(code, id) {
      const ast = this.parse(code);

      // The walker calls a method for each node type on a “base”before calling
      // the method on our visitor object. The default base doesn’t handle
      // dynamic import and errors. So we create a copy of the original base
      // using `make()` and put `Import()` in there to handle dynamic imports
      // ourselves. IDK what I’m doing here, tbqh
      const newBase = walker.make({
        Import(node) {}
      });
      const importCalls = [];
      walker.simple(
        ast,
        {
          NewExpression(node) {
            if (node.callee.name !== "Worker") {
              return;
            }
            if (node.arguments[0].callee.type !== "Import") {
              return;
            }
            // Save the location of the import() call
            importCalls.push(node.arguments[0]);
          }
        },
        newBase
      );
      // Remove the saved `import` calls and generate a source map.
      const ms = new MagicString(code);
      importCalls.forEach(node => {
        ms.appendLeft(node.start, `"${opts.marker}_start" +`);
        ms.appendRight(node.end, `+ "${opts.marker}_end"`);
      });
      return {
        code: ms.toString(),
        map: ms.generateMap({hires: true})
      };
    },
    renderChunk(code) {
      debugger;
      const magicCode = new MagicString(code);
      const matcher = new RegExp(`${opts.marker}_start.+?${opts.marker}_end`, "g");
      while(true) {
        const match = matcher.exec(code);
        if(!match) {
          break;
        }
        const newFilename = opts.filenameRegexp.exec(match[0])[0];
        magicCode.overwrite(match.index, match.index + match[0].length, newFilename)
      }
      return {
        code: magicCode.toString(),
        map: magicCode.generateMap({hires: true})
      };
    }
  };
}
