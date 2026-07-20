# Hackathons Module

## Purpose

Hackathon creation, registration, and management.

## Folder Structure

```
hackathons/
├── README.md
├── index.ts
├── api/
├── backend/
│   ├── controller.ts
│   ├── service.ts
│   ├── repository.ts
│   ├── mapper.ts
│   ├── permissions.ts
│   └── errors.ts
├── components/
├── hooks/
├── store/
├── schemas/
├── types/
├── utils/
├── constants.ts
└── metadata.ts
```

## Public API

```ts
import { ... } from "@/modules/hackathons";
```

Other modules should **never** import internal files directly.
