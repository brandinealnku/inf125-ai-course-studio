# INF 125 Canvas Content Builder

A GitHub Pages-compatible prototype for building Canvas-ready **INF 125 AI Literacy** content from a Google Sheet course database. The static front end can run entirely with sample data, then connect to **Google Apps Script** for secure Google Sheets, Gemini, and Canvas API workflows.

## Architecture

- **GitHub Pages** hosts `index.html`, `styles.css`, `app.js`, and `sample-data.js`.
- **Google Sheets** is the course database and source of truth.
- **Google Apps Script** exposes a secure POST API from `apps-script-backend.gs`.
- **Gemini API key** is stored only in Apps Script Script Properties.
- **Canvas API token** is stored only in Apps Script Script Properties.
- The front end stores only non-secret settings in browser `localStorage`.

## Deploy on GitHub Pages

1. Commit these files to your repository root.
2. In GitHub, open **Settings → Pages**.
3. Select the branch and root folder.
4. Save and open the published Pages URL.
5. The app will load with `sample-data.js` if Apps Script is not configured.

## Create the Google Sheet

Create a Google Sheet with a tab named `CourseContent`.

### Required `CourseContent` columns

```text
id, week, unit, module, contentType, title, slos, genEdOutcomes, readings,
discussionQuestions, smallAssignment, curriculum, aiDraft, facultyStatus,
sendToCanvas, canvasStatus, points, dueDate, canvasUrl
```

Optional tab: `MajorAssignments` with columns matching the sample data:

```text
title, purpose, instructions, deliverables, rubric, sloMapping, genEdMapping, canvasSettings
```

## Deploy Google Apps Script as a web app

1. Open the Google Sheet.
2. Select **Extensions → Apps Script**.
3. Paste the contents of `apps-script-backend.gs` into the editor.
4. Save the project.
5. Open **Project Settings → Script Properties**.
6. Add required secret properties.
7. Select **Deploy → New deployment → Web app**.
8. Execute as yourself and grant access to the intended users.
9. Copy the Web App URL.

## Store Gemini API key in Script Properties

In Apps Script **Project Settings → Script Properties**, add:

```text
GEMINI_API_KEY = your Gemini API key
```

Do not put this value in `index.html`, `app.js`, `sample-data.js`, or GitHub repository settings.

## Store Canvas API token in Script Properties

In Apps Script **Project Settings → Script Properties**, add:

```text
CANVAS_API_TOKEN = your Canvas access token
CANVAS_BASE_URL = https://yourinstitution.instructure.com
SPREADSHEET_ID = your Google Sheet ID
```

`CANVAS_BASE_URL` can also be entered in the front end as a non-secret convenience setting, but the token must remain in Apps Script.

## Connect the front end to Apps Script

1. Open the GitHub Pages app.
2. Go to **Settings**.
3. Enter:
   - Google Apps Script Web App URL
   - Google Sheet ID
   - Canvas Course ID
   - Canvas Base URL
4. Click **Save settings to localStorage**.
5. Click **Load from Apps Script**.

## Test with sample data

No backend is required for a demo:

1. Open `index.html` locally or through GitHub Pages.
2. Click **Load sample demo data**.
3. Open **Course Content**.
4. Click **Generate Draft** on a row. If Apps Script is not configured, the app creates a clearly labeled local sample draft.
5. Click **Approve**.
6. Open **Canvas Preview** to review approved content.

Local development command:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Send approved content to Canvas

1. Configure Apps Script and Script Properties.
2. Generate or improve a draft.
3. Click **Approve** so `facultyStatus` becomes `Approved`.
4. Open **Canvas Preview**.
5. Click **Send approved item to Canvas**.
6. Apps Script will create or use Canvas API helpers for modules, pages, assignments, discussions, and module items.

The app blocks Canvas sending unless Faculty Status is `Approved`.

## Apps Script POST actions

`apps-script-backend.gs` supports:

- `getCourseData`
- `updateRow`
- `generateDraft`
- `improveDraft`
- `approveItem`
- `sendToCanvas`
- `markComplete`

Gemini prompt builders are included for:

- module overview
- readings
- discussion questions
- small assignments
- curriculum
- major assignment page
- rubric
- final project

Canvas helpers are included for:

