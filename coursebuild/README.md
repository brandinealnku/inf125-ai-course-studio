# CourseBuild

**Course architecture → working LMS.**

CourseBuild is the generalized product layer extracted from the INF 125 Canvas Content Builder prototype. The original course-specific implementation remains intact outside this folder.

## Pilot workflow

1. Define a reusable Course Profile.
2. Import a syllabus/course plan by paste, text-family file, or PDF.
3. Generate a proposed module + LMS-object architecture.
4. Generate source-grounded content for planned items.
5. Review and explicitly approve each item.
6. Run the readiness audit.
7. Build or update approved items in Canvas.

## v0.3

### File import

- `.txt`, `.md`, `.csv`, `.html`, and `.htm` files are read locally in the browser and retained as source text.
- PDFs are sent as base64 to the configured Apps Script backend and passed to Gemini as `application/pdf` inline data.
- The PDF architecture response includes a reusable `sourceDigest`, module proposal, and planned LMS items.
- The browser pilot intentionally caps PDFs at 8 MB to keep Apps Script transport predictable.

### Source grounding

Architecture generation and item generation receive the Course Profile plus imported source/source digest. Prompts explicitly prohibit inventing institutional policies, required readings, dates, grading rules, outcomes, and assessments not supported by the supplied source.

### Safe Canvas publishing

Every planned item gets a stable CourseBuild key based on course code + CourseBuild item id. CourseBuild embeds that key in created Canvas content. On a later build it searches for an existing CourseBuild-created item and updates it rather than blindly creating another item.

The Canvas connector also checks whether the content is already attached to its module before adding another module item.

**Instructor approval remains mandatory.** `publishItem` rejects anything whose status is not `Approved`.

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

`.github/workflows/coursebuild-checks.yml` performs syntax and structural smoke checks for the pilot on pushes/PRs that change CourseBuild.

## Next likely product slice

- Instructor editing of proposed modules/items before generation
- Version generation + master/version sync
- Pilot telemetry and benchmark capture
- Managed multi-course persistence
- Canvas OAuth after product validation
