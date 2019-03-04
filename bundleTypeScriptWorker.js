const astring = require("astring");
const walker = require("acorn-walk");
const MagicString = require("magic-string");

// Astring doesn’t have a default generator for dynamic import, so we are fixing
// that here.
const generator = Object.assign(
  {},
  astring.baseGenerator,
  {
    Import(node, state) {
      state.write('import');
    }
  }
);

function uuid() {
  return new Array(4)
    .map(i => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16))
    .join("-");
}

export default function() {
  const placeholderMap = new Map();
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
            importCalls.push(node.arguments[0].callee);
          }
        },
        newBase
      );
      debugger;
      // Remove the saved `import` calls and generate a source map.
      const ms = new MagicString(code);
      importCalls.forEach(({start, end}) => {
        ms.remove(start, end);
      });
      return {
        code: ms.toString(),
        map: ms.generateMap({hires: true})
      };
    }
  };
}
