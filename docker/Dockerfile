# syntax=docker/dockerfile:1
# Single image used for unit, integration and e2e test runs (and as a build base).
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

FROM base AS deps
# Copy only manifests first so the install layer is cached until deps change.
# (Once the monorepo has settled, narrow this to manifests-only for better layer caching.)
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; else pnpm install; fi

FROM deps AS test
COPY . .
CMD ["pnpm", "test"]

# Playwright's official image already ships browsers + system libs.
FROM mcr.microsoft.com/playwright:v1.49.0-jammy AS e2e
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY --from=deps /app /app
COPY . .
CMD ["pnpm", "test:e2e"]
