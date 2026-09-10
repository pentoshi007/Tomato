# Docker Images & Build Automation

All six backend services are containerized (`services/<name>/Dockerfile`, node:22-alpine two-stage: build with tsc, then a production-image install). Each service has a `.dockerignore` (node_modules, dist, .env, logs) so build contexts stay small and secrets never enter an image.

## Local build/push script

`scripts/docker-build-all.sh` builds all six images **in parallel** (per-service logs are captured and tailed on failure) and tags each as `aniket00736/tomato-<service>:<short-sha>` and `:latest`:

```bash
./scripts/docker-build-all.sh                    # build all six
./scripts/docker-build-all.sh restaurant rider   # build a subset
DOCKER_USER=<user> DOCKERHUB_TOKEN=<token> ./scripts/docker-build-all.sh --push
```

- `DOCKER_USER` defaults to `aniket00736`; `IMAGE_PREFIX` (default `tomato-`) controls the repository naming.
- With `--push`, pushes also run in parallel. If `DOCKERHUB_TOKEN` is set the script logs in with it; otherwise it uses your existing `docker login` session.
- The short SHA comes from `git rev-parse --short HEAD`, so run it from a clean, committed tree when pushing.

## CI (GitHub Actions)

`.github/workflows/docker.yml` runs on every push to `main` (and via manual `workflow_dispatch`):

1. A `changes` job uses `dorny/paths-filter` to detect which `services/<name>/**` trees changed.
2. A `build` matrix job builds and pushes **only the changed services**, tagged with the commit short SHA and `latest`, using GitHub Actions cache (`type=gha`, per-service scope).
3. A manual `workflow_dispatch` run builds all six.

Required repository secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (a Docker Hub access token with write scope).

## Current images

Namespace `aniket00736` on Docker Hub, repositories `tomato-auth`, `tomato-admin`, `tomato-realtime`, `tomato-restaurant`, `tomato-rider`, `tomato-utils` — the names Render services already pull. Images are built for `linux/amd64` (Render's platform). Render services pull these by tag — see [deployment.md](deployment.md).
