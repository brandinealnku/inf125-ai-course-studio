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
9. Review Pilot Evidence to measure time, edits, approvals, failures, and Canvas create/update behavior.

## v0.6 — Pilot evidence + benchmark capture

CourseBuild now records local pilot telemetry so product validation can be based on observed workflow evidence rather than impressions.

### Captured events

- Source import
- Architecture generation time
- Architecture edits
- Architecture approval cycles
- LMS item generation time
- Item approvals
- Delivery-version generation
- Version approvals
- Canvas create/update operations
- Failures

Telemetry stays in browser `localStorage` for the pilot. CourseBuild does not send this data to third-party analytics services.

### Benchmark model

The Pilot Evidence view includes editable manual-time assumptions for architecture work, LMS item drafting/review, Canvas assembly, and version adaptation. CourseBuild compares those assumptions with measured workflow/API time to produce an **estimated time avoided** figure.

The defaults are pilot assumptions, not product claims. They should be replaced with observed manual baselines during structured testing before being used in marketing, pricing, or ROI claims.

### Export

The pilot can export a JSON evidence report containing the course identifier, summary metrics, benchmark assumptions, and event log for later analysis.

## v0.5 — Master course → delivery versions

CourseBuild treats one approved course as the authoritative master and stores delivery variants as traceable differences rather than disconnected copies.

Each approved master architecture receives a revision. Generated delivery versions record the master revision they were based on. If the master architecture changes, previously generated variants are marked **Out of Sync** and any version approval is invalidated.

Built-in variants are Online, In-Person, and Accelerated. Each includes editable adaptation rules, explicit differences from Master, generation time, approval state, and base master revision.

## v0.4 — Editable architecture + architecture approval

CourseBuild treats AI-generated LMS structure as a proposal. Instructors can rename/reorder modules, add/delete modules and LMS items, change Page/Assignment/Discussion types, and edit titles, purposes, and points. Any architecture edit resets approval.

CourseBuild uses two explicit human gates: architecture approval and item approval. The browser and backend both enforce architecture approval, and Canvas publishing also requires individual item approval.

## v0.3 — File import + safer Canvas publishing

- `.txt`, `.md`, `.csv`, `.html`, and `.htm` files can be imported.
- PDFs are sent to the configured secure Apps Script backend for Gemini document understanding.
- A reusable source digest grounds downstream generation.
- Stable CourseBuild keys let repeat builds update CourseBuild-created Canvas objects instead of blindly duplicating them.
- Module membership is checked before another module item is added.

## Architecture

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `app.js`, `versions.js`, `telemetry.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API, with PDF document understanding and structured architecture output
- LMS: Canvas REST API
- Browser persistence: `localStorage` for course state and pilot telemetry

## Product boundary

The pilot is not yet institutional SaaS. It does not yet provide multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, production-grade audit logging, or direct version publishing to multiple Canvas shells. Pilot telemetry is local-only and should not be treated as a production analytics architecture.

## Automated checks

`.github/workflows/coursebuild-checks.yml` checks browser JavaScript syntax, version and telemetry syntax, Apps Script syntax, approval gates, PDF import, Canvas idempotency, version synchronization, telemetry events, benchmark calculation, and evidence export contracts.

## Next likely product slice

- Direct delivery-version materialization into separate Canvas shells after approval
- Structured pilot protocol and benchmark template using exported telemetry
- Managed multi-course persistence
- Canvas OAuth after product validation
