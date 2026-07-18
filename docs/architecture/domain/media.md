# Media

> **Status:** Stable
>
> **Version:** 1.0
>
> **Referenced By:** Users, Projects, Teams, Hackathons, Blogs, Portfolios
>
> **Last Updated:** 2026-07-18

---

# Purpose

The Media model represents visual assets associated with entities across Kizunia.

Media provides a reusable way to attach images to users, projects, teams, hackathons, blogs, and future entities.

The platform intentionally limits uploaded media to images.

Videos should be referenced using external links instead of being uploaded directly.

---

# Design Philosophy

Media should represent assets owned by the platform.

Images improve presentation and documentation.

Videos consume significant storage and bandwidth while providing little additional value when platforms such as YouTube and Google Drive already solve this problem well.

Kizunia should store only what it needs to own.

---

# Responsibilities

The Media model is responsible for:

- Image storage
- Image metadata
- Display ordering
- Asset classification

The Media model is **not** responsible for:

- Video hosting
- File storage beyond images
- Rich embeds

---

# Fields

| Field | Required | Description |
|--------|----------|-------------|
| id | Yes | Primary identifier |
| url | Yes | Cloudinary image URL |
| type | Yes | Purpose of the image |
| alt | No | Accessibility text |
| caption | No | Optional image caption |
| order | Yes | Display order |
| createdAt | Yes | Creation timestamp |
| updatedAt | Yes | Last modification timestamp |

---

# Image Types

Every image has a purpose.

Supported types include:

- Avatar
- Banner
- Logo
- Gallery
- Thumbnail
- Cover

Future image types may be added without changing the overall architecture.

---

# Storage

Images are uploaded to Cloudinary.

The database stores only the resulting URL and metadata.

Binary image data is never stored inside the database.

---

# Relationships

Media may belong to:

- User
- Project
- Team
- Hackathon
- Blog
- Portfolio

A media item belongs to exactly one parent entity.

---

# Gallery

Entities may contain multiple gallery images.

Gallery ordering is determined using the `order` field.

Example:

1. Home Screen
2. Dashboard
3. Settings
4. Analytics

---

# Banner

Most public entities support a single banner image.

Examples include:

- User Profile
- Project
- Team
- Hackathon
- Blog

The banner is typically displayed at the top of the page.

---

# Logo

Some entities support a logo.

Examples include:

- Team
- Project
- Hackathon

A logo represents the identity of the entity rather than its content.

---

# Avatar

Avatars are currently used only by Users.

Future entities may also support avatars if appropriate.

---

# Accessibility

Images should support optional alternative text.

Alternative text improves accessibility for screen readers and also improves SEO.

---

# Validation

Uploaded images should satisfy platform constraints.

Examples include:

- Supported image formats
- Maximum dimensions
- Maximum file size

The exact limits should remain configurable.

---

# Design Decisions

## Why Separate Media?

Without a reusable Media model, every entity would require dedicated image fields and duplicate image management logic.

A shared Media entity keeps the platform consistent while remaining simple.

---

## Why Only Images?

Images are relatively inexpensive to store.

Videos are significantly larger and are already well supported by external platforms.

Instead of hosting videos directly, Kizunia encourages linking to:

- YouTube
- Google Drive
- Vimeo (future)
- Loom (future)

using the reusable Link model.

---

## Why Store URLs?

Cloudinary already provides reliable image hosting.

Duplicating image storage inside the database would increase complexity without providing meaningful benefits.

The database stores references rather than image files.

---

## Why Ordering?

Entities often contain multiple gallery images.

The display order should always be controlled by the owner rather than automatically determined.

---

# Future Expansion

Potential future capabilities include:

- Automatic image optimization
- Blur placeholders
- Responsive image variants
- Image moderation
- AI-generated alt text
- Image cropping

These features should extend the Media model without changing its core philosophy.

---

# Guiding Principle

The Media model should answer one question:

> **Which visual assets belong to this entity?**

It should remain focused on lightweight image management while leaving video hosting and other large media formats to specialized external platforms.