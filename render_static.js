const ejs = require("ejs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ecstatic = require("ecstatic");
const http = require("http");

function unrollDependencies(dependencygraph, desc) {
  return [
    desc.fileName,
    ...desc.imports
      .map(d => dependencygraph[d])
      .flatMap(m => unrollDependencies(dependencygraph, m))
  ];
}

function findChunkWithName(dependencygraph, name) {
  return Object.values(dependencygraph).find(desc =>
    (desc.facadeModuleId || "").endsWith(name)
  );
}

function extractPreloads(dependencygraph) {
  return unrollDependencies(
    dependencygraph,
    findChunkWithName(dependencygraph, "bootstrap.ts")
  );
}

function extractBootstrap(dependencygraph) {
  return findChunkWithName(dependencygraph, "bootstrap.ts").fileName;
}

async function generateShell(file, dependencygraph) {
  const pkg = require("./package.json");
  const template = fs.readFileSync("src/index.ejs").toString();
  const output = ejs.render(template, {
    bootstrapFile: extractBootstrap(dependencygraph),
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
  // Figure out preload
  const preloads = extractPreloads(dependencygraph).map(
    name => `<link rel="preload" href="./${name}" as="script" />`
  );

  const workerChunk = findChunkWithName(dependencygraph, "worker.ts");
  // Use prefetch as link[rel=preload][as=worker] is not supported yet
  // crbug.com/946510#
  preloads.push(`<link rel="prefetch" href="./${workerChunk.fileName}" />`);
  markup = markup.replace("</head>", `${preloads.join("")}</head>`);
  return markup;
}

async function run() {
  const dependencygraph = require("./dependencygraph.json");
  await generateShell("dist/index.html", dependencygraph);
  const server = await startServer();
  const port = server.address().port;
  let markup = await grabMarkup(`http://localhost:${port}`);
  markup = await correctMarkup(markup, { port, dependencygraph });
  fs.writeFileSync("dist/index.html", markup);
  server.close();
}
run();
