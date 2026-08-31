# Location

> **Status:** In Progress — schema and backend implemented, browser-tested but not yet merged
>
> **Version:** 1.0
>
> **Referenced By:** Competitions
>
> **Last Updated:** 2026-08-31

---

# Purpose

This document is the reference for the **Competition Location** feature: what problem it solves, how it is modeled, where it lives in the codebase, what is actually done versus what remains, the trade-offs of the approach taken, and how it is meant to plug into competition search.

It exists so anyone (including a future session) can get back into this part of the codebase quickly without re-deriving the design from scratch.

---

# Problem

A competition needs to describe where it happens, but real-world competitions don't fit a single `location: string` field:

- A competition can have **one location, many locations, or none** ("location not announced yet" must be valid, not an error).
- Different locations can serve different purposes within the same competition — e.g. Pune and Mumbai as qualifiers, Delhi as the final.
- Locations can carry their own dates, distinct from the competition's overall date range.
- The exact venue may or may not be known — sometimes only "India" or "Maharashtra" is known.
- Whether the competition is online/offline/hybrid (`Competition.mode`) is a **separate concern** from where it physically happens — the two must not be conflated.

The previous implementation was a single nullable string, `Competition.location`. It was wired through DTOs, the search filter, and the editor store, but was **never actually rendered in the admin edit form** — a half-built feature. It has been removed (see [Implementation Status](#implementation-status)).

---

# Design Philosophy

> **Rich, future-capable data — with low-friction administration.**

The database is allowed to store structured geographic data (country, state, city, coordinates, provider metadata), but an admin should never be forced to fill all of that in. The normal flow is:

```
Search for a location → Select it → Done
```

Everything else (structured fields, coordinates, provider linkage) is populated automatically when a provider is available, and is safely absent when it isn't.

A second, harder requirement: **an external geocoding provider outage must never block competition creation or editing.** Manual entry — just a display name — is always available and always sufficient to save.

---

# Architecture

```text
Competition
    │
    │ 0..N
    ▼
CompetitionLocation
    │
    │ 1
    ▼
Location
```

- **`Location`** — a real-world place, stored at whatever precision is actually known (country, state, city, or exact venue).
- **`CompetitionLocation`** — the join model. It exists as its own entity (not a bare many-to-many) because the relationship carries its own data: what role this location plays in *this* competition (label, venue, address, dates, display order). That information does not belong to the place itself — the same city can be a "Qualifier" for one competition and a "Final" for another.

Key rule: **`Location` rows are never shared or deduplicated across competitions.** Two competitions both held in Pune get two separate `Location` rows. This was a deliberate trade-off — see [Pros and Cons](#pros-and-cons).

---

# The `Location` Model

`prisma/schema.prisma` — model `Location`, `@@map("location")`.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `displayName` | `String` | The only required field. What the UI shows. |
| `precision` | `LocationPrecision` | `UNKNOWN \| COUNTRY \| STATE \| CITY \| VENUE`. Default `UNKNOWN`. |
| `country`, `countryCode`, `state`, `stateCode`, `city`, `postalCode` | `String?` | Structured fields, all optional. |
| `latitude`, `longitude` | `Decimal? @db.Decimal(9, 6)` | Always both-or-neither — enforced at the schema and normalizer level. |
| `timezone` | `String?` | IANA identifier, e.g. `Asia/Kolkata`. Not yet populated by any provider. |
| `provider` | `LocationProvider` | `MANUAL \| NOMINATIM`. Default `MANUAL`. |
| `providerLocationId` | `String?` | Opaque external id, kept only for potential re-enrichment — never required to read a location back. |
| `createdAt`, `updatedAt` | `DateTime` | |

`LocationPrecision.UNKNOWN` exists specifically so that a bare manually-typed name (no structured fields) is never presented as if it were a confirmed city match. `VENUE` is never inferred automatically — it can only be set explicitly (by a provider result or admin input) because no combination of city/state/country can prove a specific building.

---

# The `CompetitionLocation` Model

`prisma/schema.prisma` — model `CompetitionLocation`, `@@map("competition_location")`.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(cuid())` | Own identity, not a composite key — because the same `Location` could theoretically back two different `CompetitionLocation` rows on the same competition (e.g. two rounds at the same venue). |
| `competitionId`, `competition` | FK → `Competition`, `onDelete: Cascade` | |
| `locationId`, `location` | FK → `Location`, `onDelete: Cascade` | |
| `label` | `String?` | Free text, e.g. "Qualifier", "Final", "Opening Ceremony". Deliberately **not an enum** — nothing in the system branches on this value; it's display-only. |
| `venueName` | `String?` | e.g. "MIT-WPU Auditorium". |
| `address` | `String?` | Free text, more specific than the `Location`'s structured fields. |
| `startDate`, `endDate` | `DateTime?` | Independent of the competition's own date range. |
| `order` | `Int @default(0)` | Presentation order. Row/creation order is never relied on. |
| `createdAt`, `updatedAt` | `DateTime` | |

A competition having **zero** `CompetitionLocation` rows is valid and common — it means location isn't known yet, nothing more. There is deliberately no `locationStatus` enum (`TO_BE_ANNOUNCED`, etc.) — an empty list already communicates that unambiguously.

---

# Implementation Map

Everything below exists in `next/` (the Next.js app), relative to that directory.

## Schema & migration

- `prisma/schema.prisma` — `Location`, `CompetitionLocation`, `LocationPrecision`, `LocationProvider`; `Competition.location` (string) removed, replaced by `Competition.locations: CompetitionLocation[]`.
- `prisma/migrations/20260830153816_add_competition_location/` — drops the old column, creates the two new tables. **No backfill** — see [Implementation Status](#implementation-status).
- `prisma/seed/seeders/competitions.seeder.ts` — seed data now creates a `Location` + `CompetitionLocation` per seeded competition (idempotent: clears and re-links on each run) instead of writing a bare string.

## `locations` module (place-level concerns — provider-agnostic)

```
src/modules/locations/
├── README.md                       ← module-level docs, config table
├── index.ts                        ← public API — import only from here
├── types/
│   ├── location.dto.ts             ← LocationDTO (UI-facing shape)
│   └── provider.ts                 ← LocationSearchProvider interface, LocationSuggestion, LocationSearchResult
├── schemas/
│   ├── location-input.ts           ← LocationInputSchema (zod) — only displayName required
│   └── location-search.ts          ← LocationSearchQuerySchema
├── utils/
│   └── normalize.ts                ← normalizeLocationInput, inferPrecision, composeDisplayName
├── mapper/
│   └── location.mapper.ts          ← Prisma Location → LocationDTO (Decimal → number)
├── repository/
│   └── location.repository.ts      ← CRUD + deleteIfOrphaned + internal free-text search
├── providers/
│   ├── nominatim.provider.ts       ← LocationSearchProvider implementation (OpenStreetMap)
│   └── index.ts                    ← resolveLocationProvider() — env-driven, returns null if unconfigured
├── services/
│   ├── location.service.ts         ← create/update, always normalizes first
│   └── location-search.service.ts  ← LocationSearchService — the resilience layer (see below)
├── backend/
│   └── controller.ts               ← LocationController.search
└── api/
    └── location-api.ts             ← browser client, LocationApi.search
```

## Competition-side integration (usage-level concerns)

```
src/modules/competitions/
├── backend/
│   ├── competition-location.repository.ts   ← CompetitionLocation CRUD, scoped by competitionId
│   ├── competition-location.mapper.ts       ← → CompetitionLocationDTO / SummaryDTO
│   ├── competition-location.service.ts      ← add/update/remove/reorder, transactional
│   └── controller.ts                        ← extended with listLocations/addLocation/updateLocation/removeLocation/reorderLocations
├── schemas/
│   └── competition-location.ts              ← CreateCompetitionLocationSchema, UpdateCompetitionLocationSchema, ReorderCompetitionLocationsSchema
├── types/
│   ├── competition-location.dto.ts          ← CompetitionLocationDTO, CompetitionLocationSummaryDTO
│   └── competition-location-request.dto.ts  ← wire-shape DTOs for the API client
├── api/
│   └── competition-location-api.ts          ← CompetitionLocationApi (browser client)
├── errors/
│   └── competition-location-not-found-error.ts
├── repository.ts, mapper.ts                 ← extended to include/map `locations`
├── search/schema.ts, search/where.ts        ← location search filters, see below
└── store/editor-store.ts                    ← setLocations() action
```

## API routes

```
src/app/api/v1/
├── locations/search/route.ts                          GET   — hybrid location search
└── admin/competitions/[id]/locations/
    ├── route.ts                                        GET, POST, PATCH (reorder)
    └── [locationId]/route.ts                           PATCH, DELETE
```

## Admin UI

```
src/components/admin/competition-editor/
├── location-picker.tsx    ← search-or-type combobox (Command + Popover), always offers manual entry
├── locations-tab.tsx      ← full tab: add / edit label-venue-address-dates / reorder / remove
└── competition-editor.tsx ← wired in as a new "Locations" tab
```

## Public UI

- `src/app/(dashboard)/(competition)/competitions/[slug]/page.tsx` — detail page renders `competition.locations[]` (badges + a detail block with label/venue/dates per location).
- `src/modules/competitions/components/allCompititions/CompetitionsCards.tsx` — card shows the first location + a "+N more" count.

---

# How Search Works (Provider Resilience)

`LocationSearchService.search(query, limit, provider?)`:

1. Always queries `LocationRepository.search()` first — free-text match against locations **already stored on the platform** (no network call, always available).
2. If a provider is configured (`resolveLocationProvider()` reads `LOCATION_PROVIDER` env var), it's called with a 3-second timeout via `AbortController`.
3. **Any** provider failure — unconfigured, unreachable, slow, malformed response — degrades to internal-only results. The method never throws for provider reasons.
4. Results are merged and de-duplicated by display name, internal results ranked first.
5. The response includes `providerAvailable: boolean` so the UI can tell the admin "lookup is unavailable, here's what we already have — you can still type it manually" rather than surfacing a hard error.

Only one provider is implemented today: `NominatimLocationProvider` (OpenStreetMap, no API key required). It's opt-in — `LOCATION_PROVIDER=nominatim` plus a required `LOCATION_PROVIDER_USER_AGENT` (Nominatim's usage policy). Unset by default; the app works fully without it.

Manual entry is not a fallback shown only on failure — the location picker offers "Use \"<what you typed>\" as typed" on every search, unconditionally.

---

# Implementation Status

## Done

- [x] Schema: `Location`, `CompetitionLocation`, `LocationPrecision`, `LocationProvider`
- [x] Migration written (`20260830153816_add_competition_location`) and applied locally
- [x] `locations` module: schemas, normalizer, repository, mapper, service, hybrid search service
- [x] Nominatim provider implementation + env-gated resolver
- [x] Competition-side repository/service/mapper for `CompetitionLocation`
- [x] Full CRUD + reorder API routes, following existing controller/service/repository conventions
- [x] Admin UI: location picker (search + manual entry) and full locations tab (label, venue, address, dates, reorder, remove)
- [x] Public UI: competition detail page and card list updated to render `locations[]`
- [x] Competition search (`search/schema.ts`, `search/where.ts`) updated: free-text `location` filter now matches against the relation; new structured `countries` / `states` / `cities` filters
- [x] Legacy `Competition.location` string field, and every reference to it (DTOs, zod schema, editor store, search filter), fully removed
- [x] Type-checked (`tsc --noEmit`), linted, production build passes
- [x] Verified with a temporary 36-case script exercising normalizer, schemas, search-filter construction, and provider-outage behavior (script was deleted after — no test framework exists in this repo yet, see [Open Questions](#open-questions--future-work))

## Explicitly not done (by choice — see [Design Decisions](#design-decisions-recap))

- No backfill of old `location` strings into the new model — dropped without migration, per an explicit decision made when this was built.
- No deduplication/reuse of `Location` rows across competitions.
- No `locationStatus` enum.

## Remaining before this should be considered fully shipped

- [ ] **Commit the change set.** As of this writing, everything above is implemented and locally verified but sitting uncommitted.
- [ ] **Manual browser walkthrough** of the admin Locations tab (add via search, add via manual entry, edit fields, reorder, remove) — was verified via type-check/lint/build only, not a live click-through, at the time this was built. Confirm this has since happened before merging.
- [ ] Public competition search UI (filter inputs) does not yet expose the new `countries`/`states`/`cities` filters — the backend supports them, nothing in the frontend calls them yet. See [Search Integration Plan](#search-integration-plan).
- [ ] No automated test suite exists in this repo. If one gets introduced later, the normalizer, schemas, and `LocationSearchService` resilience behavior (the parts covered by the deleted throwaway script) are the highest-value first candidates.
- [ ] `timezone` field exists on `Location` but nothing populates it yet (Nominatim doesn't return it in the current implementation).
- [ ] `Location.postalCode` / coordinates are stored but nothing in the UI surfaces or edits them directly — they only get filled in when a provider result supplies them.

---

# Pros and Cons

## Pros

- **Matches reality.** Multiple locations, per-location dates, unknown/partial locations, and exact venues are all first-class, not bolted on.
- **Admin speed preserved.** The common case (search, pick, done) stays one action; nothing forces filling in country/state/city/coordinates by hand.
- **No hard dependency on a third party.** Manual entry always works; a geocoding outage degrades search quality, not the ability to save a competition.
- **Clean separation of concerns.** `mode` (online/offline/hybrid) and `locations` (where, if anywhere) don't fight each other — a hybrid competition with unannounced locations is representable without contradiction.
- **Provider swappable.** `LocationSearchProvider` is an interface; replacing Nominatim with Google Places / Mapbox later touches one new file plus the resolver, not the rest of the stack.
- **Search-ready without over-building.** Structured fields (city/state/country/coordinates) exist today for future filtering and proximity search, without having built a full geographic hierarchy system.

## Cons / accepted trade-offs

- **No location deduplication.** Two competitions in Pune create two `Location` rows with identical data. This trades storage/normalization purity for the far simpler guarantee that editing one competition's venue can never silently affect another's — deliberate, but worth knowing if someone later expects a canonical "Pune" entity to filter/join against.
- **No backfill on the schema cut-over.** Any pre-existing `location` strings in production data are gone once this migration runs. This was an explicit choice made for this implementation, not a limitation of the model — a backfill migration is possible later if old data still exists somewhere.
- **Structured fields depend entirely on manual entry accuracy or provider quality.** A manually-typed "Pune" has `precision: UNKNOWN` and no `city` field populated — it won't participate in structured city/state/country search until either the admin fills in more, or a provider match sets it.
- **Single provider implemented.** Only Nominatim exists today; nothing has been validated against Google Places, Mapbox, or a self-hosted geocoder, though the interface should make that a contained change.
- **No proximity ("near me") search yet.** Coordinates are stored, but there's no geospatial indexing or radius query — the schema avoids blocking this, but nothing implements it.

---

# Search Integration Plan

## What exists today

- `CompetitionSearchSchema` (`src/modules/competitions/search/schema.ts`) has:
  - `location: string` — free text, matched against `displayName`, `city`, `state`, `country` on any of a competition's locations (`contains`, case-insensitive).
  - `countries`, `states`, `cities: string[]` (CSV-parsed) — structured filters, matched against name **or** ISO code where applicable (e.g. `countries` matches `country` or `countryCode`).
- `CompetitionWhereBuilder.buildLocation()` (`src/modules/competitions/search/where.ts`) builds these into a single `locations: { some: { location: { AND: [...] } } }` clause — important detail: all provided conditions must be satisfied by the **same** `Location` row, so filtering by `country=India, city=Pune` won't match a competition that happens to have a Pune stop *and*, separately, an unrelated India-only stop. It's asking "does one of your locations satisfy all of this," not "do your locations collectively satisfy this."
- A competition with zero locations never matches any location filter (correct — the platform doesn't know where it is, and shouldn't guess).

## What's not built yet

- **Frontend filter UI.** There's no UI control on the public competitions search/listing page for filtering by country/state/city yet. The backend is ready; wiring it in is a frontend-only task (add fields to whatever search form component drives `CompetitionSearchSchema` today, likely near wherever `modes`/`statuses`/`categories` filters currently live).
- **Precision-aware matching semantics.** Right now `countries`/`states`/`cities` do exact (case-insensitive) equality per field. The open question from the original ideation — "if a competition's location is only known at state level, should a city-level search still surface it?" — has not been decided or implemented. Current behavior: no, because a city filter checks `Location.city`, and a state-only location has that field `null`.
- **Proximity search.** Coordinates exist on `Location` but there is no radius/geospatial query, no PostGIS, and no "near me" UI. This is explicitly deferred — the schema doesn't block it, but building it means: geospatial index, a radius parameter on the search schema, and a distance calculation in `CompetitionWhereBuilder` (or a raw query, since Prisma's relational filtering can't do distance math natively).
- **Search relevance/ranking by location.** Multiple matching locations, or a search that should rank "exact city match" above "country-only match," isn't implemented — every match is currently boolean (matches or doesn't), no ranking weight is applied.

## Suggested next steps, in order

1. Wire the existing `countries`/`states`/`cities`/`location` filters into whatever component renders the public competitions search UI.
2. Decide and implement the broad-match semantics question above (state-only location matching a city search, or not) — this is a product decision as much as a technical one.
3. If proximity search becomes a priority, that's the point to introduce PostGIS (or a simpler haversine-in-SQL approach) rather than before — the current schema doesn't need to change to support it later.

---

# Design Decisions (Recap)

These mirror the pre-implementation ideation and were carried through as-built:

- **`label` is a free string, not an enum** — competition structures vary too much ("Qualifier", "Workshop", "Opening Ceremony", ...); nothing in the system branches on it, so an enum would only add friction without adding safety.
- **No `locationStatus` field** — an empty `locations[]` already means "not known yet"; a separate status enum would need its own set of ambiguous values (`TO_BE_ANNOUNCED` vs `UNKNOWN` vs `NOT_AVAILABLE`) for no clear benefit.
- **`mode` and `locations` stay separate** — an online competition can have zero locations, a hybrid competition can have locations pending, an offline competition always needs at least a rough location eventually — none of these combinations should be blocked by a schema constraint.
- **No automatic deduplication of `Location` rows** — fuzzy-matching "Pune" vs "Pune, Maharashtra" vs "MIT-WPU, Pune" reliably is a hard problem with real failure modes (accidentally merging distinct places, or a shared-row edit silently affecting an unrelated competition); duplicate rows are a strictly safer default.
- **External providers are strictly optional** — `resolveLocationProvider()` returning `null` is a fully supported, first-class state, not a degraded one.

---

# Guiding Principle

The Location model should answer one question:

> **What does Kizunia actually know about where this competition happens — and how confident is that knowledge?**

It should never force an admin to invent precision the real world hasn't provided yet, and it should never let the absence of a third-party service stop a competition from being created or edited.
