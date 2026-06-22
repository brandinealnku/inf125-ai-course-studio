# AI Course Command Center V6 · INF 125

This is a static GitHub Pages front end for **AI Course Command Center V6** for **INF 125: Social Media and Society**.

The intended production architecture is:

- **GitHub Pages**: browser front end only
- **Google Sheets**: course workbook/database
- **Google Apps Script Web App**: secure backend/proxy
- **Gemini API key**: stored only in Apps Script Script Properties
- **Canvas API token**: stored only in Apps Script Script Properties
- **localStorage**: fallback/cache and offline backup

No Gemini API keys or Canvas API tokens are stored in this repository or in browser JavaScript.

## Workbook-aligned sections

The app aligns to these Google Sheet tabs:

- `Dashboard`
- `Course_Config`
- `V6_Settings`
- `Weeks`
- `Course_Calendar`
- `Activities`
- `Assessments`
- `Learning_Objectives`
- `AI_Drafts`
- `Canvas_Item_Map`
- `Publishing_Log`
- `Faculty_Signup`
- `Faculty_Feedback`
- `Lists`

The tabs and columns are the source of truth for the command center UI.

## How the app connects to Google Sheets

1. Deploy the Apps Script starter as a Web App.
2. Open the GitHub Pages app.
3. Go to **Settings**.
4. Enter:
   - Apps Script Web App URL
   - Course ID
   - Canvas Course ID
   - Sync mode: `Read Only`, `Draft Only`, or `Full Publish`
   - Enable local cache: `Yes` or `No`
5. Click **Save Settings**.
6. Click **Sync from Google Sheet**.

The app tries to load from Apps Script first when a URL is configured. If Apps Script is unavailable, it shows a warning and uses the localStorage cache.

## Deploy Apps Script as a Web App

1. Create or open a Google Sheet with the workbook tab names listed above.
2. Open **Extensions → Apps Script**.
3. Paste the contents of `apps-script-starter.js`.
4. Set `SPREADSHEET_ID` to your Google Sheet ID.
5. In Apps Script, open **Project Settings → Script Properties**.
6. Add properties as needed:
   - `GEMINI_API_KEY`
   - `CANVAS_API_TOKEN`
   - `CANVAS_BASE_URL`
7. Deploy as a **Web App**.
8. Copy the Web App URL into the GitHub Pages app Settings section.

## Apps Script API contract

See `APPS_SCRIPT_CONTRACT.md` for the expected request and response shapes for:

- `getSheetData`
- `saveSheetRow`
- `updateSheetRow`
- `deleteSheetRow`
- `generateWithGemini`
- `publishToCanvas`
- `getCanvasStatus`
- `logPublishingAction`

All browser calls go to the Apps Script Web App URL only.

## Gemini generation workflow

The **Generate Content** page lets the instructor select:

- Week
- Source section: `Weeks`, `Activities`, `Assessments`, or `Learning_Objectives`
- Output format: Canvas Page, Assignment, Discussion, Quiz, Rubric, or Announcement
- Tone
- Prompt

The browser sends a payload to Apps Script:

```json
{
  "action": "generateWithGemini",
  "courseId": "INF125",
  "sectionName": "Weeks",
  "selectedRows": [],
  "prompt": "Create INF 125 content...",
  "outputType": "Canvas Page"
}
```

Apps Script should call Gemini securely and return draft HTML, summary, prompt snapshot, and generation status. The browser saves the returned draft into `AI_Drafts`.

If Apps Script is unavailable, the app creates a clearly labeled local fallback draft so the UI can still be tested.

## Canvas publishing workflow

Approved AI Drafts can be sent to Canvas through Apps Script. Publishing is allowed only when:

- `Review Status` is `Approved`
- `Publish Status` is not already `Sent to Canvas` or `Published`

The browser sends:

```json
{
  "action": "publishToCanvas",
  "canvasCourseId": "12345",
  "canvasItemType": "Assignment",
  "canvasTitle": "Applied Platform Analysis 1",
  "draftHtml": "<p>...</p>",
  "week": 1,
  "moduleName": "Week 1"
}
```

Apps Script handles the Canvas API securely. On success, the app updates:

- `AI_Drafts`
- `Canvas_Item_Map`
- `Publishing_Log`

If Apps Script is unavailable, the app performs a clearly labeled local simulation for testing.

## Spreadsheet import backup

The app keeps the **Spreadsheet Import** section as a backup path. It supports:

- `.xlsx`
- `.xls`
- `.csv`

Excel parsing uses SheetJS from a browser CDN with a fallback CDN URL. CSV parsing is done locally in JavaScript. Imported data is saved to localStorage and can then be pushed to Google Sheets through Apps Script.

## localStorage fallback/cache

The app stores only non-secret settings and cached workbook data locally:

- Apps Script Web App URL
- Course ID
- Canvas Course ID
- Sync mode
- Cache setting
- Cached workbook rows

Use **Download Backup JSON** to save a local copy and **Restore Backup JSON** to reload it.

## Running locally

No npm install is required:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## GitHub Pages

Publish the repository root with GitHub Pages. The app uses relative paths and browser APIs only, so it remains static-hosting compatible.

## Security warning

Never commit Gemini or Canvas secrets to this repository. Never place API keys or Canvas tokens in `index.html`, `app.js`, or any GitHub Pages asset. Use Apps Script Script Properties and server-side UrlFetchApp calls.
