const ejs = require("ejs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ecstatic = require("ecstatic");
const http = require("http");
const path = require("path");

function findChunkWithName(dependencygraph, name) {
  return Object.values(dependencygraph).find(desc =>
    (desc.facadeModuleId || "").endsWith(name)
  );
}

function findAssetWithName(dependencygraph, name) {
  const parsedName = path.parse(name);

  return Object.values(dependencygraph).find(desc => {
    if (!desc.isAsset) return false;
    const parsedGraphName = path.parse(desc.fileName);
    if (parsedGraphName.ext !== parsedName.ext) return false;
    if (!parsedGraphName.name.startsWith(parsedName.name)) return false;
    const expectedHash = parsedGraphName.name.slice(parsedName.name.length);
    return /^-[0-9a-f]+$/.test(expectedHash);
  });
}

async function renderEjsFile(inPath, outPath, data) {
  const template = fs.readFileSync(inPath).toString();
  const output = ejs.render(template, data);
  fs.writeFileSync(outPath, output);
}

async function generateShell(file, dependencygraph) {
  await renderEjsFile("src/index.ejs", file, {
    bootstrapFile: findChunkWithName(dependencygraph, "bootstrap.ts").fileName,
    workerFile: findChunkWithName(dependencygraph, "worker.ts").fileName,
    normalFontFile: findAssetWithName(
      dependencygraph,
      "space-mono-normal.woff2"
    ).fileName,
    boldFontFile: findAssetWithName(dependencygraph, "space-mono-bold.woff2")
      .fileName,
    favicon: findAssetWithName(dependencygraph, "favicon.ico"),
    dependencygraph,
    pkg: require("./package.json"),
    fs
  });
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
  return "<!doctype html>" + markup;
}

async function correctMarkup(markup, { port }) {
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
  markup = await correctMarkup(markup, {
    port
  });
  fs.writeFileSync("dist/index.html", markup);
  server.close();

  await renderEjsFile("src/_headers.ejs", "dist/_headers", {});
}
run();
