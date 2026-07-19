# Tech Stack

> **Status:** Stable
>
> **Version:** 1.0
>
> **Referenced By:** Users, Projects, Hackathons, Blogs
>
> **Last Updated:** 2026-07-18

---

# Purpose

The Tech Stack model represents reusable technologies that can be associated with builders, projects, blogs, and hackathons.

Instead of allowing free-text technology names, Kizunia maintains a centralized catalog of technologies.

This ensures consistency across search, filtering, recommendations, and analytics.

---

# Design Philosophy

Technology names should be standardized.

For example, these should all refer to the same technology:

- React
- react
- ReactJS
- react.js

Instead of storing user-provided strings, entities reference a reusable Tech Stack entry.

This eliminates duplicates and improves discoverability.

---

# Responsibilities

The Tech Stack model is responsible for:

- Technology identity
- Technology metadata
- Icons
- Categorization

The Tech Stack model is **not** responsible for:

- Skill levels
- User experience
- Project ownership

---

# Fields

| Field | Required | Unique | Description |
|--------|----------|--------|-------------|
| id | Yes | Yes | Primary identifier |
| name | Yes | Yes | Display name |
| slug | Yes | Yes | URL-safe identifier |
| icon | No | No | Technology icon |
| category | Yes | No | Classification |
| website | No | No | Official website |
| createdAt | Yes | No | Creation timestamp |
| updatedAt | Yes | No | Last modification timestamp |

---

# Categories

Each technology belongs to one category.

Examples include:

- Programming Language
- Frontend Framework
- Backend Framework
- Mobile
- Database
- Cloud
- AI / ML
- DevOps
- Design
- Game Development
- Blockchain
- Testing

Categories help users browse technologies and improve filtering.

---

# Relationships

A Tech Stack entry may be referenced by:

## Users

Represents technologies a builder is familiar with.

---

## Projects

Represents technologies used to build the project.

---

## Blogs

Represents technologies discussed within the blog.

---

## Hackathons

Represents technologies encouraged or supported by the event.

---

# Icons

Each technology may have an associated icon.

Examples:

- React
- Next.js
- Flutter
- Prisma
- Java

Icons improve recognition throughout the platform.

---

# Search

Tech Stack entries should be searchable by:

- Name
- Category

Search should ignore capitalization.

---

# Validation

Every technology should:

- Have a unique name.
- Have a unique slug.
- Belong to exactly one category.

Duplicate technologies should never exist.

---

# Administration

Tech Stack entries are platform-managed.

Users cannot create arbitrary technologies.

Platform Owners and Administrators maintain the catalog.

This ensures consistency across the platform.

Future versions may allow users to suggest technologies for review.

---

# Design Decisions

## Why a Central Catalog?

A shared catalog eliminates duplicate spellings and naming inconsistencies.

It also enables reliable search, recommendations, and filtering.

---

## Why Categories?

Categories make browsing and filtering easier.

They also improve notification personalization.

---

## Why Platform Managed?

Allowing unrestricted user-created technologies would quickly lead to duplicate entries and inconsistent naming.

Maintaining a curated catalog keeps the platform clean.

---

# Future Expansion

Potential future capabilities include:

- Aliases
- Deprecation
- Popularity metrics
- Official documentation links
- Learning resources

These features should extend the model without changing its core philosophy.

---

# Guiding Principle

The Tech Stack model should answer one question:

> **Which technologies are being used or discussed?**

It should provide a consistent vocabulary for the entire platform.