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
13. Import multiple evidence packages into Pilot Cohort to aggregate findings locally.

## v0.10 — Pilot cohort analysis

CourseBuild can now combine multiple `coursebuild-pilot-evidence-v1` exports into a local aggregate analysis without uploading those evidence files to a third-party analytics service.

### Cohort import

The Pilot Cohort view accepts multiple JSON files, rejects invalid JSON or mismatched schemas, and de-duplicates imported pilots by pilot ID. Imported evidence remains in browser memory for the current cohort-analysis session.

### Aggregate measures

The cohort view summarizes:

- participant count,
- average usefulness, ease, control, and confidence ratings,
- yes-rate for willingness to use CourseBuild again,
- yes-rate for willingness to recommend a pilot to a colleague,
- median estimated manual time avoided,
- recorded failure events,
- reconciled target shells that were ready for instructor review.

Estimated time avoided remains based on participant-supplied manual baselines compared with available local workflow/API timing. It is explicitly treated as pilot evidence rather than a production performance claim.

### Segmentation

Results are segmented by participant role and Canvas experience so early product signals can be compared across faculty, instructional designers, administrators, and beginner/intermediate/advanced Canvas users.

### Qualitative themes

The cohort analyzer extracts recurring words from the `friction` and `bestPart` responses to surface common language around pain points and perceived value. This is intentionally lightweight local text aggregation, not automated sentiment scoring or a claim that the themes are statistically significant.

### Case-study summary + aggregate export

CourseBuild generates a copyable case-study-ready paragraph that includes participant count, ratings, adoption intent, estimated time avoided, and failure count with a clear pilot-evidence disclaimer.

`Export aggregate JSON` produces a `coursebuild-pilot-cohort-v1` package containing the aggregate summary, role/experience segments, and extracted friction/value themes.

## v0.9 — Structured external pilot

CourseBuild includes a guided product-validation workflow for testing with instructors, instructional designers, or academic administrators outside the original build context.

The External Pilot captures participant context, an explicit sensitive-data/privacy warning, participant-supplied manual baselines, seven guided tasks with timestamps, 1–5 usefulness/ease/control/confidence ratings, reuse/recommendation intent, qualitative feedback, and a standardized `coursebuild-pilot-evidence-v1` JSON export. Pilot data stays local until explicitly exported.

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

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `pilot.css`, `cohort.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `version-reconcile.js`, `pilot.js`, `cohort.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API
- LMS: Canvas REST API
- Browser persistence: `localStorage` for course state, pilot telemetry, and guided external-pilot state; cohort files are analyzed locally in browser memory

## Product boundary

The pilot is not yet institutional SaaS. It still lacks multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, and production-grade audit logging. External-pilot evidence stays local until explicitly exported, cohort analysis stays local, and the current protocol should use non-sensitive course content only.

## Automated checks

`.github/workflows/coursebuild-checks.yml` verifies browser and Apps Script syntax plus approval gates, version materialization/reconciliation contracts, external-pilot tasks, privacy warning, feedback fields, standardized evidence schema, cohort schema validation, aggregate metrics, segmentation, theme extraction, evidence disclaimers, and cohort telemetry hooks.

## Next likely product slice

- Instructor reconciliation workflow for intentionally accepting or repairing discrepancies
- Pilot cohort/session persistence after validation justifies managed infrastructure
- Managed multi-course persistence
- Canvas OAuth and multi-tenant authentication after validation
