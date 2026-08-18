/**
 * CourseBuild pilot backend
 * Secrets belong in Apps Script Script Properties:
 * GEMINI_API_KEY, CANVAS_API_TOKEN, CANVAS_BASE_URL
 */
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || "{}");
    const handlers = { generateItem, publishItem };
    if (!handlers[req.action]) throw new Error("Unsupported action: " + req.action);
    return json({ ok:true, data:handlers[req.action](req) });
  } catch (err) {
    return json({ ok:false, error:err.message });
  }
}

function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function props(){ return PropertiesService.getScriptProperties(); }

function generateItem(req){
  if(!req.course || !req.item) throw new Error("Course profile and item are required.");
  const prompt = buildPrompt(req.course, req.module || {}, req.item, req.outcomes || req.course.outcomes || []);
  return { draftHtml:callGemini(prompt) };
}

function buildPrompt(course,module,item,outcomes){
  return [
    "You are CourseBuild, an instructor-controlled course production assistant.",
    "Create accessible, student-facing HTML suitable for a learning management system.",
    "Do not invent institutional policy, required readings, dates, grading rules, or factual claims that are not supported by the supplied course context.",
    "Preserve instructor intent and learning outcomes. Return only the requested course content, not commentary about your process.",
    "",
    "COURSE PROFILE",
    JSON.stringify(course),
    "",
    "MODULE",
    JSON.stringify(module),
    "",
    "LEARNING OUTCOMES",
    JSON.stringify(outcomes),
    "",
    "ITEM TO BUILD",
    JSON.stringify(item),
    "",
    itemInstruction(item)
  ].join("\n");
}

function itemInstruction(item){
  if(item.type === "Assignment") return "Create an assignment with purpose, instructions, deliverables, success criteria, and submission guidance. Respect the provided points value.";
  if(item.type === "Discussion") return "Create a discussion prompt with context, primary response instructions, peer response guidance, and respectful participation criteria.";
  return "Create a concise Canvas page with a clear heading structure, why this matters, the essential content, and a completion or reflection prompt when appropriate.";
}

function callGemini(prompt){
  const key = props().getProperty("GEMINI_API_KEY");
  if(!key) throw new Error("Missing GEMINI_API_KEY Script Property.");
  const model = props().getProperty("GEMINI_MODEL") || "gemini-2.0-flash";
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key);
  const res = UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",payload:JSON.stringify({contents:[{parts:[{text:prompt}]}]}),muteHttpExceptions:true});
  const body = JSON.parse(res.getContentText() || "{}");
  if(res.getResponseCode() >= 300) throw new Error(body.error && body.error.message || "Gemini request failed.");
  return (((body.candidates||[])[0]||{}).content||{}).parts.map(p=>p.text||"").join("\n");
}

function publishItem(req){
  const item=req.item, module=req.module || {};
  if(!item) throw new Error("Item is required.");
  if(item.status !== "Approved") throw new Error("CourseBuild requires instructor approval before publishing.");
  if(!item.draftHtml) throw new Error("Approved item has no draft content.");

  const base=(req.canvasBaseUrl || props().getProperty("CANVAS_BASE_URL") || "").replace(/\/$/,"");
  const token=props().getProperty("CANVAS_API_TOKEN");
  const courseId=req.canvasCourseId;
  if(!base || !token || !courseId) throw new Error("Canvas connection is incomplete.");

  const canvasModule=findOrCreateModule(base,token,courseId,module.title || "CourseBuild");
  let created;
  if(item.type === "Assignment") created=createAssignment(base,token,courseId,item);
  else if(item.type === "Discussion") created=createDiscussion(base,token,courseId,item);
  else created=createPage(base,token,courseId,item);
  addModuleItem(base,token,courseId,canvasModule.id,item.type,created,item.title);
  return { canvasId:created.id || created.page_id, canvasUrl:created.html_url || created.url || "", moduleId:canvasModule.id };
}

function canvasRequest(base,token,path,method,payload){
  const options={method:method || "get",headers:{Authorization:"Bearer "+token},muteHttpExceptions:true};
  if(payload){ options.contentType="application/json"; options.payload=JSON.stringify(payload); }
  const res=UrlFetchApp.fetch(base+"/api/v1"+path,options);
  const body=JSON.parse(res.getContentText() || "{}");
  if(res.getResponseCode() >= 300) throw new Error(body.message || "Canvas API request failed.");
  return body;
}

function findOrCreateModule(base,token,courseId,name){
  const modules=canvasRequest(base,token,"/courses/"+courseId+"/modules?per_page=100","get");
  const found=(modules||[]).find(m=>m.name===name);
  return found || canvasRequest(base,token,"/courses/"+courseId+"/modules","post",{module:{name:name,published:false}});
}
function createPage(base,token,courseId,item){ return canvasRequest(base,token,"/courses/"+courseId+"/pages","post",{wiki_page:{title:item.title,body:item.draftHtml,published:false}}); }
function createAssignment(base,token,courseId,item){ return canvasRequest(base,token,"/courses/"+courseId+"/assignments","post",{assignment:{name:item.title,description:item.draftHtml,points_possible:Number(item.points||0),submission_types:["online_upload"],published:false}}); }
function createDiscussion(base,token,courseId,item){ return canvasRequest(base,token,"/courses/"+courseId+"/discussion_topics","post",{title:item.title,message:item.draftHtml,published:false}); }
function addModuleItem(base,token,courseId,moduleId,type,created,title){
  const canvasType=type === "Assignment" ? "Assignment" : type === "Discussion" ? "Discussion" : "Page";
  const payload={module_item:{type:canvasType,title:title}};
  if(canvasType === "Page") payload.module_item.page_url=created.url;
  else payload.module_item.content_id=created.id;
  return canvasRequest(base,token,"/courses/"+courseId+"/modules/"+moduleId+"/items","post",payload);
}
