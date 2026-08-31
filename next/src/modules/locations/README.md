# Locations Module

## Purpose

Real-world places, and the search layer used to find them.

A `Location` records whatever precision is actually known — a country, a state,
a city, or an exact venue — and nothing more. Competitions attach locations
through `CompetitionLocation`, which lives in the competitions module because it
describes *usage* (label, venue, dates, order) rather than geography.

## Folder Structure

```
locations/
├── README.md
├── index.ts
├── api/
│   └── location-api.ts        ← browser client
├── backend/
│   └── controller.ts
├── mapper/
│   └── location.mapper.ts
├── providers/
│   ├── index.ts               ← resolveLocationProvider(), env-driven
│   └── nominatim.provider.ts
├── repository/
│   └── location.repository.ts
├── schemas/
│   ├── location-input.ts
│   └── location-search.ts
├── services/
│   ├── location.service.ts
│   └── location-search.service.ts
├── types/
│   ├── location.dto.ts
│   └── provider.ts            ← LocationSearchProvider interface
└── utils/
    └── normalize.ts
```

## Design rules

**Locations are never deduplicated.** Two competitions in Pune own two rows.
Editing one can never affect the other, and the platform never has to decide
whether "MIT-WPU" and "MIT World Peace University" are the same place.

**External providers are optional.** `resolveLocationProvider()` returns `null`
when nothing is configured, and that is a fully supported state.
`LocationSearchService` treats every provider failure — unconfigured,
unreachable, slow, malformed — as a fallback to internal results plus manual
entry. A geocoding outage must never block a competition from being created or
edited, so `LocationSearchService.search` does not throw for provider reasons.

**Precision is never overstated.** A free-text entry with no structured fields
is `UNKNOWN`, not `CITY`. `VENUE` is only ever set explicitly — it cannot be
inferred from city/state/country.

## Configuration

| Variable | Purpose |
| --- | --- |
| `LOCATION_PROVIDER` | `nominatim` enables external search; unset disables it. |
| `LOCATION_PROVIDER_USER_AGENT` | Contact string Nominatim's usage policy requires. |
| `NOMINATIM_BASE_URL` | Point at a self-hosted instance. Defaults to the public one. |

Leaving these unset is a valid production configuration.

## Public API

```ts
import { ... } from "@/modules/locations";
```

Other modules should **never** import internal files directly.
