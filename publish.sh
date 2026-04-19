#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <version>"
  exit 1
fi

VERSION="$1"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CORE_IMAGE="${CORE_IMAGE:-ghcr.io/mocko-app/core}"
CONTROL_IMAGE="${CONTROL_IMAGE:-ghcr.io/mocko-app/control}"
STANDALONE_IMAGE="${STANDALONE_IMAGE:-ghcr.io/mocko-app/standalone}"

log() {
  echo
  echo "==> $*"
}

publish_package() {
  local package_dir="$1"

  log "Publishing ${package_dir} with version ${VERSION}"
  pushd "${ROOT_DIR}/${package_dir}" >/dev/null
  npm version "${VERSION}" --no-git-tag-version --allow-same-version
  npm install
  npm publish
  popd >/dev/null
}

publish_docker_image() {
  local image="$1"
  local context_dir="$2"
  local image_tag="${image}:${VERSION}"

  log "Building Docker image ${image_tag}"
  docker build \
    -t "${image_tag}" \
    "${ROOT_DIR}/${context_dir}"

  log "Pushing Docker image ${image_tag}"
  docker push "${image_tag}"
}

log "Logging in to npm"
npm login

log "Installing root dependencies"
pushd "${ROOT_DIR}" >/dev/null
npm install
popd >/dev/null

publish_package "mocko-core"
publish_package "mocko-control"

publish_docker_image "${CORE_IMAGE}" "mocko-core"
publish_docker_image "${CONTROL_IMAGE}" "mocko-control"

log "Publishing mocko-cli with version ${VERSION}"
pushd "${ROOT_DIR}/mocko-cli" >/dev/null
npm pkg set "dependencies.@mocko/core=${VERSION}" "dependencies.@mocko/control=${VERSION}"
npm install
npm version "${VERSION}" --no-git-tag-version --allow-same-version
npm install
npm publish
popd >/dev/null

log "Updating standalone Dockerfile"
sed -i "s/@mocko\/cli@[^ ]*/@mocko\/cli@${VERSION}/" "${ROOT_DIR}/docker-images/standalone/Dockerfile"

log "Updating Helm chart appVersion"
sed -i "s/^appVersion:.*/appVersion: \"${VERSION}\"/" "${ROOT_DIR}/helm-charts/mocko/Chart.yaml"

publish_docker_image "${STANDALONE_IMAGE}" "docker-images/standalone"

log "Published Mocko version ${VERSION}"
