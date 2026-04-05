/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const path = require("node:path");

let child = null;
let cleanupRegistered = false;

function start({ port, coreUrl, deploySecret }) {
  if (child) {
    return Promise.resolve();
  }

  const standaloneDir = path.join(
    __dirname,
    ".next",
    "standalone",
    "mocko-control",
  );
  const serverPath = path.join(standaloneDir, "server.js");
  const shouldLogControlOutput = process.env.MOCKO_CONTROL_LOGS === "true";
  child = spawn(process.execPath, [serverPath], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      HOSTNAME: "0.0.0.0",
      MOCKO_CORE_URL: coreUrl,
      MOCKO_DEPLOY_SECRET: deploySecret,
    },
    stdio: shouldLogControlOutput ? ["ignore", "inherit", "inherit"] : "ignore",
  });

  if (!cleanupRegistered) {
    cleanupRegistered = true;
    process.once("exit", () => {
      if (child) {
        child.kill();
      }
    });
  }

  return Promise.resolve();
}

function stop() {
  if (!child) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const proc = child;
    child = null;
    proc.once("close", () => resolve());
    proc.kill();
  });
}

module.exports = {
  start,
  stop,
};
