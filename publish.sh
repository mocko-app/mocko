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

if [[ ! "${VERSION}" =~ ^v?([0-9]+)\.([0-9]+)\.([0-9]+)([-+].*)?$ ]]; then
  echo "Invalid version: ${VERSION}"
  exit 1
fi

MAJOR_VERSION="${BASH_REMATCH[1]}"
MINOR_VERSION="${BASH_REMATCH[2]}"
MAJOR_MINOR_VERSION="${MAJOR_VERSION}.${MINOR_VERSION}"
DOCKER_TAGS=("${VERSION}" "${MAJOR_MINOR_VERSION}" "${MAJOR_VERSION}" "latest")

log() {
  echo
  echo "==> $*"
}

publish_package() {
  local package_dir="$1"
  local package_name

  log "Publishing ${package_dir} with version ${VERSION}"
  pushd "${ROOT_DIR}/${package_dir}" >/dev/null
  npm version "${VERSION}" --no-git-tag-version --allow-same-version
  npm install
  npm publish --tag beta
  package_name=$(node -p "require('./package.json').name")
  npm dist-tag add "${package_name}@${VERSION}" alpha
  popd >/dev/null
}

publish_docker_image() {
  local image="$1"
  local context_dir="$2"
  local tag
  local image_tags=()

  for tag in "${DOCKER_TAGS[@]}"; do
    image_tags+=("-t" "${image}:${tag}")
  done

  log "Building Docker image ${image}:${VERSION}"
  docker build \
    "${image_tags[@]}" \
    "${ROOT_DIR}/${context_dir}"

  for tag in "${DOCKER_TAGS[@]}"; do
    log "Pushing Docker image ${image}:${tag}"
    docker push "${image}:${tag}"
  done
}

log "Logging in to npm"
#npm login

log "Installing root dependencies"
pushd "${ROOT_DIR}" >/dev/null
#npm install
popd >/dev/null

#publish_package "mocko-core"
#publish_package "mocko-control"

publish_docker_image "${CORE_IMAGE}" "mocko-core"
publish_docker_image "${CONTROL_IMAGE}" "mocko-control"

log "Publishing mocko-cli with version ${VERSION}"
pushd "${ROOT_DIR}/mocko-cli" >/dev/null
npm pkg set "dependencies.@mocko/core=${VERSION}" "dependencies.@mocko/control=${VERSION}"
npm install
npm version "${VERSION}" --no-git-tag-version --allow-same-version
npm install
npm publish --tag beta
npm dist-tag add "@mocko/cli@${VERSION}" alpha
popd >/dev/null

log "Updating standalone Dockerfile"
sed -i "s/@mocko\/cli@[^ ]*/@mocko\/cli@${VERSION}/" "${ROOT_DIR}/docker-images/standalone/Dockerfile"

log "Updating Helm chart appVersion"
sed -i "s/^appVersion:.*/appVersion: \"${VERSION}\"/" "${ROOT_DIR}/helm-charts/mocko/Chart.yaml"

log "Waiting for npm distribution before building standalone image"
sleep 60
publish_docker_image "${STANDALONE_IMAGE}" "docker-images/standalone"

log "Published Mocko version ${VERSION}"
