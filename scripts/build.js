const webpack = require("webpack");
const rimraf = require("rimraf");

const webpackConfig = require("../config/webpack.config.js")(
  process.env.NODE_ENV || "production"
);
const paths = require("../config/paths");
const { logMessage, compilerPromise, sleep } = require("./utils");

const generateStaticHTML = async () => {
  const nodemon = require("nodemon");
  const fs = require("fs");
  const puppeteer = require("puppeteer");
  const PORT = process.env.PORT || 8383;

  const script = nodemon({
    script: `${paths.serverBuild}/server.js`,
    ignore: ["*"]
  });

  script.on("start", async () => {
    try {
      // TODO: add try/wait/retry here instead of just generally waiting for 2000 ms
      await sleep(2000);
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
      const page = await browser.newPage();
      await page.goto(`http://localhost:${PORT}`);
      const pageContent = await page.content();
      fs.writeFileSync(`${paths.clientBuild}/index.html`, pageContent);
      await browser.close();
      script.emit("quit");
    } catch (err) {
      script.emit("quit");
      console.log(err);
    }
  });

  script.on("exit", code => {
    process.exit(code);
  });

  script.on("crash", () => {
    process.exit(1);
  });
};

const build = async () => {
  rimraf.sync(paths.clientBuild);
  rimraf.sync(paths.serverBuild);

  const [clientConfig, serverConfig] = webpackConfig;
  const multiCompiler = webpack([clientConfig, serverConfig]);

  const clientCompiler = multiCompiler.compilers.find(
    compiler => compiler.name === "client"
  );
  const serverCompiler = multiCompiler.compilers.find(
    compiler => compiler.name === "server"
  );

  const clientPromise = compilerPromise("client", clientCompiler);
  const serverPromise = compilerPromise("server", serverCompiler);

  serverCompiler.watch({}, (error, stats) => {
    if (!error && !stats.hasErrors()) {
      console.log(stats.toString(serverConfig.stats));
      return;
    }
  });

  clientCompiler.watch({}, (error, stats) => {
    if (!error && !stats.hasErrors()) {
      console.log(stats.toString(clientConfig.stats));
      return;
    }
  });

  // wait until client and server is compiled
  try {
    await serverPromise;
    await clientPromise;
    // await generateStaticHTML();
    await process.exit("Building completed!");
    logMessage("Done!", "info");
  } catch (error) {
    logMessage(error, "error");
  }
};

build();
