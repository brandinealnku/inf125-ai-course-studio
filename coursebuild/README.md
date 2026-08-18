# CourseBuild

**Course architecture → working LMS.**

CourseBuild is the generalized product layer extracted from the INF 125 Canvas Content Builder prototype. The original course-specific implementation remains intact outside this folder.

## Pilot workflow

1. Define a reusable Course Profile.
2. Import a syllabus/course plan by paste, text-family file, or PDF.
3. Generate and edit a proposed module + LMS-object architecture.
4. Explicitly approve the master architecture.
5. Generate source-grounded content and approve each item.
6. Run the readiness audit and build/update approved Canvas items.
7. Generate Online, In-Person, and Accelerated delivery plans from the approved master.
8. Review the explicit differences and approve each delivery version.
9. When the master changes, regenerate any version marked Out of Sync.

## v0.5 — Master course → delivery versions

CourseBuild now treats one approved course as the authoritative master and stores delivery variants as traceable differences rather than disconnected copies.

### Master revision lifecycle

Each approved master architecture receives a revision. Generated delivery versions record the master revision they were based on. If the master architecture changes, previously generated variants are marked **Out of Sync** and any version approval is invalidated.

### Built-in delivery variants

- **Online** — asynchronous navigation, completion guidance, online interaction expectations, and discussion adjustments.
- **In-Person** — live activity/facilitation guidance and between-class follow-up.
- **Accelerated** — compressed pacing while preserving learning outcomes and assessment purpose.

Each version includes editable adaptation rules, a generated list of differences from Master, generation time, approval state, and base master revision.

### Version approval

A version cannot be approved until it has been generated from the current master. Editing its adaptation rules returns it to review. Readiness also checks that any approved versions are still based on the current master.

The pilot stores version plans as structured deltas and master snapshots in browser state. It intentionally does not yet publish delivery variants into separate Canvas course shells; that should follow validation of the version model.

## v0.4 — Editable architecture + architecture approval

CourseBuild treats AI-generated LMS structure as a proposal. Instructors can rename/reorder modules, add/delete modules and LMS items, change Page/Assignment/Discussion types, and edit titles, purposes, and points. Any architecture edit resets approval.

CourseBuild uses two explicit human gates:

1. **Architecture approval** — confirms the module and LMS-object structure.
2. **Item approval** — confirms each generated content object.

The browser and backend both enforce architecture approval, and Canvas publishing also requires individual item approval.

## v0.3 — File import + safer Canvas publishing

- `.txt`, `.md`, `.csv`, `.html`, and `.htm` files can be imported.
- PDFs are sent to the configured secure Apps Script backend for Gemini document understanding.
- A reusable source digest grounds downstream generation.
- Stable CourseBuild keys let repeat builds update CourseBuild-created Canvas objects instead of blindly duplicating them.
- Module membership is checked before another module item is added.

## Architecture

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `app.js`, `versions.js`, `sample-course.js`
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

The pilot is not yet institutional SaaS. It does not yet provide multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, production-grade audit logging, or direct version publishing to multiple Canvas shells. Those should follow validation rather than precede it.

## Automated checks

`.github/workflows/coursebuild-checks.yml` checks browser JavaScript syntax, version-workflow syntax, Apps Script syntax, architecture and item approval gates, PDF import, Canvas idempotency, delivery modes, version approval controls, master revision linkage, explicit difference rendering, and Out-of-Sync tracking.

## Next likely product slice

- Pilot telemetry and benchmark capture: time saved, edits required, generation success, publish/update operations
- Direct delivery-version materialization into separate Canvas shells after approval
- Managed multi-course persistence
- Canvas OAuth after product validation
