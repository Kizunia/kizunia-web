# Project

> **Status:** Stable
>
> **Version:** 1.0
>
> **Referenced By:** Users, Teams, Hackathons, Portfolios, Blogs
>
> **Last Updated:** 2026-07-18

---

# Purpose

The Project model represents an engineering project on Kizunia.

A project is the primary artifact produced by builders.

Projects exist independently of hackathons, teams, or organizations.

They represent real engineering work and serve as the foundation of portfolios, collaboration, and project discovery.

---

# Design Philosophy

A project should model the real world.

Projects should not be tightly coupled to GitHub repositories, hackathons, or deployments.

Instead, those should simply become relationships.

A project should remain valid even if:

- it has no GitHub repository,
- it has never been deployed,
- it was never part of a hackathon,
- it was built by a single person,
- it is still under development.

This flexibility allows Kizunia to represent projects rather than competitions.

---

# Responsibilities

The Project model is responsible for:

- Project identity
- Public metadata
- Ownership
- Collaboration
- Documentation
- Media
- External links
- Technologies
- Categories
- Visibility
- Verification

The Project model is **not** responsible for:

- Portfolio customization
- Team management
- Hackathon management
- User profiles

---

# Identity

Identity uniquely defines the project.

| Field | Required | Unique | Description |
|--------|----------|--------|-------------|
| id | Yes | Yes | Primary identifier. |
| title | Yes | No | Public project title. |
| slug | Yes | Yes | Human-readable URL identifier. |
| shortDescription | Yes | No | Short summary used throughout the platform. |

---

# Slug

Project URLs follow the format:

```
/projects/{slug}
```

Example:

```
/projects/kizunia-web

/projects/diya

/projects/smart-parking
```

## Rules

- Unique
- Editable
- Lowercase
- Letters
- Numbers
- Hyphen
- Reserved slugs prohibited

---

# Metadata

Metadata allows projects to be discovered and filtered.

| Field | Required | Description |
|--------|----------|-------------|
| visibility | Yes | Public / Unlisted / Private |
| status | Yes | Draft / Published |
| verification | No | Relationship to Verification |
| createdAt | Yes | Creation timestamp |
| updatedAt | Yes | Last modification timestamp |

---

# Documentation

Every project owns exactly one documentation page.

Documentation is stored as Markdown / MDX.

The documentation represents everything that is difficult to model as structured data.

Examples include:

- Overview
- Architecture
- Features
- Database Design
- API Documentation
- Screenshots
- Demo Videos
- Lessons Learned
- Future Improvements

Documentation should never contain information that needs to be queried by the application.

Structured information belongs in dedicated fields.

---

# Technologies

Projects reference reusable Technology entities.

Examples:

- React
- Next.js
- Flutter
- Java
- Spring Boot
- TensorFlow

Using relationships instead of free text ensures consistency across search and recommendations.

---

# Categories

Projects belong to one or more categories.

Examples:

- AI
- Web Development
- Mobile
- Cybersecurity
- Healthcare
- IoT

Categories improve discoverability.

---

# Media

Projects may contain media.

Media is represented through the reusable Media entity.

Examples include:

- Banner
- Logo
- Gallery Images
- Thumbnail

Videos should not be uploaded directly.

Instead, projects should reference external video platforms through Links.
(this is yet to be finalized)

---

# Links

Projects support multiple external links.

Examples include:

- GitHub Repository
- Live Demo
- Figma
- YouTube
- Google Drive
- Play Store
- App Store
- Documentation
- Discord

Links are represented using the reusable Link entity.

---

# Ownership

Ownership determines who manages the project.

Instead of storing multiple relationship arrays, ownership is represented through a ProjectMember relationship.

Each user has exactly one role within a project.

Possible roles include:

- Owner
- Maintainer
- Contributor

This ensures a single source of truth for project membership.

---

# Owner

Owners have complete control.

Examples:

- Edit project
- Delete project
- Manage permissions
- Transfer ownership
- Manage maintainers

---

# Maintainer

Maintainers assist in managing the project.

Examples:

- Edit project information
- Edit documentation
- Manage contributors

Maintainers cannot transfer ownership or delete the project.

---

# Contributor

Contributors represent builders who worked on the project.

Contributors appear publicly on the project page.

Contributors cannot modify project metadata unless granted a higher role.

---

# Team Relationship

Projects may optionally belong to a Team.

Projects are never required to have a team.

Individual builders can create projects independently.

---

# Hackathon Relationship

Projects may optionally be associated with a Hackathon.

This relationship represents that the project participated in a hackathon.

Projects remain valid after the hackathon ends.

Removing the hackathon relationship should never delete or invalidate the project.

---

# Verification

Projects may receive verification.

Verification confirms authenticity rather than popularity.

Examples include:

- Verified Project
- Official Submission

Verification is represented using the reusable Verification entity.

---

# Visibility

Projects support three visibility levels.

- Public
- Unlisted
- Private

Visibility affects discoverability but not ownership.

---

# Search

Projects should be searchable using structured metadata.

Examples include:

- Title
- Technologies
- Categories
- Owners
- Team
- Hackathon

Documentation should not be relied upon as the primary search source.

---

# Design Decisions

## Why Separate Documentation?

Structured information should remain queryable.

Long-form explanations should remain flexible.

Keeping these concerns separate simplifies both the database and the editor.

---

## Why ProjectMember?

Instead of maintaining multiple arrays such as:

- owners
- maintainers
- contributors

Kizunia represents membership through a single ProjectMember relationship.

Each user has exactly one role within a project.

This eliminates duplication while keeping permissions simple.

---

## Why Optional Team and Hackathon Relationships?

Projects are first-class entities.

They should never depend on another entity for their existence.

This allows Kizunia to support personal projects, hackathon projects, research projects, and open-source projects using the same model.

---

## Why External Videos?

Video hosting is intentionally delegated to external platforms such as:

- YouTube
- Google Drive

Images may be uploaded through Cloudinary.

This keeps infrastructure costs manageable while still allowing rich project documentation.

---

# Future Expansion

Potential future capabilities include:

- Version history
- Releases
- Changelog
- Project milestones
- Project analytics
- Dependency graph

These should extend the project model without changing its core philosophy.

---

# Guiding Principle

The Project model should answer one question:

> **What is this engineering project?**

It should not attempt to answer:

> **Who built it?**

> **Where was it built?**

> **How is it showcased?**

Those concerns belong to relationships with Users, Teams, Hackathons, Portfolios, and other supporting entities.