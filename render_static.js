const ejs = require("ejs");
const fs = require("fs");

async function run() {
  const hashmanifest = require("./entrypoint.hashmanifest.json");
  const pkg = require("./package.json");
  const template = fs.readFileSync("src/index.ejs").toString();
  const output = ejs.render(template, { hashmanifest, pkg });
  fs.writeFileSync("dist/index.html", output);
}
run();
