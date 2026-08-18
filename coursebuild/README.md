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
12. Review Pilot Evidence for time, edits, approvals, failures, and create/update behavior.

## v0.8 — Post-build target-shell reconciliation

CourseBuild can now verify what actually exists in a materialized target Canvas shell instead of assuming that a successful API write means the course is correct.

`reconcileVersionBuild` is read-only. It validates the same approved/current version contract used for materialization, reads the target course, and compares CourseBuild's expected version objects with the actual Canvas state.

### Reconciliation signals

- Missing expected CourseBuild items
- Duplicate CourseBuild-owned items
- Items not attached to their expected module
- Missing expected modules
- Version items that are unexpectedly published
- Unexpected CourseBuild-owned items for that delivery version
- Expected vs matched item totals

A target shell is marked **Ready for instructor review** only when none of those discrepancies are present and the expected CourseBuild content remains unpublished.

Reconciliation uses stable version-specific CourseBuild markers rather than relying only on titles, which lets it distinguish CourseBuild-owned objects from unrelated Canvas content.

The pilot currently scans up to 100 modules/pages/assignments/discussions per collection and surfaces a warning if that boundary is reached rather than claiming a complete audit.

The reconciliation report is retained with the delivery version and v0.6 telemetry records `version_reconciled` results plus failures.

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

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `version-reconcile.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API
- LMS: Canvas REST API
- Browser persistence: `localStorage` for course state and pilot telemetry

## Backend actions

```text
generateCourseArchitecture
importPdfArchitecture
generateItem
publishItem
previewVersionBuild
materializeVersion
reconcileVersionBuild
```

## Product boundary

The pilot is not yet institutional SaaS. It still lacks multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, and production-grade audit logging. Target shells must be accessible to the same secured Canvas credential used by the pilot. Reconciliation reports discrepancies but intentionally does not auto-repair them.

## Automated checks

`.github/workflows/coursebuild-checks.yml` verifies browser and Apps Script syntax plus the approval gates, Master-shell protection, dry-run/materialization contracts, version-specific idempotency, reconciliation signals, read-only reconciliation UI, telemetry hooks, and the existing v0.1–v0.7 product contracts.

## Next likely product slice

- Structured external pilot protocol using exported evidence
- Instructor reconciliation workflow for intentionally accepting or repairing discrepancies
- Managed multi-course persistence
- Canvas OAuth and multi-tenant authentication after validation
