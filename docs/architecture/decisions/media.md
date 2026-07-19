# Media

## Status

Accepted

---

# Context

Media is an important part of project showcases and documentation.

Different types of media have different storage and performance characteristics.

---

# Decision

Kizunia distinguishes between **identity media** and **content media**.

Identity media is managed by the platform.

Content media may be hosted by either Kizunia or external providers.

Videos are not uploaded directly to Kizunia.

---

# Identity Media

Examples include:

- Avatar
- Logo
- Banner
- Cover Image

These should generally be uploaded to platform-managed Cloudinary.

---

# Content Media

Examples include:

- Project screenshots
- Architecture diagrams
- Demo videos
- Gallery images
- Documentation images

Users may reference:

- Google Drive
- Public image URLs
- YouTube

---

# MDX

The MDX editor should support embedding external media using URLs.

This allows builders to create rich project documentation without requiring Kizunia to host all assets.

---

# Rationale

Separating identity media from content media keeps storage costs manageable while preserving flexibility for contributors.

---

# Design Principles

- Images are first-class citizens.
- Videos should be embedded rather than uploaded.
- Users decide where most content is hosted.
- Kizunia hosts only what it must own.

---

# Future Considerations

Future providers may include:

- Vimeo
- Loom
- GitHub Assets

The storage architecture should remain provider-agnostic.