- `createModule`
- `createPage`
- `createAssignment`
- `createDiscussion`
- `addItemToModule`

## Security checklist

- Do not commit API keys or Canvas tokens.
- Store secrets only in Apps Script Script Properties.
- Use Apps Script as the secure backend API.
- Treat GitHub Pages as a public static site.

## Master Shell and multi-version strategy

The **INF 125 Master Shell** is the approved gold-copy course. It should hold the approved INF 125 modules, SLOs, General Education mappings, assignments, rubrics, pages, and portfolio/final project structure. Delivery versions are generated from that master content instead of rebuilding the course.

Supported working versions:

1. **Master Shell** — approved source content.
2. **In-Person** — adds classroom activities, attendance/participation language, live discussion prompts, due date placeholders, and facilitation notes.
3. **Online/Hybrid** — adds asynchronous instructions, discussion prompts, recorded demo placeholders, weekly checklist language, and online participation expectations.
4. **WE Lead CS Licensed** — preserves the curriculum structure while removing NKU-only operational language where appropriate and adding facilitator, implementation, licensing, and partner customization placeholders.

## Create Canvas shells and add course IDs

Create one Canvas shell for the Master Shell and one shell or section for each delivery version you plan to export. In the app, open **Settings** and store these non-secret values in browser `localStorage`:

- Apps Script Web App URL
- Google Sheet ID
- Default Canvas Base URL
- Master Shell Canvas Course ID
- In-Person Canvas Course ID
- Online/Hybrid Canvas Course ID
- WE Lead CS Canvas Course ID

Canvas tokens must not be stored in the browser. Store `CANVAS_API_TOKEN`, `GEMINI_API_KEY`, and `DEFAULT_CANVAS_BASE_URL` in Apps Script `PropertiesService`.

## Version-aware spreadsheet columns

The `CourseContent` sheet now supports these additional columns:

```text
courseVersion, includeInVersion, canvasTargetCourseId, deliveryMode,
partnerLicenseVersion, customizationNotes, brandingNotes, policyNotes,
visibility, publishStatus, canvasExportStatus, canvasExportDate,
canvasItemUrl, masterShellSourceId, versionSyncStatus
```

Use `includeInVersion` to tag rows for one or more versions, for example:

```text
Master Shell, In-Person, Online/Hybrid, WE Lead CS Licensed
```

Use `canvasTargetCourseId` when a specific row should export to a specific Canvas shell. Otherwise, the front end can use the version course ID saved in Settings.

## Export to one version or multiple versions

1. Select a **Working Version** at the top of the Dashboard, Content Builder, Course Versions, Major Assignments, or Canvas Export tabs.
2. Confirm each row is tagged in `includeInVersion` for the selected version.
3. Generate version customizations when needed.
4. Approve the version content.
5. Preview the Canvas export details.
6. Send a selected item, selected module, or entire selected version through Apps Script.

The export workflow blocks sending unless:

- `facultyStatus` is `Approved`
- `includeInVersion` matches the selected version
- a Canvas target course ID exists
- `publishStatus` is `Ready` or `Approved`

## Version sync workflow

If Master Shell content changes, mark related delivery rows as `Out of Sync`. The Course Versions dashboard shows out-of-sync counts. Use **Generate Customizations** or the Apps Script `syncFromMaster` action to regenerate from the master, or keep the custom version by approving it again.

Status badges used by the prototype include:

- Master Approved
- Needs Customization
- Customized Draft
- Version Approved
- Sent to Canvas
- Out of Sync

## WE Lead CS licensed version workflow

For WE Lead CS delivery, tag approved master rows with `WE Lead CS Licensed` in `includeInVersion`. Generate customizations to remove NKU-only operational wording where appropriate while preserving SLOs, Gen Ed mappings, curriculum sequence, assignments, rubrics, and learning intent. Add facilitator guide notes, partner implementation placeholders, and licensing notes before approving and exporting to the WE Lead CS Canvas shell.

## New Apps Script POST actions

The backend now includes version-aware actions:

- `getCourseVersions`
- `getVersionData`
- `createVersionPlan`
- `generateVersionCustomization`
- `approveVersionItem`
- `sendVersionItemToCanvas`
- `sendVersionModuleToCanvas`
- `sendEntireVersionToCanvas`
- `markOutOfSync`
- `syncFromMaster`
