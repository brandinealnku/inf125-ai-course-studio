# CourseBuild

**Course architecture → working LMS.**

CourseBuild is the generalized product layer extracted from the INF 125 Canvas Content Builder prototype. The original course-specific implementation remains intact outside this folder.

## Pilot workflow

1. Define a reusable Course Profile.
2. Import a syllabus/course plan by paste, text-family file, or PDF.
3. Generate a proposed module + LMS-object architecture.
4. Edit the proposed architecture: rename/reorder modules, add/delete LMS items, change item types, purposes, and points.
5. Explicitly approve the architecture.
6. Generate source-grounded content for approved architecture items.
7. Review and explicitly approve each generated item.
8. Run the readiness audit.
9. Build or update approved items in Canvas.

## v0.4 — Editable architecture + architecture approval

CourseBuild now treats the generated LMS structure as a proposal rather than an implicit decision. Instructors can edit the blueprint before any content is generated.

### Architecture editing

- Rename modules.
- Reorder modules.
- Add or delete modules.
- Add or delete LMS items.
- Change an item among Page, Assignment, and Discussion.
- Edit item title, purpose, and points.

Any architecture edit resets architecture approval. Approved content that depended on the old structure is moved back to review where appropriate.

### Two-stage human gate

CourseBuild now requires two explicit approvals:

1. **Architecture approval** — confirms the planned module and LMS-object structure.
2. **Item approval** — confirms each generated content object.

The browser blocks generation until architecture approval, and the Apps Script backend independently rejects both content generation and Canvas publishing when `architectureApproved` is not true. Canvas publishing still also rejects any item whose status is not `Approved`.

## v0.3 — File import + safer Canvas publishing

- `.txt`, `.md`, `.csv`, `.html`, and `.htm` files can be imported.
- PDFs are sent to the configured secure Apps Script backend for Gemini document understanding.
- A reusable source digest grounds downstream generation.
- Stable CourseBuild keys let repeat builds update CourseBuild-created Canvas objects instead of blindly duplicating them.
- Module membership is checked before another module item is added.

## Architecture

- Static pilot UI: `index.html`, `styles.css`, `app.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API, with PDF document understanding and structured architecture output
- LMS: Canvas REST API
- Browser persistence: `localStorage` for pilot state only

## Apps Script properties

Configure these only in Apps Script Script Properties:

```text
GEMINI_API_KEY
GEMINI_MODEL        # optional; defaults to gemini-2.5-flash
CANVAS_API_TOKEN
CANVAS_BASE_URL
```

Never place API keys or Canvas tokens in GitHub Pages or browser localStorage.

## Backend actions

```text
generateCourseArchitecture
importPdfArchitecture
generateItem
publishItem
```

## Product boundary

The pilot is not yet institutional SaaS. It does not yet provide multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, or production-grade audit logging. Those should follow validation rather than precede it.

## Automated checks

`.github/workflows/coursebuild-checks.yml` checks browser JavaScript syntax, Apps Script syntax, required product contracts, architecture editing controls, architecture approval enforcement, item approval enforcement, PDF import, and Canvas idempotency markers.

## Next likely product slice

- Master course → Online / In-Person / Accelerated version generation
- Version differences, approval, and out-of-sync tracking
- Pilot telemetry and benchmark capture
- Managed multi-course persistence
- Canvas OAuth after product validation
