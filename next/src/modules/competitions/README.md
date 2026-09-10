# Competitions Module

## Purpose

Competition creation, registration, and management.

## Folder Structure

```
competitions/
├── README.md
├── index.ts
├── api/
├── backend/
│   ├── controller.ts
│   ├── service.ts
│   ├── repository.ts
│   ├── lifecycle.service.ts
│   ├── lifecycle.repository.ts
│   ├── mapper.ts
│   ├── permissions.ts
│   └── errors.ts
├── lifecycle/
│   ├── index.ts
│   └── resolver.ts
├── components/
├── hooks/
├── store/
├── schemas/
├── types/
├── utils/
├── constants.ts
└── metadata.ts
```

`lifecycle/` is deliberately outside `backend/`: `resolver.ts` has no
Prisma import and no server-only dependency — it is a pure function from
lifecycle dates and the current time to the status automation believes is
correct (`resolveAutomaticStatus`). `backend/lifecycle.service.ts` is its
only caller; it owns the database access, transactions, and the
preview/apply/sweep orchestration that use it. See
`docs/architecture/workflows/competition/lifecycle-automation.md` for the
precedence rules and the cron/admin/date-edit integration.

## Public API

```ts
import { ... } from "@/modules/competitions";
```

Other modules should **never** import internal files directly.
