/**
 * AI Course Command Center V6 · Google Apps Script starter
 * Deploy as a Web App. Store secrets in Script Properties:
 * - GEMINI_API_KEY
 * - CANVAS_API_TOKEN
 * - CANVAS_BASE_URL
 */
const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';

function doGet(e) {
  return json({ ok: true, data: { status: 'AI Course Command Center API is running' } });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
    const action = body.action;
    const routes = {
      getSheetData,
      saveSheetRow,
      updateSheetRow,
      deleteSheetRow,
      generateWithGemini,
      publishToCanvas,
      getCanvasStatus,
      logPublishingAction
    };
    if (!routes[action]) throw new Error(`Unknown action: ${action}`);
    return json({ ok: true, data: routes[action](body) });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function ss() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function sheetFor(sectionName) {
  const sheet = ss().getSheetByName(sectionName);
  if (!sheet) throw new Error(`Missing sheet tab: ${sectionName}`);
  return sheet;
}

function rowsToObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(cell => cell !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function getSheetData(body) {
  return rowsToObjects(sheetFor(body.sectionName));
}

function saveSheetRow(body) {
  const sheet = sheetFor(body.sectionName);
  const headers = getHeaders(sheet, Object.keys(body.row || {}));
  sheet.appendRow(headers.map(h => body.row[h] || ''));
  return { saved: true };
}

function updateSheetRow(body) {
  const sheet = sheetFor(body.sectionName);
  const headers = getHeaders(sheet, Object.keys(body.row || {}));
  const idCol = inferIdColumn(headers, body.sectionName);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((row, i) => i > 0 && String(row[headers.indexOf(idCol)]) === String(body.rowId));
  if (rowIndex < 1) return saveSheetRow(body);
  const next = headers.map(h => body.row[h] || '');
  sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([next]);
  return { updated: true };
}

function deleteSheetRow(body) {
  const sheet = sheetFor(body.sectionName);
  const headers = getHeaders(sheet, []);
  const idCol = inferIdColumn(headers, body.sectionName);
  const values = sheet.getDataRange().getValues();
  const rowIndex = values.findIndex((row, i) => i > 0 && String(row[headers.indexOf(idCol)]) === String(body.rowId));
  if (rowIndex > 0) sheet.deleteRow(rowIndex + 1);
  return { deleted: rowIndex > 0 };
}

function getHeaders(sheet, fallback) {
  const lastColumn = Math.max(sheet.getLastColumn(), fallback.length, 1);
  let headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].filter(Boolean);
  if (!headers.length && fallback.length) {
    headers = fallback;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return headers;
}

function inferIdColumn(headers, sectionName) {
  return headers.find(h => / id$/i.test(h) || h === 'Week' || h === 'Setting' || h === 'Timestamp') || headers[0];
}

function generateWithGemini(body) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY Script Property');
  // TODO: call Gemini API here using UrlFetchApp.fetch(). Do not return secrets.
  const promptSnapshot = JSON.stringify({ prompt: body.prompt, selectedRows: body.selectedRows, outputType: body.outputType });
  return {
    draftHtml: `<h2>${body.outputType || 'Canvas Page'} draft</h2><p>Replace this placeholder with Gemini output.</p>`,
    plainTextSummary: 'Placeholder Gemini response from Apps Script starter.',
    promptSnapshot,
    generationStatus: 'Generated'
  };
}

function publishToCanvas(body) {
  const token = PropertiesService.getScriptProperties().getProperty('CANVAS_API_TOKEN');
  const baseUrl = PropertiesService.getScriptProperties().getProperty('CANVAS_BASE_URL');
  if (!token || !baseUrl) throw new Error('Missing Canvas Script Properties');
  // TODO: call Canvas API with UrlFetchApp.fetch() using the token server-side only.
  return {
    canvasId: `placeholder-${Date.now()}`,
    canvasUrl: `${baseUrl}/courses/${body.canvasCourseId}`,
    canvasModuleId: `module-${body.week || 'course'}`,
    message: 'Placeholder Canvas publish response from Apps Script starter.'
  };
}

function getCanvasStatus(body) {
  return { canvasItemId: body.canvasItemId, published: false, workflowState: 'placeholder' };
}

function logPublishingAction(body) {
  saveSheetRow({ sectionName: 'Publishing_Log', row: body.payload || body });
  return { logged: true };
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
