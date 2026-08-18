# CourseBuild

**Course architecture → working LMS.**

CourseBuild is the generalized product layer extracted from the INF 125 Canvas Content Builder prototype. The original course-specific implementation remains intact outside this folder.

## Pilot workflow

1. Create or reopen a CourseBuild project.
2. Define a reusable Course Profile.
3. Import a syllabus/course plan by paste, text-family file, or PDF.
4. Generate and edit a proposed module + LMS-object architecture.
5. Explicitly approve the master architecture.
6. Generate source-grounded content and approve each item.
7. Build/update approved Master items in Canvas.
8. Generate Online, In-Person, and Accelerated delivery plans from the approved master.
9. Review the differences and approve each delivery version.
10. Enter a separate target Canvas Course ID and run a dry-run preview.
11. Materialize the approved version into that target Canvas shell.
12. Run read-only reconciliation against the target shell.
13. Resolve reconciliation discrepancies with explicit instructor decisions and re-verify.
14. Run the guided External Pilot protocol and export a standardized evidence package.
15. Import multiple evidence packages into Pilot Cohort to aggregate findings locally.

## v0.12 — Multi-course project persistence

CourseBuild now supports multiple local projects instead of assuming a single browser-wide course state.

### Projects workspace

The new Projects view supports:

- create project,
- switch/reopen project,
- rename project,
- duplicate project,
- delete local project,
- export current project as JSON,
- import a previously exported project.

A project switch snapshots the current working context before restoring the selected project.

### Project envelope

Each local project uses the `coursebuild-project-v1` schema and stores:

- CourseBuild course state,
- Master/delivery-version state,
- materialization/reconciliation/resolution state embedded in the course model,
- local telemetry,
- external-pilot state,
- project metadata and timestamps.

The current pilot continues to use the existing local state keys internally for compatibility with v0.1–v0.11. `projects.js` acts as a storage adapter around those keys so project switching can restore the complete working context without requiring a wholesale rewrite of the earlier product slices.

### Legacy-state migration

On first load after v0.12, the existing single-course browser state is automatically wrapped into the first CourseBuild project. Existing pilot work is therefore preserved rather than replaced with a blank project list.

### Backup and migration path

`Export current project` produces a `coursebuild-project-v1` JSON package. Import validates the schema and creates a separate local project, avoiding silent overwrite when an imported project ID already exists.

The project envelope is intentionally provider-neutral. The browser implementation is a **local storage adapter**; a future managed database can replace that provider while retaining the CourseBuild project model and import/export contract.

Exported projects may contain course-development content, telemetry, and pilot notes. They should not contain protected student information, grades, API keys, or secrets.

## v0.11 — Reconciliation resolution

Every reconciliation discrepancy supports explicit **Repair / Accept / Ignore** choices. Safe repairs are previewed before writes, reuse approved idempotent version materialization, and automatically re-run reconciliation. Duplicate or unexpected extra CourseBuild objects remain outside automatic destructive cleanup.

## v0.10 — Pilot cohort analysis

CourseBuild combines multiple `coursebuild-pilot-evidence-v1` exports into local aggregate evidence, including ratings, reuse/recommendation intent, estimated manual time avoided, role/Canvas-experience segments, recurring friction/value terms, and a `coursebuild-pilot-cohort-v1` export with a pilot-evidence disclaimer.

## v0.9 — Structured external pilot

CourseBuild includes a guided product-validation workflow with participant context, sensitive-data warning, participant-supplied manual baselines, seven guided tasks, ratings, adoption intent, qualitative feedback, and a standardized `coursebuild-pilot-evidence-v1` export.

## v0.8 — Post-build target-shell reconciliation

`reconcileVersionBuild` is read-only and compares expected version objects with actual Canvas state using stable version-specific CourseBuild markers.

## v0.7 — Approved delivery version → Canvas shell

An approved, current delivery version can be materialized into a separate Canvas shell after a read-only dry run with stable version-specific keys for safe repeat runs.

## v0.6 — Pilot evidence + benchmark capture

CourseBuild records local pilot telemetry and separates participant/manual baseline assumptions from measured workflow/API timing.

## v0.5 — Master course → delivery versions

One approved Master drives Online, In-Person, and Accelerated variants with revision/sync tracking.

## v0.4 — Editable architecture + two-stage approval

Instructors can reshape AI-proposed modules/items before generation. CourseBuild requires architecture approval first, then individual generated-item approval.

## v0.3 — File import + safer Canvas publishing

Text-family files and PDFs can be imported; stable CourseBuild keys allow repeat Canvas builds to update CourseBuild-created content safely.

## Architecture

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `pilot.css`, `cohort.css`, `reconciliation-resolution.css`, `projects.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `version-reconcile.js`, `reconciliation-resolution.js`, `pilot.js`, `cohort.js`, `projects.js`, `sample-course.js`
- Secure pilot backend: `apps-script-backend.gs`
- AI: Gemini API
- LMS: Canvas REST API
- Persistence: project-aware local storage adapter with `coursebuild-project-v1` import/export; existing local course/telemetry/pilot keys remain compatibility targets during the migration stage

## Product boundary

The pilot is not yet institutional SaaS. Projects are still browser-local unless exported. CourseBuild still lacks user accounts, shared/team workspaces, managed server-side project persistence, Canvas OAuth, multi-tenant authentication, enterprise permissions, and production-grade audit logging.

## Automated checks

`.github/workflows/coursebuild-checks.yml` verifies browser and Apps Script syntax plus the existing product contracts and the v0.12 project schema, storage keys, migration adapter, project operations, context preservation, and project assets.

## Next likely product slice

- Managed server-side project persistence with user/project identity and migration from `coursebuild-project-v1`
- Canvas OAuth and multi-tenant authentication after validation
- Institutional admin/audit controls after buyer validation
