# Kizunia Project Documentation

Welcome to the official project documentation for **Kizunia web**.

This directory contains the planning, product, and design documentation that defines how Kizunia web is built. These documents serve as the single source of truth for the project and should be referenced before making significant product or architectural decisions.

---

# Purpose

The goal of this documentation is to ensure that every contributor understands not only **what** Kizunia web is, but also **why** it is being built.

Rather than documenting implementation details, these documents focus on the product itself—its vision, philosophy, features, and long-term direction.

As the project evolves, this documentation will evolve alongside it.

---

# Documentation Philosophy

Kizunia follows a simple rule:

> **Documentation records decisions; it does not invent them.**

A document is only created after the corresponding design decisions have been made.

This prevents outdated documentation, unnecessary specifications, and assumptions that no longer reflect the product.

---

# Reading Order

For the best understanding of the project, read the documents in the following order.

| Order | Document                   | Description                                                                         |
| ----- | -------------------------- | ----------------------------------------------------------------------------------- |
| 1     | `overview.md`              | Introduction to Kizunia, its mission, vision, and overall purpose.                  |
| 2     | `product-vision.md`        | Product goals, MVP scope, priorities, and long-term direction.                      |
| 3     | `core-principles.md`       | Fundamental design philosophies and guiding principles used throughout the project. |
| 4     | `feature-specification.md` | Detailed specification of every feature included in the current version of Kizunia. |

Additional documentation will be added as the project matures.

---

# Current Documentation Scope

The current documentation focuses on the **product planning phase**.

Topics currently covered include:

- Project overview
- Product vision
- Design principles
- Feature specifications

Topics that will be documented in future phases include:

- Domain model
- Database design
- User flows
- Permissions
- System architecture
- API design
- Deployment strategy
- Development guidelines

These documents will only be created after their designs have been finalized.

---

# Guiding Principles

When contributing to Kizunia, keep the following principles in mind:

- Prioritize solving real student problems.
- Keep the product modular and easy to extend.
- Avoid unnecessary complexity.
- Design for flexibility rather than rigid workflows.
- Preserve meaningful work instead of creating temporary experiences.
- Make every feature align with the core mission of the platform.

If a proposed feature conflicts with these principles, it should be reconsidered before implementation.

---

# Contributing to Documentation

Documentation should be updated whenever a significant product or architectural decision is made.

When modifying existing documents:

- Preserve the intent of previous decisions unless the team has agreed to change them.
- Keep explanations concise but complete.
- Document _why_ a decision was made, not just _what_ was decided.
- Avoid implementation details unless the document specifically focuses on technical design.
- Maintain consistency across all documentation.

---

# Status

This documentation is considered a living document.

As Kizunia grows, new documents will be introduced to describe additional aspects of the platform while maintaining this documentation structure.
