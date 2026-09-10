#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PUSH=false
if [[ "${1:-}" == "--push" ]]; then
  PUSH=true
  shift
fi

if [[ $# -gt 0 ]]; then
  SERVICES=("$@")
else
  SERVICES=(auth admin realtime restaurant rider utils)
fi

DOCKER_USER="${DOCKER_USER:-pentoshi007}"
SHA="$(git rev-parse --short HEAD)"
LOG_DIR="$(mktemp -d)"
trap 'rm -rf "$LOG_DIR"' EXIT

if [[ "$PUSH" == true && -n "${DOCKERHUB_TOKEN:-}" ]]; then
  printf '%s' "$DOCKERHUB_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin
fi

run_parallel() {
  local action="$1"
  local pids=()
  local failed=0
  local index
  local service
  for service in "${SERVICES[@]}"; do
    "$action" "$service" >"$LOG_DIR/$service.$action.log" 2>&1 &
    pids+=("$!")
  done
  for index in "${!SERVICES[@]}"; do
    if wait "${pids[$index]}"; then
      echo "$action ok: ${SERVICES[$index]}"
    else
      echo "$action failed: ${SERVICES[$index]}" >&2
      tail -n 30 "$LOG_DIR/${SERVICES[$index]}.$action.log" >&2
      failed=1
    fi
  done
  [[ "$failed" -eq 0 ]]
}

build_image() {
  docker build \
    -t "$DOCKER_USER/$1:$SHA" \
    -t "$DOCKER_USER/$1:latest" \
    "services/$1"
}

push_image() {
  docker push "$DOCKER_USER/$1:$SHA"
  docker push "$DOCKER_USER/$1:latest"
}

run_parallel build_image

if [[ "$PUSH" == true ]]; then
  run_parallel push_image
fi

echo "done: ${SERVICES[*]} -> $DOCKER_USER/<service>:$SHA and :latest"
