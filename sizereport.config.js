const escapeRE = require("escape-string-regexp");

module.exports = {
  repo: "GoogleChromeLabs/proxx",
  path: "dist/**/*",
  branch: "master",
  findRenamed(path, newPaths) {
    // Chunks can't be predictably found.
    if (path.includes("chunk-")) {
      return;
    }
    const nameParts = /^(.+\-)[a-f0-9]+(\..+)$/.exec(path);
    if (!nameParts) return;

    const matchRe = new RegExp(
      `^${escapeRE(nameParts[1])}[a-f0-9]+${escapeRE(nameParts[2])}$`
    );
    const matchingEntry = newPaths.find(path => matchRe.test(path));
    return matchingEntry;
  }
};
