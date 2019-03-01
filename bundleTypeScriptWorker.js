const fs = require("fs");
const path = require("path");
const paths = new Map();

// This plugin handles imports starting with `worker!` and
// creates a module on-the-fly that instantiates a worker
// with the given path.

const PREFIX = 'worker!';

export default function() {
  return {
    resolveId: function(importee) {
      if(!importee.startsWith(PREFIX)) {
        return null;
      }

      let path = importee.slice(PREFIX.length);
      path = path.replace(/\.js$/, '.ts');
      console.log('1>>', path);
      return this.resolveId(path).then(realPath => {
        console.log('2>>', realPath);
        return realPath;
      });
      // if (importee === "-plugin-bundle-worker") {
      //   return path.resolve(__dirname, "workerhelper.js");
      // } else if (importee.indexOf("worker!") === 0) {
      //   var name = importee.split("!")[1],
      //     target = path.resolve(path.dirname(importer), name);

      //   paths.set(target, name);
      //   return target;
      // }
    },

    load: function(id) {
      // if (!paths.has(id)) {
      //   return;
      // }

      // var code = [
      //   `import shimWorker from 'rollup-plugin-bundle-worker';`,
      //   `export default new shimWorker(${JSON.stringify(
      //     paths.get(id)
      //   )}, function (window, document) {`,
      //   `var self = this;`,
      //   fs.readFileSync(id, "utf-8"),
      //   `\n});`
      // ].join("\n");

      // return code;
    }
  };
};
