const ejs = require("ejs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ecstatic = require("ecstatic");
const http = require("http");

function findChunkWithName(dependencygraph, name) {
  return Object.values(dependencygraph).find(desc =>
    (desc.facadeModuleId || "").endsWith(name)
  );
}

async function generateShell(file, dependencygraph) {
  const pkg = require("./package.json");
  const template = fs.readFileSync("src/index.ejs").toString();
  const output = ejs.render(template, {
    bootstrapFile: findChunkWithName(dependencygraph, "bootstrap.ts").fileName,
    workerFile: findChunkWithName(dependencygraph, "worker.ts").fileName,
    dependencygraph,
    pkg,
    fs
  });
  fs.writeFileSync(file, output);
}

async function startServer() {
  const app = ecstatic({
    root: "./dist"
  });
  return http.createServer(app).listen();
}

async function grabMarkup(address) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // TODO Is this good?
  page.viewport(1280, 720);
  await page.goto(address);
  await page.waitFor(1000);
  // Set all input field values as an attribute
  await page.evaluate(() => {
    document.querySelectorAll("input").forEach(el => {
      el.setAttribute("value", el.value);
    });
  });
  const markup = await page.evaluate(() => document.documentElement.outerHTML);
  await browser.close();
  return markup;
}

async function correctMarkup(markup, { port, dependencygraph }) {
  // Make absolute references relative
  markup = markup.replace(new RegExp(`http://localhost:${port}/`, "g"), "./");
  // Remove all dynamically added script tags
  markup = markup.replace(
    /<script src="\.\/chunk-([^"]+)"[^>]+><\/script>/g,
    ""
  );
  return markup;
}

async function run() {
  const dependencygraph = require("./dependencygraph.json");
  await generateShell("dist/index.html", dependencygraph);
  const server = await startServer();
  const port = server.address().port;
  let markup = await grabMarkup(`http://localhost:${port}/?prerender`);
  markup = await correctMarkup(markup, { port, dependencygraph });
  fs.writeFileSync("dist/index.html", markup);
  server.close();
}
run();
