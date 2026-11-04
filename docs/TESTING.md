# Testing & CI/CD

Everything runs in Docker via Compose, so the same commands work on your laptop, in Claude's cloud
sandbox and in GitHub Actions. Nothing but Docker is needed on the host.

## Test layers

| Layer | Where | Command | Needs services | Runs in CI |
| --- | --- | --- | --- | --- |
| Lint + typecheck | all packages | `make quality` | no | every PR |
| Unit (vitest) | `packages/core`, pure logic, `*.test.ts` | `make unit` | no | every PR |
| Integration (vitest) | `packages/db`, `packages/ai` tools, API routes, `*.int.test.ts` | `make integration` | Postgres+pgvector, Redis | every PR |
| E2E (Playwright, 390px + 1280px) | `apps/web/e2e` | `make e2e` | full stack | every PR (after the above) |
| AI evals | `packages/ai/evals` | `pnpm evals` | DB + real Claude API | only with PR label `run-evals` |

`make test` = quality + unit + integration. `make ci` = everything CI runs (minus evals).

## Conventions (from CLAUDE.md rules)

- **Write core tests first.** Translator, TCO, road-match and battle scoring are pure functions in
  `packages/core` with no framework imports, so unit tests are fast and need no containers.
- **Integration tests use a real Postgres** (pgvector image, tmpfs-backed, wiped each run). No DB mocks.
  Each package defines `test:integration` in its `package.json`; unit tests define `test`.
- **Claude API is never called in unit/integration/e2e.** Tests get a fake `ANTHROPIC_API_KEY`;
  stub the client. Tool-call tests assert the AI layer only returns numbers from DB-backed tools.
- **E2E** defines two Playwright projects (iPhone-size 390px, desktop 1280px) and saves screenshots
  to `test-results/` (uploaded as a CI artifact).
- Seed data for tests lives in `packages/db/seed`; integration tests must not depend on prod data.

## Package script contract

Each workspace package exposes (only those that apply): `test`, `test:integration`, `lint`, `typecheck`.
`apps/web` also exposes `test:e2e`; `packages/db` exposes `db:migrate`, `db:seed`; `packages/ai` exposes `evals`.
Turborepo (`turbo.json`) fans these out.

## CI (GitHub Actions: `.github/workflows/ci.yml`)

Jobs: `quality`, `unit`, `integration` run in parallel; `e2e` runs after they pass; `evals` is opt-in
via the `run-evals` PR label and needs the `ANTHROPIC_API_KEY` repo secret.

One-time setup:
1. Repo → Settings → Branches → protect `main`; require status checks `quality`, `unit`, `integration`, `e2e`.
2. (Optional) Settings → Secrets and variables → Actions → add `ANTHROPIC_API_KEY` for evals.
3. Create the `run-evals` label.

## Working in Claude's cloud environment

- Check the sandbox has Docker (`docker compose version`). If not, the same scripts run natively:
  start Postgres/Redis however the environment allows, set `DATABASE_URL`/`REDIS_URL`, and use `pnpm test` etc.
- Always finish a task by running `make test` (and `make e2e` for UI work); CI is the backstop, not the first check.

## CD (later)

Phase 1 deploys via Vercel + Neon on merge to `main` (Vercel Git integration; migrations run as a
workflow step against Neon before promote). Phase 2 (AWS ECS/Terraform) will add a `deploy.yml` that
reuses the same Docker image. Not wired yet because no app exists to deploy.
