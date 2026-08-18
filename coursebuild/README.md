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
8. Review the explicit differences and approve each delivery version.
9. Enter a separate target Canvas Course ID and run a dry-run preview.
10. Materialize the approved version into that target Canvas shell.
11. Review Pilot Evidence for time, edits, approvals, failures, and create/update behavior.

## v0.7 — Approved delivery version → Canvas shell

CourseBuild can now materialize an approved, current delivery version into a separate Canvas course shell.

### Safety gates

- The Master architecture must still be approved.
- The delivery version must be explicitly `Approved`.
- The delivery version must be `Current` and based on the current Master revision.
- A target Canvas Course ID is required.
- The target course must be different from the configured Master Canvas course.
- The instructor must run a dry-run preview before the browser enables the materialization action.

### Dry-run preview

`previewVersionBuild` performs read-only validation of the target Canvas course and reports the target course name, Master revision, module count, eligible approved Master items, skipped items, and approved delivery differences. It does not create or update Canvas objects.

### Materialization

`materializeVersion` takes the approved Master content captured in the version snapshot and adapts each eligible item using only the approved delivery rules/differences. CourseBuild preserves outcomes, assessment purpose, points, facts, and instructor intent and prohibits invention of new policy, readings, deadlines, grading rules, or requirements.

The adapted version is then written to the target shell as unpublished Canvas content. Stable keys include the delivery version ID, so repeat runs update CourseBuild-created version objects instead of blindly duplicating them. Module membership remains idempotent as well.

The version UI retains the last materialization summary (`created`, `updated`, target shell, Master revision), and v0.6 telemetry records preview/materialization events and failures.

## v0.6 — Pilot evidence + benchmark capture

CourseBuild records local pilot telemetry for source import, architecture generation time, architecture edits/approvals, LMS item generation/approval, version generation/approval, Canvas create/update operations, and failures. Editable manual-time assumptions are kept separate from measured workflow time; estimated time avoided is not treated as a measured fact. Evidence can be exported as JSON.

## v0.5 — Master course → delivery versions

One approved Master drives Online, In-Person, and Accelerated variants. Each version records its Master revision, adaptation rules, explicit differences, generation time, approval state, and sync status. Master changes mark existing variants **Out of Sync** and invalidate approval.

## v0.4 — Editable architecture + two-stage approval

Instructors can reshape AI-proposed modules/items before generation. CourseBuild requires architecture approval first, then individual generated-item approval. Both the browser and backend enforce the architecture gate.

## v0.3 — File import + safer Canvas publishing

Text-family files and PDFs can be imported; Gemini provides PDF document understanding and a reusable source digest. Stable CourseBuild keys allow repeat Canvas builds to update CourseBuild-created content safely.

## Architecture

- Static pilot UI: `index.html`, `styles.css`, `versions.css`, `telemetry.css`, `app.js`, `versions.js`, `telemetry.js`, `version-publish.js`, `sample-course.js`
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
```

## Product boundary

The pilot is not yet institutional SaaS. It still lacks multi-tenant accounts, Canvas OAuth, managed persistence, enterprise permissions, and production-grade audit logging. Version materialization currently uses the same secured Canvas API token and base URL as the Master connection, so target shells must be accessible to that credential.

## Automated checks

`.github/workflows/coursebuild-checks.yml` now checks the delivery-version approval/sync gates, Master-shell protection, dry-run contract, version adaptation, idempotent version keys, version-publish UI, telemetry hooks, and the existing v0.1–v0.6 product contracts.

## Next likely product slice

- Structured external pilot protocol using the v0.6 evidence export
- Target-shell readiness verification and post-build audit
- Managed multi-course persistence
- Canvas OAuth and multi-tenant authentication after validation
