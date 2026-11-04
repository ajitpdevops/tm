# syntax=docker/dockerfile:1
# One image for unit, integration and e2e runs. Source is baked in (no bind mounts) so that
# per-package node_modules created by pnpm are never shadowed.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Cache layer: download packages from the lockfile only; re-runs when the lockfile changes.
FROM base AS fetch
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch

FROM fetch AS test
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --offline --frozen-lockfile
CMD ["pnpm", "test"]

# Playwright's official image already ships browsers + system libs.
FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS e2e
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=test /app /app
CMD ["pnpm", "test:e2e"]
