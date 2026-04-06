/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

let child = null;
let cleanupRegistered = false;

function findStandaloneDir() {
  const packagedStandaloneDir = path.join(
    __dirname,
    ".next",
    "standalone",
    "mocko-control",
  );

  if (fs.existsSync(path.join(packagedStandaloneDir, "server.js"))) {
    return packagedStandaloneDir;
  }

  const searchRoots = [process.cwd(), __dirname];
  for (const root of searchRoots) {
    let current = root;

    while (true) {
      const candidate = path.join(
        current,
        "mocko-control",
        ".next",
        "standalone",
        "mocko-control",
      );

      if (fs.existsSync(path.join(candidate, "server.js"))) {
        return candidate;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }

      current = parent;
    }
  }

  return packagedStandaloneDir;
}

function start({ port, coreUrl, deploySecret }) {
  if (child) {
    return Promise.resolve();
  }

  const standaloneDir = findStandaloneDir();
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
