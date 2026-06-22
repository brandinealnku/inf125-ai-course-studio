# Apps Script API Contract · AI Course Command Center V6

GitHub Pages is the front end. Google Sheets is the course database. Google Apps Script is the secure backend/proxy for Google Sheets, Gemini, and Canvas.

Do **not** put `GEMINI_API_KEY`, `CANVAS_API_TOKEN`, or Canvas secrets in GitHub Pages code. Store secrets in Apps Script **Script Properties**.

## Transport

The browser sends `POST` requests to the deployed Apps Script Web App URL.

Recommended request body:

```json
{
  "action": "getSheetData",
  "courseId": "INF125",
  "canvasCourseId": "12345",
  "sectionName": "Weeks"
}
```

Recommended response shape:

```json
{
  "ok": true,
  "data": []
}
```

Error response:

```json
{
  "ok": false,
  "error": "Useful error message"
}
```

## Sheet tabs

The app expects these exact Google Sheet tab names:

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

## Actions

### `getSheetData`

Request:

```json
{
  "action": "getSheetData",
  "courseId": "INF125",
  "sectionName": "Weeks"
}
```

Response:

```json
{
  "ok": true,
  "data": [
    {
      "Week": 1,
      "Module Title": "Platform Society",
      "Focus Topic": "INF 125 social media analysis"
    }
  ]
}
```

### `saveSheetRow`

Request:

```json
{
  "action": "saveSheetRow",
  "courseId": "INF125",
  "sectionName": "Activities",
  "row": {
    "Activity ID": "act-1",
    "Week": 1,
    "Title": "Platform artifact analysis"
  }
}
```

Response:

```json
{ "ok": true, "data": { "saved": true } }
```

### `updateSheetRow`

Request:

```json
{
  "action": "updateSheetRow",
  "courseId": "INF125",
  "sectionName": "Assessments",
  "rowId": "asm-1",
  "row": {
    "Assessment ID": "asm-1",
    "Status": "Approved"
  }
}
```

Response:

```json
{ "ok": true, "data": { "updated": true } }
```

### `deleteSheetRow`

Request:

```json
{
  "action": "deleteSheetRow",
  "courseId": "INF125",
  "sectionName": "Faculty_Feedback",
  "rowId": "feedback-1"
}
```

Response:

```json
{ "ok": true, "data": { "deleted": true } }
```

### `generateWithGemini`

Request:

```json
{
  "action": "generateWithGemini",
  "courseId": "INF125",
  "sectionName": "Weeks",
  "selectedRows": [
    {
      "Week": 1,
      "Module Title": "Platform Society"
    }
  ],
  "prompt": "Create a Canvas page for Week 1.",
  "outputType": "Canvas Page"
}
```

Apps Script should read `GEMINI_API_KEY` from Script Properties and call Gemini securely.

Response:

```json
{
  "ok": true,
  "data": {
    "draftHtml": "<h2>Week 1: Platform Society</h2>",
    "plainTextSummary": "Canvas page draft for Week 1.",
    "promptSnapshot": "Create a Canvas page for Week 1.",
    "generationStatus": "Generated"
  }
}
```

### `publishToCanvas`

Request:

```json
{
  "action": "publishToCanvas",
  "canvasCourseId": "12345",
  "canvasItemType": "Assignment",
  "canvasTitle": "Applied Platform Analysis 1",
  "draftHtml": "<p>Assignment instructions...</p>",
  "week": 1,
  "moduleName": "Week 1"
}
```

Apps Script should read `CANVAS_API_TOKEN` and `CANVAS_BASE_URL` from Script Properties and call Canvas securely.

Response:

```json
{
  "ok": true,
  "data": {
    "canvasId": "98765",
    "canvasUrl": "https://canvas.example.edu/courses/12345/assignments/98765",
    "canvasModuleId": "54321",
    "message": "Published to Canvas"
  }
}
```

### `getCanvasStatus`

Request:

```json
{
  "action": "getCanvasStatus",
  "canvasCourseId": "12345",
  "canvasItemId": "98765"
}
```

Response:

```json
{
  "ok": true,
  "data": {
    "canvasItemId": "98765",
    "published": true,
    "workflowState": "available"
  }
}
```

### `logPublishingAction`

Request:

```json
{
  "action": "logPublishingAction",
  "courseId": "INF125",
  "payload": {
    "Timestamp": "2026-06-22T00:00:00.000Z",
    "Action": "publishToCanvas",
    "Publish Status": "Sent to Canvas"
  }
}
```

Response:

```json
{ "ok": true, "data": { "logged": true } }
```
