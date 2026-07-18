# Portfolio

> **Status:** Stable
>
> **Version:** 1.0
>
> **Referenced By:** Users
>
> **Last Updated:** 2026-07-18

---

# Purpose

The Portfolio model represents the public engineering profile of a builder.

Unlike a traditional portfolio website, a Kizunia Portfolio does not own projects, blogs, or teams.

Instead, it customizes how those entities are presented.

The portfolio acts as the public face of a builder while the actual engineering work continues to exist as independent entities.

---

# Design Philosophy

A portfolio should be generated from real work.

Builders should spend time building rather than maintaining portfolios.

The portfolio therefore serves as a presentation layer rather than a storage layer.

Projects remain Projects.

Blogs remain Blogs.

Teams remain Teams.

The portfolio simply decides what should be highlighted.

---

# Responsibilities

The Portfolio model is responsible for:

- Public portfolio configuration
- Featured content
- Portfolio introduction
- Portfolio visibility
- Presentation preferences

The Portfolio model is **not** responsible for:

- Owning projects
- Owning blogs
- Owning teams
- Managing relationships
- Duplicating information

---

# Ownership

Every User owns exactly one Portfolio.

A Portfolio cannot exist without a User.

Likewise, every authenticated builder automatically receives a portfolio.

Portfolio creation should happen automatically during user onboarding.

---

# Identity

Unlike other entities, Portfolios do not require slugs.

Portfolio URLs always use the builder's username.

```
/u/{username}
```

Examples:

```
/u/ishankulkarni13

/u/john

/u/sarah-dev
```

---

# Customization

The Portfolio stores only information that cannot be derived automatically.

Examples include:

| Field | Description |
|------|-------------|
| introduction | Custom introduction shown near the top of the portfolio |
| featuredProjects | Ordered list of highlighted projects |
| featuredBlogs | Ordered list of highlighted blogs |
| featuredTeams | Ordered list of highlighted teams |

Everything else should be generated from relationships.

---

# Introduction

Builders may write a custom introduction.

The introduction should answer questions such as:

- Who am I?
- What do I enjoy building?
- What am I currently working on?

The introduction complements the User bio rather than replacing it.

---

# Featured Projects

Builders may choose projects to highlight.

Featured projects appear before the complete project list.

Feature ordering should be manually controlled.

Featured projects remain normal projects.

The portfolio only changes presentation.

---

# Featured Blogs

Builders may highlight important blog posts.

Examples include:

- Engineering articles
- Project write-ups
- Tutorials
- Hackathon experiences

Featured blogs should appear before the complete list of blogs.

---

# Featured Teams

Builders may choose to highlight important teams.

Examples include:

- Open Source Team
- SIH Team
- Research Group

Feature ordering should be configurable.

---

# Visibility

Portfolios support three visibility levels.

- Public
- Unlisted
- Private

Visibility affects the entire portfolio rather than individual projects.

Projects continue using their own visibility rules.

---

# Generated Content

The following information should always be generated automatically.

Examples include:

- Complete Project List
- Complete Blog List
- Complete Team List
- Verification Badges
- Technologies
- Statistics
- Recent Activity

The Portfolio should never duplicate this information.

---

# Statistics

Portfolio statistics should be computed.

Examples include:

- Projects
- Teams
- Blogs
- Technologies
- Hackathons

Statistics should never be stored directly inside the Portfolio.

---

# Verification

Verification is inherited from the User.

The Portfolio does not maintain separate verification information.

---

# Search

Portfolios should be searchable using:

- Username
- Display Name
- Headline
- Technologies
- Featured Projects

Search should rely on structured data rather than parsing introductions.

---

# Design Decisions

## Why a Separate Portfolio Model?

A dedicated Portfolio model cleanly separates identity from presentation.

The User model represents the builder.

The Portfolio model represents how that builder is showcased.

This separation keeps both models focused on their own responsibilities.

---

## Why No Slug?

Portfolio URLs already use usernames.

Adding another slug would duplicate functionality.

---

## Why Generated Content?

Projects, blogs, teams, and statistics already exist elsewhere.

Duplicating them would introduce synchronization problems.

Instead, the Portfolio references them through relationships and presentation settings.

---

## Why Store Featured Items?

Featured ordering cannot be derived automatically.

Storing only the curated lists allows the portfolio to remain highly customizable while avoiding unnecessary duplication.

---

# Future Expansion

Potential future capabilities include:

- Portfolio themes
- Custom color accents
- Custom sections
- Resume export
- PDF generation
- Portfolio analytics
- Custom domains

These features should extend the Portfolio model without changing its core philosophy.

---

# Guiding Principle

The Portfolio model should answer one question:

> **How should this builder's work be presented?**

It should never become the source of truth for projects, teams, blogs, or achievements.

Those entities continue to own their own data.

The Portfolio simply curates and presents them in a meaningful way.