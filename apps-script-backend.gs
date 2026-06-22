/**
 * INF 125 Canvas Content Builder secure backend for Google Apps Script.
 * Script Properties required:
 * - GEMINI_API_KEY
 * - CANVAS_API_TOKEN
 * - DEFAULT_CANVAS_BASE_URL optional fallback
 * - SPREADSHEET_ID optional fallback
 */
const REQUIRED_COLUMNS = ["id","week","unit","module","contentType","title","slos","genEdOutcomes","readings","discussionQuestions","smallAssignment","curriculum","aiDraft","facultyStatus","sendToCanvas","canvasStatus","points","dueDate","canvasUrl","courseVersion","includeInVersion","canvasTargetCourseId","deliveryMode","partnerLicenseVersion","customizationNotes","brandingNotes","policyNotes","visibility","publishStatus","canvasExportStatus","canvasExportDate","canvasItemUrl","masterShellSourceId","versionSyncStatus"];
const VERSION_COLUMNS = ["name","canvasCourseId","deliveryMode","brandingRules","policyRules","itemsIncluded","itemsExcluded","syncStatus"];
const COURSE_VERSIONS = ["Master Shell", "In-Person", "Online/Hybrid", "WE Lead CS Licensed"];
const SLOS = [
  "Define and explain foundational AI concepts including artificial intelligence, prompting, machine learning, natural language processing, and neural networks.",
  "Apply AI tools in discipline-specific or personal productivity contexts.",
  "Evaluate the effectiveness, credibility, reliability, and bias of AI-generated content.",
  "Critically analyze the ethical, legal, and social implications of AI in global and local contexts.",
  "Integrate AI tools and resources in project-based learning to address a real-world problem."
];

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || "{}");
    const action = req.action;
    const handlers = { getCourseData, getCourseVersions, getVersionData, createVersionPlan, generateVersionCustomization, approveVersionItem, sendVersionItemToCanvas, sendVersionModuleToCanvas, sendEntireVersionToCanvas, markOutOfSync, syncFromMaster, updateRow, generateDraft, improveDraft, approveItem, sendToCanvas, markComplete };
    if (!handlers[action]) throw new Error("Unsupported action: " + action);
    return json({ ok: true, data: handlers[action](req) });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}
