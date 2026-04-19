#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
  echo
  echo "==> $*"
}

publish_package() {
  local package_dir="$1"

  log "Publishing ${package_dir} with version ${VERSION}"
  pushd "${ROOT_DIR}/${package_dir}" >/dev/null
  npm version "${VERSION}" --no-git-tag-version
  npm install
  npm publish
  popd >/dev/null
}

log "Installing root dependencies"
pushd "${ROOT_DIR}" >/dev/null
npm install

log "Running root tests"
npm test
popd >/dev/null

publish_package "mocko-proxy"
publish_package "mocko-control"

log "Waiting 60 seconds for npm distribution"
sleep 60

log "Publishing mocko-cli with version ${VERSION}"
pushd "${ROOT_DIR}/mocko-cli" >/dev/null
npm i "@mocko/proxy@${VERSION}" "@mocko/control@${VERSION}" --save-exact
npm version "${VERSION}" --no-git-tag-version
npm install
npm publish
popd >/dev/null

log "Updating standalone Dockerfile"
sed -i "s/@mocko\/cli@[^ ]*/@mocko\/cli@${VERSION}/" "${ROOT_DIR}/docker-images/standalone/Dockerfile"

log "Published Mocko version ${VERSION}"
