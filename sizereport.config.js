const { parse } = require("path");
const rescapeRE = require("escape-string-regexp");

module.exports = {
  repo: "GoogleChromeLabs/graviton",
  path: "dist/**/*",
  branch: "size-report",
  findRenamed(path, newPaths) {
    const parsedPath = parse(path);
    if (parsedPath.base.startsWith("bootstrap-")) {
      const end = /\..*$/.exec(parsedPath.base)[0];
      const re = new RegExp(
        `^${rescapeRE(parsedPath.dir)}/bootstrap-[^\.]+${end}$`
      );
      return newPaths.find(path => re.test(path));
    }
  }
};