function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function props() { return PropertiesService.getScriptProperties(); }
function spreadsheet(req) { return SpreadsheetApp.openById(req.sheetId || props().getProperty("SPREADSHEET_ID")); }
function sheet(req, name) { return spreadsheet(req).getSheetByName(name) || spreadsheet(req).insertSheet(name); }
function ensureHeader(sh, columns) { if (sh.getLastRow() === 0) sh.appendRow(columns); }
function readRows(sh) { const values = sh.getDataRange().getValues(); if (values.length < 2) return []; const head = values[0]; return values.slice(1).filter(r => r.some(Boolean)).map(r => Object.fromEntries(head.map((h,i)=>[h,r[i]]))); }
function writeRow(req, row) {
  const sh = sheet(req, "CourseContent"); ensureHeader(sh, REQUIRED_COLUMNS);
  const rows = readRows(sh); const idx = rows.findIndex(r => String(r.id) === String(row.id));
  const values = REQUIRED_COLUMNS.map(c => row[c] === undefined ? "" : row[c]);
  if (idx >= 0) sh.getRange(idx + 2, 1, 1, REQUIRED_COLUMNS.length).setValues([values]); else sh.appendRow(values);
  return row;
}
function getCourseData(req) {
  const contentSheet = sheet(req, "CourseContent"); ensureHeader(contentSheet, REQUIRED_COLUMNS);
  const assignmentSheet = sheet(req, "MajorAssignments");
  const assignments = assignmentSheet.getLastRow() ? readRows(assignmentSheet) : [];
  return { content: readRows(contentSheet), majorAssignments: assignments, courseVersions: getCourseVersions(req) };
}
function getCourseVersions(req) {
  const sh = sheet(req, "CourseVersions"); ensureHeader(sh, VERSION_COLUMNS);
  const rows = readRows(sh);
  if (rows.length) return rows;
  return COURSE_VERSIONS.map(name => ({ name, canvasCourseId:"", deliveryMode:versionMode(name), brandingRules:versionBranding(name), policyRules:versionPolicy(name), itemsIncluded:"", itemsExcluded:"", syncStatus:name === "Master Shell" ? "Master Approved" : "Synced" }));
}
function getVersionData(req) {
  const all = getCourseData(req);
  const version = req.version || "Master Shell";
  all.content = all.content.filter(row => includeInVersion(row, version));
  return all;
}
function createVersionPlan(req) {
  const version = req.version || "Master Shell";
  const rows = (req.rows || getCourseData(req).content.filter(r => includeInVersion(r, version))).map(row => {
    row.courseVersion = row.courseVersion || version;
    row.deliveryMode = row.deliveryMode || versionMode(version);
    row.canvasTargetCourseId = row.canvasTargetCourseId || req.canvasCourseId || "";
    row.versionSyncStatus = row.versionSyncStatus || (version === "Master Shell" ? "Master Approved" : "Needs Customization");
    return writeRow(req, row);
  });
  return { version, count: rows.length, rows };
}
function generateVersionCustomization(req) {
  const row = req.row; const version = req.version || "Master Shell";
  row.aiDraft = callGemini(versionPrompt(version, row));
  row.customizationNotes = "Customized for " + version;
  row.versionSyncStatus = "Customized Draft";
  row.publishStatus = "Draft";
  return writeRow(req, row);
}
function approveVersionItem(req) { const row = req.row; row.facultyStatus = "Approved"; row.publishStatus = "Approved"; row.versionSyncStatus = "Version Approved"; return writeRow(req, row); }
function markOutOfSync(req) { const row = req.row; row.versionSyncStatus = "Out of Sync"; return writeRow(req, row); }
function syncFromMaster(req) { const row = req.row; row.versionSyncStatus = "Synced"; row.publishStatus = "Draft"; return writeRow(req, row); }
function sendVersionItemToCanvas(req) { return sendToCanvas(req); }
function sendVersionModuleToCanvas(req) {
  const version = req.version || "Master Shell"; const moduleName = req.module;
  const rows = getCourseData(req).content.filter(r => includeInVersion(r, version) && (!moduleName || r.module === moduleName));
  return { version, module: moduleName, sent: rows.map(row => sendToCanvas(Object.assign({}, req, { row, canvasCourseId: row.canvasTargetCourseId || req.canvasCourseId }))) };
}
function sendEntireVersionToCanvas(req) {
  const version = req.version || "Master Shell";
  const rows = getCourseData(req).content.filter(r => includeInVersion(r, version));
  return { version, sent: rows.map(row => sendToCanvas(Object.assign({}, req, { row, canvasCourseId: row.canvasTargetCourseId || req.canvasCourseId }))) };
}
function includeInVersion(row, version) { return String(row.includeInVersion || row.courseVersion || "").split(/[,;|]/).map(v => v.trim()).indexOf(version) >= 0 || row.courseVersion === version; }
function versionMode(version) { return version === "In-Person" ? "In-Person" : version === "Online/Hybrid" ? "Online/Hybrid" : version === "WE Lead CS Licensed" ? "Licensed Partner" : "Master"; }
function versionBranding(version) { return version === "WE Lead CS Licensed" ? "Partner/facilitator branding placeholders" : "NKU-inspired black, white, and gold styling"; }
function versionPolicy(version) { return version === "WE Lead CS Licensed" ? "Remove NKU-only operational language where appropriate" : version === "Online/Hybrid" ? "Online participation expectations" : version === "In-Person" ? "Attendance and in-class participation language" : "Approved Master Shell policy language"; }
function updateRow(req) { return writeRow(req, req.row); }
function approveItem(req) { const row = req.row; row.facultyStatus = "Approved"; return writeRow(req, row); }
function markComplete(req) { const row = req.row; row.canvasStatus = "Complete"; return writeRow(req, row); }
function generateDraft(req) { const row = req.row; row.aiDraft = callGemini(buildPrompt(req.kind || row.contentType, row)); row.facultyStatus = "Needs Approval"; return writeRow(req, row); }
function improveDraft(req) { const row = req.row; row.aiDraft = callGemini(buildPrompt("improveDraft", row) + "\nExisting draft:\n" + (row.aiDraft || "")); return writeRow(req, row); }

