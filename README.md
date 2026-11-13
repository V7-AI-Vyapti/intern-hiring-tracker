# Intern Hiring Tracker

Intern Hiring Tracker

## Cookiecutter variables

Drives `.env`, `.env.example`, and Docker. Identity: `project_name`, `project_slug`, `description`. Runtime and DB: `node_env`, `port`, `api_prefix`, `db_*`, `compose_db_host`, `compose_internal_db_port`, `docker_app_host_port`, `docker_db_host_port`, `node_image`, `postgres_image`. Empty `db_database` defaults to `project_slug` with hyphens → underscores.

## Local

```bash
npm install
cp .env.example .env
npm run start:dev
```

Adjust `.env` for your Postgres host/port (see `DB_*` variables).

The HTTP app will not boot until `APP_JWT_PRIVATE_KEY` and `APP_JWT_PUBLIC_KEY` are set. Generate writes those (and a one-time bootstrap admin password) into gitignored `.env`. Change the bootstrap password on first login.

Auth lives at `/api/v1/auth` (`POST /login`, `POST /refresh`, `GET /me`, `POST /api-keys`). Health-check stays public. Issue an API key with `POST /api/v1/auth/api-keys` after login; Swagger Authorize at `/docs` accepts a JWT or `v7ak_…` key.

## Docker

Uses **Postgres** (`postgres`), **Redis**, **MinIO**, the **platform** API, and a **background-worker** for BullMQ. Compose builds both app images from the **monorepo root** so `pnpm install` resolves `workspace:*` (e.g. `@vyapti/core`). Run from this directory inside the repo (e.g. `generated/<project_slug>/`).

```bash
cp .env.example .env
docker compose up --build
```

The **platform** service listens on host port `3000` → container `3000`. Postgres is on host port `5433`. The **background-worker** uses the same image build as **platform** but starts `pnpm --filter <this package> run worker:prod` from `/workspace` so paths and `VYAPTI_REPO_ROOT=/workspace` match the cookiecutter Docker image. Ensure `.env` exists (compose mounts it via `env_file`).
