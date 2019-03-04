const fs = require("fs");
const path = require("path");
const paths = new Map();

// This plugin handles imports starting with `worker!` and
// creates a module on-the-fly that instantiates a worker
// with the given path.

const PREFIX = 'worker!';

export default function() {
  return {
    resolveDynamicImport: function(importee, importer) {
      if(!importee.startsWith(PREFIX)) {
        return null;
      }
      return this.resolveId(importee.slice(PREFIX.length));
    }
  };
};
