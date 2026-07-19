# Storage

## Status

Accepted

---

# Context

Projects and hackathons may contain a significant amount of media.

Storing all assets inside Kizunia would unnecessarily increase storage costs.

---

# Decision

Kizunia separates storage into two categories.

### Identity Assets

Stored using platform-managed Cloudinary.

Examples:

- Profile avatars
- Project logos
- Project banners
- Team logos
- Team banners
- Hackathon logos
- Hackathon banners

### Content Assets

Users may choose where these assets are hosted.

Supported sources include:


- Google Drive
- Public Image URLs
- YouTube
- Future providers
- kizunia web wount store it , beacause we need to keep the storage resources low for cost and buget

---

# Rationale

Identity assets are small, frequently displayed and define the visual identity of an entity.

Content assets can become large and are therefore delegated to external providers whenever possible.

This keeps infrastructure costs predictable while giving builders flexibility.

---

# Design Principles

- Give users choice.
- Avoid vendor lock-in.
- Keep hosting costs sustainable.
- Prefer external video hosting.

---

# Consequences

## Advantages

- Lower infrastructure costs.
- Greater flexibility.
- Easier migration in the future.

## Trade-offs

- External links may become unavailable.
- Users are responsible for managing externally hosted content.