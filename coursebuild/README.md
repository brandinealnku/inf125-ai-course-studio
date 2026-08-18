# CourseBuild

Course architecture → working LMS.

CourseBuild is an ITSBAD Labs product that turns structured course plans into reviewable, publishable LMS content without hard-coding a specific institution or course.

## MVP goal

An instructor with a new course should be able to:

1. Create a course profile.
2. Add learning outcomes and delivery rules.
3. Define or import modules.
4. Generate Canvas-ready pages, assignments, and discussions.
5. Review and approve every generated item.
6. Preview the intended Canvas build.
7. Publish approved content through a secure backend.
8. Create another delivery version without rebuilding from scratch.

## Product architecture

- `index.html` / `styles.css` / `app.js`: browser-based pilot UX.
- `sample-course.js`: institution-neutral sample data.
- `apps-script-backend.gs`: pilot secure backend for Gemini + Canvas.
- Course-specific information lives in a Course Profile, not in product code.
- Canvas is the first LMS connector, not the definition of the product.

## Core concepts

### Course Profile

A profile contains course identity, description, outcomes, policies, audience, delivery mode, tone, and optional institution metadata.

### Course Plan

A plan contains modules and intended LMS objects. Each item moves through:

`Planned → Draft → Needs Review → Approved → Ready → Sent`

### Human approval gate

CourseBuild never sends generated content to Canvas until the instructor explicitly approves it.

### Versions

A master course may have multiple delivery versions such as:

- In Person
- Online
- Hybrid
- Accelerated
- Partner / Licensed
- Custom

Versions inherit from the master while tracking customization and sync state.

## Pilot deployment

The MVP keeps the proven prototype architecture:

GitHub Pages → Google Apps Script → Gemini / Canvas APIs

Secrets must remain server-side in Apps Script Script Properties:

- `GEMINI_API_KEY`
- `CANVAS_API_TOKEN`
- `CANVAS_BASE_URL`

This pilot architecture is intentionally replaceable by a managed multi-tenant backend before institutional SaaS deployment.

## Productization boundary

The original INF 125 implementation remains outside this folder as the historical prototype and reference implementation. CourseBuild must not depend on INF 125, NKU, WE Lead CS, fixed SLOs, or fixed delivery versions.
