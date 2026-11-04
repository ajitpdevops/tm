# TorqueMach — Product Requirements

Owner: Ajit · Status: Pre-build · Last updated: 2026-11-04

## 1. Problem

Indian car portals (CarWale, CarDekho) are spec catalogues with filters. Buyers and enthusiasts
still can't easily answer real questions: "Which car suits my family, my roads and my budget?",
"Will it overtake comfortably on a ghat?", "What will it really cost me over 5 years?"
Numbers like "382 L boot" or "190 mm ground clearance" mean little until translated into real life.

## 2. Vision

The most exciting way to explore cars in India. Every spec becomes something you can feel,
an AI guide replaces filter dropdowns, and the experience looks like a car launch event,
not a datasheet.

## 3. Users

| User | Need |
| --- | --- |
| First-time / family buyer | Shortlist 2–3 cars that fit budget, family and roads, with honest trade-offs |
| Upgrader (e.g. hatchback to SUV) | Compare old vs new, understand total cost and resale |
| Enthusiast | Explore performance, sound, features; battle cars; share opinions |

## 4. Features

Priority: **P0** = beta, **P1** = launch, **P2** = later.

### 4.1 AI Concierge (P0)
User describes their situation in plain language (Hinglish allowed); AI asks at most one
clarifying question, then returns 1–3 cars with a short reason each, in real-life terms.

Acceptance:
- Recommends only cars in the database; all numbers come from tool calls.
- Respects stated budget; if nothing fits, says so and shows the closest options.
- Each pick links to its car page.
- Streaming response; first token under 2 s.
- Conversation can continue ("what about automatic?", "compare the first two").

### 4.2 Car pages (P0)
One page per model with variants, price range, key stats, safety rating, features,
the Spec → Real Life translator, and the 5-year ownership cost.

Acceptance:
- Statically generated, SEO title/description, Open Graph image.
- Variant selector updates price, specs and costs.
- "Ask about this car" box answers questions using that car's data.

### 4.3 Spec → Real Life translator (P0)
Pure functions converting specs to life:
- Boot litres → big suitcases + cabin bags
- Ground clearance → speed-breaker / village-road confidence
- 0–100 time → estimated 60–100 overtaking time ("passes a truck on the Lonavala ghat in ~5 s")
- Efficiency → monthly running cost at user's km/month (default 1,200 km; petrol ₹105/L,
  real-world 72% of claimed; EV ₹8/kWh home charging)
- Torque → loaded-overtake feel
- Safety stars → plain-language crash rating

Acceptance: all assumptions shown on hover/tap; user can change km/month and fuel price.

### 4.4 Battle Mode (P0)
User types "Nexon vs 3XO for ghat overtaking". AI picks the 3–5 metrics relevant to the
question, the page shows head-to-head animated bars, a round score and a verdict.

Acceptance:
- Metric selection by AI, values and winners computed from data (never by the LLM).
- Works with car aliases and typos.
- Shareable battle card image (P1).

### 4.5 Road Match (P0)
User picks a road type: City crawl, Ghat run, Expressway, Village roads, Konkan monsoon.
Cars are ranked by a weighted score of the specs that road stresses, with a reason line.

Acceptance: weights live in config, scoring is unit-tested, top 5 shown with score bars.

### 4.6 5-Year Ownership Truth (P0)
On-road price (mid variant), fuel/charging, insurance, service, minus estimated resale.
Shows total, ₹ per km, stacked breakdown and a resale curve.

Acceptance: assumptions documented and editable; resale % per brand/model stored in DB.

### 4.7 Engine sound + live tachometer (P1)
"Hear it rev" plays the car's sound with a tachometer overlay synced to RPM (kW for EVs).
Phase 1 synthesized audio; phase 2 real recordings.

### 4.8 3D viewer and cinematic feature stories (P1)
Rotate the car, open doors, toggle lights; scroll-driven story per car highlighting
signature features.

