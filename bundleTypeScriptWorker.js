const astring = require("astring");
const walker = require("acorn-walk");

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
    transform(originalCode, id) {
      const ast = this.parse(originalCode);

      // The walker calls a method for each node type on a “base”before calling
      // the method on our visitor object. The default base doesn’t handle
      // dynamic import and errors. So we create a copy of the original base
      // using `make()` and put `Import()` in there to handle dynamic imports
      // ourselves. IDK what I’m doing here, tbqh
      const newBase = walker.make({
        Import(node) {}
      });
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
            // debugger;
            node.arguments[0] = node.arguments[0].arguments[0];
          }
        },
        newBase
      );
      // debugger;
      const code = astring.generate(ast, {generator});
      debugger;
      return {code, ast};
    }
  };
}
