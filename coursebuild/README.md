# CourseBuild

**Course architecture → working LMS.**

CourseBuild is the generalized product layer extracted from the INF 125 Canvas Content Builder prototype. The original course-specific implementation remains intact outside this folder.

## Pilot workflow

1. Create or reopen a CourseBuild project.
2. Optionally connect a managed workspace and sync/reopen project envelopes across browsers/devices.
3. Define a reusable Course Profile.
4. Import a syllabus/course plan by paste, text-family file, or PDF.
5. Generate and edit a proposed module + LMS-object architecture.
6. Explicitly approve the master architecture.
7. Generate source-grounded content and approve each item.
8. Build/update approved Master items in Canvas.
9. Generate Online, In-Person, and Accelerated delivery plans from the approved master.
10. Review the differences and approve each delivery version.
11. Enter a separate target Canvas Course ID and run a dry-run preview.
12. Materialize the approved version into that target Canvas shell.
13. Run read-only reconciliation against the target shell.
14. Resolve reconciliation discrepancies with explicit instructor decisions and re-verify.
15. Run the guided External Pilot protocol and export a standardized evidence package.
16. Import multiple evidence packages into Pilot Cohort to aggregate findings locally.

## v0.13 — Managed workspace sync

CourseBuild now has an opt-in managed persistence path for `coursebuild-project-v1` envelopes while preserving v0.12 local projects as the default/fallback.

### Separate managed-storage service

`managed-storage-backend.gs` is designed to be deployed as a **separate Apps Script Web App** from the Canvas/Gemini backend. This keeps persistence lifecycle and security changes isolated from course generation/publishing.

Configure the managed-storage Apps Script project with:

- `COURSEBUILD_MANAGED_FOLDER_ID` — Google Drive folder used for managed project JSON files.
- `COURSEBUILD_MANAGED_MAX_BYTES` — optional per-project JSON size limit; default is 900,000 characters.

### Pilot workspace identity

The browser generates or accepts a high-entropy `workspaceToken`. That token acts as a bearer secret for the pilot. The backend derives a SHA-256 hash and uses only the hash-derived workspace identifier in Drive filenames/metadata.

This is intentionally **not production authentication**. Anyone with the managed endpoint URL and workspace key can access that workspace's managed project copies. Real account identity/sign-in must replace this before institutional SaaS use.

### Managed project operations

The managed API contract is `coursebuild-managed-storage-v1` and supports:

- `managedPing`
- `listManagedProjects`
- `saveManagedProject`
- `loadManagedProject`
- `deleteManagedProject`

The Projects workspace now supports connecting the managed endpoint, saving the current local project to managed storage, listing managed projects, reopening a managed project into the local adapter, and deleting only the managed copy.

### Conflict protection

Each managed envelope receives a `managedRevision`. Save requests provide `expectedRevision`; the backend rejects an overwrite when the server revision changed after the browser last loaded/saved that project. This is a first optimistic-concurrency guard rather than silent last-write-wins behavior.

### Local-first compatibility

Managed sync is optional. v0.12 local project create/switch/duplicate/import/export behavior still works without any server configuration. Loading a managed project restores it into the same local `coursebuild-project-v1` adapter, so the rest of CourseBuild does not need a second course model.

## v0.12 — Multi-course project persistence

CourseBuild supports multiple local projects instead of assuming a single browser-wide course state. The Projects view supports create, switch/reopen, rename, duplicate, local delete, export, and import. Each project preserves course state, Master/version/materialization/reconciliation/resolution state, telemetry, and external-pilot context. Existing pre-v0.12 state is automatically migrated into the first managed local project.

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

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `pilot.css`, `cohort.css`, `reconciliation-resolution.css`, `projects.css`, `managed-storage.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `version-reconcile.js`, `reconciliation-resolution.js`, `pilot.js`, `cohort.js`, `projects.js`, `managed-storage.js`, `sample-course.js`
- Course/AI/Canvas pilot backend: `apps-script-backend.gs`
- Managed persistence pilot backend: `managed-storage-backend.gs` (separate Apps Script Web App)
- AI: Gemini API
- LMS: Canvas REST API
- Persistence: local `coursebuild-project-v1` adapter plus optional Google Drive-backed managed workspace sync

## Product boundary

The pilot now supports cross-browser/device managed project copies, but it is **not yet institutional SaaS**. Workspace-token access is a pilot bearer-secret model, not user authentication. CourseBuild still lacks real account identity, Canvas OAuth, multi-tenant authorization, team/shared workspace permissions, enterprise retention controls, and production-grade audit logging.

## Automated checks

`.github/workflows/coursebuild-checks.yml` verifies browser and both Apps Script syntax paths plus existing product contracts, managed API actions, schema continuity, Drive-folder configuration, hashed workspace identity, optimistic revision checks, explicit non-production-auth disclosure, managed telemetry hooks, and asset loading.

## Next likely product slice

- Real sign-in/user identity and authorization boundary replacing workspace bearer tokens
- Canvas OAuth tied to user/institution identity
- Institutional workspace roles and audit controls after buyer validation