### 4.9 My Garage (P1)
Save cars (anonymous in browser, synced when logged in); quick comparison of saved cars;
"Battle my top 2".

### 4.10 Community (P2)
Owner-verified mileage logs, owner Q&A, hidden-features guides.

## 5. Data model (initial)

- `brands` (id, name, resale_pct_default)
- `models` (id, brand_id, name, body_type, launch_year, aliases[], safety_stars, safety_body)
- `variants` (id, model_id, name, fuel, transmission, ex_showroom_inr, power_ps, torque_nm,
  zero_to_100_s, efficiency_kmpl | range_km, battery_kwh)
- `dimensions` (model_id, boot_l, ground_clearance_mm, length_mm, wheelbase_mm, seats)
- `features` (id, name, category) + `variant_features` (variant_id, feature_id)
- `media` (model_id, kind: image|glb|audio, url)
- `road_profiles` (id, name, description, weights jsonb)
- `assumptions` (key, value, unit, source, updated_at) — fuel price, tariff, insurance %, etc.
- `users`, `garages` (user_id, model_id)
- Every spec row carries `source_url` and `verified_at`.

## 6. AI design

- Model: Claude via API with tool use; streaming.
- Tools: `search_cars(filters)`, `get_car(id)`, `compare_cars(ids, metrics)`,
  `compute_tco(variant_id, km_per_month)`, `road_score(road_id)`.
- System prompt: friendly Indian car expert, short answers, real-life terms, honest trade-offs,
  never state a number not returned by a tool.
- Guardrails: rate limit per IP/user, max tokens, cost cap per day, cache common queries.
- Evals: `packages/ai/evals/cases.json` with ~50 buyer prompts and expected properties
  (within budget, cars exist, cites ≥1 real-life translation). Run on every AI change.

## 7. Non-functional requirements

- Mobile-first; Lighthouse mobile performance ≥ 85, accessibility ≥ 90.
- Car pages load under 2.5 s LCP on 4G.
- Reduced-motion mode; keyboard accessible; visible focus states.
- Privacy: no personal data beyond email for login; chat logs anonymized.

## 8. Success metrics (beta)

- 40% of visitors use Concierge, Battle or Road Match.
- Average session over 3 minutes.
- 10% of battles shared.
- AI eval pass rate ≥ 90%.

## 9. Out of scope (for now)

Dealer leads and test-drive booking, used-car listings, financing, two-wheelers.

## 10. Milestones (to-do)

### M0 — Setup
- [ ] Monorepo, CLAUDE.md, lint/typecheck/test hooks, CI on GitHub Actions
- [ ] Playwright MCP and Postgres MCP configured
- [ ] Prototype copied to docs/prototype

### M1 — Data
- [ ] Drizzle schema + migrations
- [ ] Seed 20 models from official brochures with source URLs
- [ ] Assumptions table seeded

### M2 — Core logic
- [ ] Translator, TCO, road scoring, battle scoring in packages/core with tests

### M3 — Design system + pages
- [ ] Tokens, typography, logo, base components
- [ ] Home, Garage grid with filters, car page, Road Match, Battle page

### M4 — AI
- [ ] Tool definitions + Concierge with streaming
- [ ] AI metric selection for Battle; "Ask about this car"
- [ ] Eval suite ≥ 90% pass; rate limits and cost caps

### M5 — Beta launch
- [ ] Deploy (Vercel + Neon), analytics (PostHog), error tracking
- [ ] Private beta with enthusiast groups

### M6 — Flash + community
- [ ] Engine sound + tachometer, 3D viewer, cinematic stories
- [ ] Accounts, My Garage sync, shareable battle cards
- [ ] Terraform + AWS migration when traffic justifies it

## 11. Open questions

- Long-term spec data source: manual curation vs licensed provider?
- Monetization: ads, affiliate leads, premium features?
- Real engine sound recordings: record ourselves or license?
