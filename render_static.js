const ejs = require("ejs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const ecstatic = require("ecstatic");
const http = require("http");

async function generateShell(file) {
  const hashmanifest = require("./entrypoint.hashmanifest.json");
  const pkg = require("./package.json");
  const template = fs.readFileSync("src/index.ejs").toString();
  const output = ejs.render(template, { hashmanifest, pkg, fs });
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

async function correctMarkup(markup, { port }) {
  // Make absolute references relative
  markup = markup.replace(new RegExp(`http://localhost:${port}`, "g"), "");
  // Turn script tags into preloads
  markup = markup.replace(
    /<script src="\.\/chunk-([^"]+)"[^>]+><\/script>/g,
    `<link rel="preload" href="./chunk-$1" as="script">`
  );
  return markup;
}

async function run() {
  await generateShell("dist/index.html");
  const server = await startServer();
  const port = server.address().port;
  let markup = await grabMarkup(`http://localhost:${port}`);
  markup = await correctMarkup(markup, { port });
  fs.writeFileSync("dist/index.html", markup);
  server.close();
}
run();
