# TorqueMach

AI-powered car discovery portal for Indian car enthusiasts and buyers. Tagline: "Specs you can feel."
It turns specs into real life (suitcases, speed breakers, ghat overtakes, monthly fuel cost) and lets
people chat, battle and match cars instead of using filter dropdowns.

Full product context lives in `docs/PRD.md`. Read it before starting any feature.
The interactive prototype (single HTML file) is in `docs/prototype/index.html` and is the visual
and behavioural reference.

## Non-negotiable rules

1. **The AI never invents specs, prices or ratings.** Every number shown to a user comes from the
   database. The LLM gets numbers only through tool calls (`search_cars`, `get_car`, `compare_cars`,
   `compute_tco`, `road_score`). If data is missing, the AI says so.
2. **The database is the single source of truth.** No spec values hard-coded in components.
3. **Calculations are pure functions with unit tests** (`packages/core`): real-life translator,
   5-year cost of ownership, road-match scoring, battle scoring. Write the tests first.
4. **Mobile first.** Most users are on phones. Check every screen at 390px wide.
5. **Flashy but fast.** Lighthouse mobile performance 85 or higher. Lazy-load 3D, audio and heavy
   animation. Respect `prefers-reduced-motion`.
6. **India defaults.** Prices in ₹ lakh (`₹12.9L`), Indian number grouping (`1,20,000`), km, kmpl,
   ex-showroom vs on-road clearly labelled.
7. **No scraping of aggregator sites** (CarWale, CarDekho, etc.). Spec data comes from official
   manufacturer brochures or a licensed provider.

## Stack

- Monorepo: pnpm + Turborepo
- `apps/web`: Next.js (App Router), TypeScript strict, Tailwind, shadcn/ui, Motion (Framer Motion),
  GSAP ScrollTrigger, React Three Fiber + drei, Vercel AI SDK (`useChat`), Web Audio
- `packages/db`: Postgres (+ pgvector), Drizzle ORM, migrations, seed data
- `packages/core`: pure domain logic (translator, TCO, scoring) — no framework imports
- `packages/ai`: Claude API client, tool definitions, prompts, eval suite
- Cache / rate limit: Redis
- Auth: Auth.js
- Media: S3 + CloudFront
- Observability: Langfuse (LLM traces), Sentry
- Hosting: Vercel + Neon (phase 1); AWS ECS Fargate + RDS + CloudFront via Terraform (phase 2)

## Repo layout

```
apps/web/            Next.js app (routes in app/, components in components/)
packages/core/       domain logic + tests
packages/db/         schema.ts, migrations/, seed/
packages/ai/         tools/, prompts/, evals/
docs/                PRD.md, prototype/, decisions/ (ADRs)
infra/               Terraform (phase 2)
```

## Commands

```
pnpm install
pnpm dev             # run web app
pnpm test            # unit tests (vitest)
pnpm lint && pnpm typecheck
pnpm db:migrate      # apply migrations
pnpm db:seed         # load seed cars
pnpm evals           # run AI eval suite against packages/ai/evals/cases.json
```

## Design system

Night-garage look from the prototype. Tokens:
- `--bg #0b0d12` graphite, `--panel #141823`, `--line #262c3b`
- `--ink #eef1f7`, `--muted #8b94a9`
- `--red #ff3d2e` tail-light accent (primary action, winners, redline)
- `--xenon #7fd4ff` secondary accent (real-life translations, data)
- Fonts: Big Shoulders Display (headings, uppercase), Figtree (body), JetBrains Mono (numbers)
- Tachometer logo: arc with red redline zone and a needle; "TORQUE" in ink, "MACH" in red.

## How to work in this repo

- Start every feature in plan mode. Propose the plan, wait for approval, then build.
- One feature per branch, small PRs, conventional commit messages.
- After UI work, take Playwright screenshots at 390px and 1280px and check them before saying done.
- After AI work, run `pnpm evals` and report the pass rate versus the previous run.
- Record significant technical decisions as short ADRs in `docs/decisions/`.
- Update the milestone checklist in `docs/PRD.md` when a task is finished.
- Ask before adding a new dependency or a new paid service.

## Testing

All tests run in Docker Compose; see `docs/TESTING.md`. Before saying a task is done run `make test`
(plus `make e2e` for UI work). Never call the real Claude API outside `pnpm evals`.
