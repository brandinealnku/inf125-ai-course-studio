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
