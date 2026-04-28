/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyDirContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  ensureDir(path.dirname(targetDir));
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function prepareStandaloneAssets() {
  const packageRoot = path.join(__dirname, "..");
  const standaloneDir = path.join(
    packageRoot,
    ".next",
    "standalone",
    "mocko-control",
  );

  const staticSource = path.join(packageRoot, ".next", "static");
  const staticTarget = path.join(standaloneDir, ".next", "static");
  copyDirContents(staticSource, staticTarget);

  const publicSource = path.join(packageRoot, "public");
  const publicTarget = path.join(standaloneDir, "public");
  copyDirContents(publicSource, publicTarget);
}

prepareStandaloneAssets();
