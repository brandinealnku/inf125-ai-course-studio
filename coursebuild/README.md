# CourseBuild

**Course architecture → working LMS.**

CourseBuild is the generalized product layer extracted from the INF 125 Canvas Content Builder prototype. The original course-specific implementation remains intact outside this folder.

## Pilot workflow

1. Define a reusable Course Profile.
2. Import a syllabus/course plan by paste, text-family file, or PDF.
3. Generate and edit a proposed module + LMS-object architecture.
4. Explicitly approve the master architecture.
5. Generate source-grounded content and approve each item.
6. Build/update approved Master items in Canvas.
7. Generate Online, In-Person, and Accelerated delivery plans from the approved master.
8. Review the differences and approve each delivery version.
9. Enter a separate target Canvas Course ID and run a dry-run preview.
10. Materialize the approved version into that target Canvas shell.
11. Run read-only reconciliation against the target shell.
12. Run the guided External Pilot protocol and export a standardized evidence package.

## v0.9 — Structured external pilot

CourseBuild now includes a guided product-validation workflow for testing with instructors, instructional designers, or academic administrators outside the original build context.

### Participant setup and privacy boundary

The External Pilot captures a participant name/code, role, institution, discipline, and Canvas experience. The participant must acknowledge the pilot boundary before completion: use non-sensitive course material only, and do not enter student records, grades, protected student information, API keys, or secrets.

Pilot data remains in browser `localStorage` until the participant chooses to export it.

### Manual baseline

Before completing the workflow, the participant records their own estimated manual effort for:

- course architecture/planning,
- drafting/reviewing an LMS item,
- Canvas assembly per item,
- delivery-version adaptation per item.

Those participant-supplied values can feed the existing Pilot Evidence benchmark model. They are explicitly treated as baselines/assumptions rather than CourseBuild performance claims.

### Guided tasks

The standard protocol contains seven tasks:

1. Capture the manual baseline.
2. Import a real course source.
3. Review and approve the architecture.
4. Generate and approve content.
5. Build or preview Canvas.
6. Try one delivery version.
7. Complete the pilot reflection.

Each task records status plus start/completion timestamps.

### Reflection

The post-task reflection captures 1–5 ratings for usefulness, ease, control, and confidence plus willingness to use CourseBuild again, willingness to recommend a pilot, most valuable capability, biggest friction, missing functionality, and free-form notes.

### Standardized evidence export

`Export pilot evidence JSON` produces a `coursebuild-pilot-evidence-v1` package combining:

- participant/pilot metadata,
- manual baseline,
- guided-task status and timestamps,
- qualitative/quantitative feedback,
- course summary,
- delivery-version/materialization/reconciliation summaries,
- local CourseBuild telemetry.

This gives CourseBuild a repeatable external validation artifact instead of relying on interviews, screenshots, or anecdotal reactions alone.

## v0.8 — Post-build target-shell reconciliation

`reconcileVersionBuild` is read-only and compares expected version objects with actual Canvas state using stable version-specific CourseBuild markers. It flags missing, duplicate, misplaced, unexpectedly published, missing-module, or unexpected CourseBuild-owned content and only reports **Ready for instructor review** when no discrepancies remain.

## v0.7 — Approved delivery version → Canvas shell

An approved, current delivery version can be materialized into a separate Canvas shell after a read-only dry run. The backend prevents writing a delivery variant into the configured Master course. Adapted items preserve outcomes, assessment purpose, points, facts, and instructor intent; created content remains unpublished and uses version-specific stable keys for safe repeat runs.

## v0.6 — Pilot evidence + benchmark capture

CourseBuild records local pilot telemetry for source import, architecture generation time, architecture edits/approvals, LMS item generation/approval, version generation/approval, Canvas create/update operations, reconciliation, and failures. Editable manual-time assumptions remain separate from measured workflow time. Evidence can be exported as JSON.

## v0.5 — Master course → delivery versions

One approved Master drives Online, In-Person, and Accelerated variants. Each version records its Master revision, adaptation rules, explicit differences, generation time, approval state, and sync status. Master changes mark existing variants **Out of Sync** and invalidate approval.

## v0.4 — Editable architecture + two-stage approval

Instructors can reshape AI-proposed modules/items before generation. CourseBuild requires architecture approval first, then individual generated-item approval. Both the browser and backend enforce the architecture gate.

## v0.3 — File import + safer Canvas publishing

Text-family files and PDFs can be imported; Gemini provides PDF document understanding and a reusable source digest. Stable CourseBuild keys allow repeat Canvas builds to update CourseBuild-created content safely.

## Architecture

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `pilot.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `version-reconcile.js`, `pilot.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API
- LMS: Canvas REST API
- Browser persistence: `localStorage` for course state, pilot telemetry, and guided external-pilot state

## Product boundary

The pilot is not yet institutional SaaS. It still lacks multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, and production-grade audit logging. External-pilot evidence stays local until explicitly exported, and the current protocol should use non-sensitive course content only.

## Automated checks

`.github/workflows/coursebuild-checks.yml` verifies browser and Apps Script syntax plus approval gates, version materialization/reconciliation contracts, external-pilot tasks, privacy warning, feedback fields, standardized evidence schema, and pilot telemetry hooks.

## Next likely product slice

- Pilot cohort/session management and aggregate evidence analysis
- Instructor reconciliation workflow for intentionally accepting or repairing discrepancies
- Managed multi-course persistence
- Canvas OAuth and multi-tenant authentication after validation