function buildPrompt(kind, row) {
  const builders = { moduleOverview, readings, discussionQuestions, smallAssignment, curriculum, majorAssignmentPage, rubric, finalProject, canvasPage: moduleOverview, Page: moduleOverview, Assignment: smallAssignment, Discussion: discussionQuestions, improveDraft: moduleOverview };
  return basePrompt(row) + "\n\nTask: " + (builders[kind] || moduleOverview)(row);
}
function basePrompt(row) {
  return `You are creating Canvas-ready content for INF 125 AI Literacy at Northern Kentucky University. Ground the content in NKU General Education: Individual & Society, Gen Ed outcomes A2, D3, E3, and these course SLOs: ${SLOS.map((s,i)=>`${i+1}. ${s}`).join(" ")} Context row: ${JSON.stringify(row)}. Return accessible HTML suitable for Canvas. Do not invent official policy.`;
}
function moduleOverview(row){ return `Create a student-facing module overview for Week ${row.week}: ${row.module}. Include outcomes, why it matters, agenda, and completion checklist.`; }
function readings(row){ return `Create a readings page with guiding questions and credibility notes for: ${row.readings}.`; }
function discussionQuestions(row){ return `Create a Canvas discussion with prompt, instructions, replies requirement, and respectful participation criteria based on: ${row.discussionQuestions}.`; }
function smallAssignment(row){ return `Create a small Canvas assignment with purpose, instructions, deliverables, points, rubric, and submission details based on: ${row.smallAssignment}.`; }
function curriculum(row){ return `Create a weekly curriculum plan with sequence, active learning, assessment, and faculty notes based on: ${row.curriculum}.`; }
function majorAssignmentPage(row){ return `Create a major assignment Canvas page with purpose, instructions, deliverables, rubric, SLO mapping, Gen Ed mapping, and Canvas settings.`; }
function rubric(row){ return `Create an analytic rubric aligned to INF 125 SLOs and Gen Ed A2, D3, E3.`; }
function finalProject(row){ return `Create a final project page for an AI literacy portfolio showcase addressing a real-world problem.`; }
function callGemini(prompt) {
  const key = props().getProperty("GEMINI_API_KEY"); if (!key) throw new Error("Missing GEMINI_API_KEY Script Property.");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + encodeURIComponent(key);
  const res = UrlFetchApp.fetch(url, { method:"post", contentType:"application/json", payload: JSON.stringify({ contents:[{ parts:[{ text: prompt }]}] }), muteHttpExceptions:true });
  const body = JSON.parse(res.getContentText()); if (res.getResponseCode() >= 300) throw new Error(body.error && body.error.message || "Gemini request failed");
  return body.candidates[0].content.parts.map(p => p.text).join("\n");
}
function sendToCanvas(req) {
  const row = req.row; if (row.facultyStatus !== "Approved") throw new Error("Faculty Status must be Approved before sending to Canvas.");
  const version = req.version || row.courseVersion || "Master Shell";
  if (!includeInVersion(row, version)) throw new Error("Include in Version must match selected version.");
  if (["Ready", "Approved"].indexOf(String(row.publishStatus || "")) < 0) throw new Error("Publish Status must be Ready or Approved.");
  const base = (req.canvasBaseUrl || props().getProperty("DEFAULT_CANVAS_BASE_URL") || props().getProperty("CANVAS_BASE_URL") || "").replace(/\/$/, "");
  const token = props().getProperty("CANVAS_API_TOKEN"); if (!base || !token) throw new Error("Missing Canvas base URL or CANVAS_API_TOKEN Script Property.");
  const courseId = row.canvasTargetCourseId || req.canvasCourseId; if (!courseId) throw new Error("Canvas Target Course ID is required."); const module = createModule(base, token, courseId, `Week ${row.week}: ${row.module}`);
  let item;
  if (row.contentType === "Assignment") item = createAssignment(base, token, courseId, row);
  else if (row.contentType === "Discussion") item = createDiscussion(base, token, courseId, row);
  else item = createPage(base, token, courseId, row);
  addItemToModule(base, token, courseId, module.id, row.contentType, item);
  row.canvasStatus = "Sent"; row.canvasExportStatus = "Sent"; row.canvasExportDate = new Date().toISOString(); row.canvasUrl = item.html_url || item.url || ""; row.canvasItemUrl = row.canvasUrl; writeRow(req, row);
  return { canvasId:item.id || item.page_id, canvasUrl:row.canvasUrl, canvasModuleId:module.id };
}
function canvasFetch(base, token, path, payload) { const res = UrlFetchApp.fetch(base + "/api/v1" + path, { method:"post", headers:{Authorization:"Bearer "+token}, contentType:"application/json", payload:JSON.stringify(payload), muteHttpExceptions:true }); const body=JSON.parse(res.getContentText()||"{}"); if(res.getResponseCode()>=300) throw new Error(body.message || "Canvas API error"); return body; }
function createModule(base, token, courseId, name) { return canvasFetch(base, token, `/courses/${courseId}/modules`, { module:{ name, published:false }}); }
function createPage(base, token, courseId, row) { return canvasFetch(base, token, `/courses/${courseId}/pages`, { wiki_page:{ title:row.title, body:row.aiDraft || row.curriculum, published:false }}); }
function createAssignment(base, token, courseId, row) { return canvasFetch(base, token, `/courses/${courseId}/assignments`, { assignment:{ name:row.title, description:row.aiDraft || row.curriculum, points_possible:Number(row.points||0), submission_types:["online_upload"], published:false }}); }
function createDiscussion(base, token, courseId, row) { return canvasFetch(base, token, `/courses/${courseId}/discussion_topics`, { title:row.title, message:row.aiDraft || row.discussionQuestions, published:false }); }
function addItemToModule(base, token, courseId, moduleId, type, item) { const itemType = type === "Assignment" ? "Assignment" : type === "Discussion" ? "Discussion" : "Page"; const contentId = item.id || item.page_id || item.url; return canvasFetch(base, token, `/courses/${courseId}/modules/${moduleId}/items`, { module_item:{ type:itemType, content_id:contentId, page_url:item.url, title:item.title || item.name }}); }

function versionPrompt(version, row) {
  const prompts = {
    "In-Person": "Adapt this approved INF 125 content for an in-person college course. Preserve the approved SLOs, Gen Ed mappings, and assessment purpose. Add classroom activities, live discussion prompts, and instructor facilitation notes.",
    "Online/Hybrid": "Adapt this approved INF 125 content for online or hybrid delivery. Preserve the approved SLOs, Gen Ed mappings, and assessment purpose. Add asynchronous instructions, weekly checklist language, online discussion prompts, and recorded demo placeholders.",
    "WE Lead CS Licensed": "Adapt this approved INF 125 content for a licensed external partner delivery version. Preserve the approved curriculum structure, SLOs, and learning intent. Remove NKU-only operational language where appropriate. Add facilitator guidance, implementation notes, and partner customization placeholders.",
    "Master Shell": "Preserve this approved INF 125 Master Shell content as the gold copy. Do not add unapproved policy language."
  };
  return basePrompt(row) + "\n\nVersion: " + version + "\nTask: " + (prompts[version] || prompts["Master Shell"]);
}
