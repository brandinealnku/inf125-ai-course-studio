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
12. Resolve reconciliation discrepancies with explicit instructor decisions and re-verify.
13. Run the guided External Pilot protocol and export a standardized evidence package.
14. Import multiple evidence packages into Pilot Cohort to aggregate findings locally.

## v0.11 — Reconciliation resolution

CourseBuild now closes the gap between detecting a Canvas discrepancy and deciding what should happen next.

### Instructor decisions

Every reconciliation discrepancy can be assigned one of three explicit choices:

- **Repair** — queue a safe CourseBuild correction where the pilot can do so without destructive cleanup.
- **Accept** — record the discrepancy as an intentional exception.
- **Ignore** — defer the issue; the shell remains unresolved.

Each decision is timestamped in the local resolution history and emits pilot telemetry.

### Repair preview

Before any write, `Preview approved repairs` summarizes the queued repair set and separates safe repairs from destructive/manual repairs. The preview itself does not change Canvas.

Safe automated repair currently covers missing expected content, misplaced module membership, missing expected modules, and unexpectedly published CourseBuild content. CourseBuild repairs these by re-running the already-approved, idempotent delivery-version materialization and then re-running reconciliation.

### Destructive safety boundary

Duplicate CourseBuild objects and unexpected extra CourseBuild-owned objects may require deletion or choosing which object to keep. v0.11 deliberately does **not** auto-delete Canvas content. Those discrepancies remain manual/explicit decisions in the pilot.

### Repair + re-verification

`Execute repairs + verify` performs the approved non-destructive repair cycle, immediately re-runs `reconcileVersionBuild`, records created/updated counts, and shows the remaining raw issue count. A shell only returns to **Ready for instructor review** when the underlying reconciliation itself is clean.

## v0.10 — Pilot cohort analysis

CourseBuild can combine multiple `coursebuild-pilot-evidence-v1` exports into a local aggregate analysis without uploading those evidence files to a third-party analytics service. It summarizes ratings, reuse/recommendation intent, median estimated manual time avoided, failures, reconciliation readiness, role/Canvas-experience segments, recurring friction/value terms, and exports `coursebuild-pilot-cohort-v1` with a pilot-evidence disclaimer.

## v0.9 — Structured external pilot

CourseBuild includes a guided product-validation workflow with participant context, sensitive-data warning, participant-supplied manual baselines, seven guided tasks, ratings, adoption intent, qualitative feedback, and a standardized `coursebuild-pilot-evidence-v1` export. Pilot data stays local until explicitly exported.

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

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `pilot.css`, `cohort.css`, `reconciliation-resolution.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `version-reconcile.js`, `reconciliation-resolution.js`, `pilot.js`, `cohort.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API
- LMS: Canvas REST API
- Browser persistence: `localStorage` for course state, resolution decisions/history, pilot telemetry, and guided external-pilot state; cohort files are analyzed locally in browser memory

## Product boundary

The pilot is not yet institutional SaaS. It still lacks multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, and production-grade audit logging. External-pilot evidence stays local until explicitly exported, cohort analysis stays local, and reconciliation repair does not perform destructive automatic deletion.

## Automated checks

`.github/workflows/coursebuild-checks.yml` verifies browser and Apps Script syntax plus approval gates, version materialization/reconciliation contracts, Repair/Accept/Ignore resolution choices, repair preview and re-verification, destructive-operation safeguards, external-pilot evidence, and cohort-analysis contracts.

## Next likely product slice

- Managed multi-course/project persistence with a safe migration path from local pilot state
- Pilot cohort/session persistence only after validation justifies managed infrastructure
- Canvas OAuth and multi-tenant authentication after validation
- Institutional admin/audit controls after buyer validation
