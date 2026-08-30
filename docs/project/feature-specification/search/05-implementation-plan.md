# Implementation Plan

Reordered from the original brief's phasing: correctness fixes move to the
front (they are small, independent, and one is a live vulnerability), and
the shared core precedes any UI so that the first frontend built is already
the reusable one.

Nothing below is implemented. **Phase 0 is the only part that should
proceed without further design discussion.**

---

## Completed

- Removed the dead, deprecated `src/modules/competitions/schemas/search.schema.ts`
  and its unused imports in both page files. Verified: typecheck clean, no
  new lint errors, `/competitions` and `/competitions?search=2nd` still
  return 200. Branch `feature/competition-search-foundation`.
- **Phase 0, all four items** (below) — implemented and verified.

---

## Phase 0 — Correctness fixes ✅

Independent of the core. Small, high value, shipped first.

1. **Fixed the Projects visibility defect**
   ([01, §D](01-current-state.md#d-live-defect--project-visibility-is-caller-controlled)).
   Removed `visibility` from `ProjectQuerySchema` and `ProjectQueryDto`;
   `ProjectRepository.buildWhereClause` now hardcodes `visibility: "PUBLIC"`
   for this listing path; the commented-out `PlatformAuthorizer.can(...,
   VIEW_PUBLIC_PROJECTS)` check in `service.ts` is now active. Verified live
   against the dev server: `?visibility=UNLISTED` now returns only `PUBLIC`
   projects (previously returned the `UNLISTED` one). A regression test
   codifying this is still open — see below.
   - `src/modules/projects/search/schema.ts`
   - `src/modules/projects/search/dto.ts`
   - `src/modules/projects/backend/repository.ts`
   - `src/modules/projects/backend/service.ts`
2. **Stopped discarding URL sort/limit in Competitions** (limitation 4).
   Removed the `filters.sort = "newest"` / `filters.limit = …` overrides in
   both pages; schema defaults and user-supplied values now flow through.
   - `src/app/(dashboard)/(competition)/competitions/page.tsx`
   - `src/app/(dashboard)/admin/competitions/page.tsx`
3. **Widened the `searchParams` prop type** in both pages to
   `Promise<Record<string, string | undefined>>`, replacing a stale 3-field
   type against a ~25-field schema.
4. **Added a sort tiebreaker** (limitation 6). `CompetitionOrderByBuilder.build`
   now returns `[primarySort, { id: "asc" }]` instead of a single object, so
   pagination is deterministic even when rows share a sort value (including
   two `null`s on `startDate`/`registrationDeadline`). Updated the dependent
   `orderBy` type in `builder.ts` and `types.ts` from a single object to an
   array — Prisma accepts both, so this is not a query-shape change.
   - `src/modules/competitions/search/order-by.ts`
   - `src/modules/competitions/search/builder.ts`
   - `src/modules/competitions/search/types.ts`

**Still open from Phase 0:** the regression test asserting an anonymous
caller cannot retrieve a non-`PUBLIC` project (item 1) has not been written
— there is no existing test suite in the repo to extend yet. Worth deciding
whether to introduce one now or fold it into Phase 1's testing strategy.

---

## Phase 1 — The shared core

No user-visible change. Pure infrastructure plus a proven-safe migration.

1. Build `src/lib/search/`: `types.ts`, `compose.ts`, `scope.ts`, `sort.ts`,
   `pagination.ts`, `engine.ts`, `schema.ts`, `url.ts`, and
   `filters/` (the eight primitives in
   [02, §4](02-core-architecture.md#4-filter-primitives)).
2. Write the **behaviour-preservation suite first**: assert the engine
   reproduces `CompetitionWhereBuilder`'s output across a matrix of filter
   combinations. This is what makes the migration provable rather than
   hopeful.
3. Author the Competitions registry:
   `src/modules/competitions/search/definition.ts` (server) and `ui.ts`
   (client-safe), plus `scopes.ts` and `sorts.ts`.
4. Switch `CompetitionSearchBuilder` to delegate to the engine. Keep its
   public signature so the service and repository are untouched.
5. Resolve the client/server enum-import question
   ([02, §10](02-core-architecture.md#10-the-clientserver-split)) and verify
   against a real bundle — do not assume it works.
6. Delete the superseded `where.ts` / `*-where.ts` / `order-by.ts` /
   `pagination.ts` once the suite is green.

**Exit criterion:** the behaviour-preservation suite passes and
`/competitions` renders identically to before.

---

## Phase 2 — Competitions discovery UI

The first consumer of the generic frontend, built generically from day one.

1. `src/components/search/use-search-params-state.ts`
2. `src/components/search/filter-control.tsx` + `multi-select-filter.tsx`,
   `text-filter.tsx` (range and date controls deferred to Phase 3)
3. `src/components/search/search-filters-bar.tsx`,
   `search-active-filters.tsx`, `search-sort-control.tsx`
4. Wire into `/competitions`. Quick-filter set: `modes`, `categories`,
   `technologies`, `location`, `difficultyLevels`, `registrationFeeTypes` —
   chosen from the brief's "what users actually care about" list,
   constrained to fields the card can also display.
5. Fix pagination links to use `buildHref` (limitation 5).
6. Surface `registrationFeeType` and `difficulty` on the competition card so
   newly-filterable fields are visible in results (limitation 9), and
   restore the commented-out `registrationDeadline` block.

**Exit criterion:** a user can filter, sort, see active filters, clear them,
paginate without losing state, and share the resulting URL.

---

## Phase 3 — Advanced filters

1. `search-advanced-panel.tsx` with buffered Apply/Cancel committing via
   `setMany`. Confirm the drawer primitive already settled on (`vaul` vs
   shadcn Sheet) rather than adding a fourth.
2. `range-filter.tsx`, `date-range-filter.tsx`.
3. Register the remaining Competitions filters as `group: "advanced"`:
   registration platform/type, organizer type and name, eligibility,
   certificate type, team size, the three date ranges.

---

## Phase 4 — Projects adoption

1. Projects registry, scopes and sorts on the core.
2. Parameter migration per
   [04, §2](04-module-adoption.md#breaking-parameter-changes).
3. `SearchResult<T>` with totals.
4. Build the public `/projects` listing and `/projects/[slug]` detail pages —
   currently absent despite a complete backend, and the largest product gap
   in the codebase. Reuses Phase 2–3 components with zero new filter UI.

---

## Phase 5 — Blogs

When the Blog model lands. Registry, scopes (`visibility: PUBLIC` **and**
`status: PUBLISHED`), sorts, listing page. Expected cost: one registry file
and zero new components — see
[04, §3](04-module-adoption.md#3-blogs--the-designs-real-test). If that
proves false, revisit the abstraction rather than working around it.

---

## Phase 6 — Customization

Recently/frequently-used filters, per-user quick/advanced promotion,
reordering. Mechanically a re-sort of the registry array. Revisit `nuqs`
here, once multiple modules share the URL-state pattern.

## Phase 7 — Saved Searches

Persist `{ name, ownerId, entity, params }`; run by navigating. No core
change expected.

## Phase 8 — Preferences

Separate model. Seeds the URL only on a zero-parameter landing.

## Phase 9 — Recommendations

Separate ranking service. Never contributes a `where` clause.

---

## Sequencing notes

- Phases 0 and 1 are independent of product decisions and can start on
  approval.
- Phase 2 depends on the quick-filter set, which should ideally be informed
  by the user research mentioned in the brief. If that research is not ready,
  the set above is a defensible default and is cheap to re-group later —
  that is the point of the registry.
- The location filter is deliberately shipped as-is (free-text `contains`)
  in Phase 2. Any geo work is gated on
  [06-open-questions.md](06-open-questions.md#1-location-and-geography).

---

## Files index

### Phase 0 — modified

- `src/modules/projects/search/schema.ts`
- `src/modules/projects/backend/repository.ts`
- `src/modules/projects/backend/service.ts`
- `src/app/(dashboard)/(competition)/competitions/page.tsx`
- `src/app/(dashboard)/admin/competitions/page.tsx`
- `src/modules/competitions/search/order-by.ts`

### Phase 1 — created

- `src/lib/search/{types,compose,scope,sort,pagination,engine,schema,url}.ts`
- `src/lib/search/filters/*.ts` (8 primitives)
- `src/modules/competitions/search/{definition,ui,scopes,sorts}.ts`
- `src/lib/enums/*` (client-safe enum mirrors, if Phase 1.5 confirms the need)

### Phase 1 — deleted after migration

- `src/modules/competitions/search/{where,public-where,management-where,admin-where,order-by,pagination}.ts`

### Phase 2 — created

- `src/components/search/{use-search-params-state,filter-control,multi-select-filter,text-filter,search-filters-bar,search-active-filters,search-sort-control}.tsx`

### Phase 3 — created

- `src/components/search/{search-advanced-panel,range-filter,date-range-filter}.tsx`

### Unchanged throughout

Competitions' AND/OR semantics, the controller → service → authorization →
repository → Prisma layering, authorization policy and permission sets, all
Prisma models.
