/**
 * CourseBuild pilot backend v0.3
 * Secrets belong in Apps Script Script Properties:
 * GEMINI_API_KEY, CANVAS_API_TOKEN, CANVAS_BASE_URL
 */
function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents || "{}");
    const handlers = { generateItem, generateCourseArchitecture, importPdfArchitecture, publishItem };
    if (!handlers[req.action]) throw new Error("Unsupported action: " + req.action);
    return json({ ok:true, data:handlers[req.action](req) });
  } catch (err) {
    return json({ ok:false, error:err.message });
  }
}
function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function props(){ return PropertiesService.getScriptProperties(); }

function generateCourseArchitecture(req){
  if(!req.course || !req.sourceText) throw new Error("Course profile and source text are required.");
  const prompt = architecturePrompt(req.course, req.sourceText);
  return parseArchitecture(callGeminiText(prompt));
}

function importPdfArchitecture(req){
  if(!req.course || !req.base64) throw new Error("Course profile and PDF are required.");
  if(req.mimeType !== "application/pdf") throw new Error("Only PDF document import is supported by this action.");
  const prompt = architecturePrompt(req.course, "The attached PDF is the authoritative course source.");
  const text = callGeminiParts([
    { inline_data:{ mime_type:"application/pdf", data:req.base64 } },
    { text:prompt }
  ]);
  return parseArchitecture(text);
}

function architecturePrompt(course,sourceText){
  return [
    "You are CourseBuild, an instructor-controlled LMS course architecture assistant.",
    "Use only the supplied course profile and source. Do not invent institutional policy, required readings, due dates, grading rules, outcomes, or assessments.",
    "Return STRICT JSON only, no markdown fences.",
    "Schema: {sourceDigest:string, modules:[{order:number,title:string,summary:string}], items:[{moduleOrder:number,type:'Page'|'Assignment'|'Discussion',title:string,purpose:string,points:number}]}",
    "sourceDigest should preserve the most important source-grounding facts needed for later content generation and should be concise enough for reuse.",
    "Propose a practical LMS structure that reflects the source rather than forcing a fixed number of modules.",
    "Every item must have a clear purpose. Use points only when the source supports a points value; otherwise use 0.",
    "COURSE PROFILE", JSON.stringify(course),
    "COURSE SOURCE", sourceText
  ].join("\n\n");
}
function parseArchitecture(text){
  const cleaned=String(text||"").trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  let obj; try{ obj=JSON.parse(cleaned); }catch(err){ throw new Error("Course architecture response was not valid JSON."); }
  if(!Array.isArray(obj.modules)||!obj.modules.length) throw new Error("Course architecture did not include modules.");
  if(!Array.isArray(obj.items)) obj.items=[];
  obj.sourceDigest=String(obj.sourceDigest||"").slice(0,24000);
  return obj;
}

function generateItem(req){
  if(!req.course || !req.item) throw new Error("Course profile and item are required.");
  const prompt = buildPrompt(req.course, req.module || {}, req.item, req.outcomes || req.course.outcomes || [], req.sourceText || "");
  return { draftHtml:callGeminiText(prompt) };
}
function buildPrompt(course,module,item,outcomes,sourceText){
  return [
    "You are CourseBuild, an instructor-controlled course production assistant.",
    "Create accessible, student-facing HTML suitable for a learning management system.",
    "Do not invent institutional policy, required readings, dates, grading rules, or factual claims unsupported by the supplied context.",
    "Preserve instructor intent and learning outcomes. Return only the requested course content, not commentary about your process.",
    "COURSE PROFILE", JSON.stringify(course),
    "MODULE", JSON.stringify(module),
    "LEARNING OUTCOMES", JSON.stringify(outcomes),
    "SOURCE DIGEST / COURSE SOURCE", sourceText.slice(0,24000),
    "ITEM TO BUILD", JSON.stringify(item),
    itemInstruction(item)
  ].join("\n\n");
}
function itemInstruction(item){
  if(item.type === "Assignment") return "Create an assignment with purpose, instructions, deliverables, success criteria, and submission guidance. Respect only a provided nonzero points value.";
  if(item.type === "Discussion") return "Create a discussion prompt with context, primary response instructions, peer response guidance, and respectful participation criteria.";
  return "Create a concise Canvas page with a clear heading structure, why this matters, essential content, and a completion or reflection prompt when appropriate.";
}

function callGeminiText(prompt){ return callGeminiParts([{text:prompt}]); }
function callGeminiParts(parts){
  const key=props().getProperty("GEMINI_API_KEY"); if(!key) throw new Error("Missing GEMINI_API_KEY Script Property.");
  const model=props().getProperty("GEMINI_MODEL") || "gemini-2.5-flash";
  const url="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent?key="+encodeURIComponent(key);
  const res=UrlFetchApp.fetch(url,{method:"post",contentType:"application/json",payload:JSON.stringify({contents:[{parts:parts}]}),muteHttpExceptions:true});
  const body=JSON.parse(res.getContentText()||"{}");
  if(res.getResponseCode()>=300) throw new Error(body.error&&body.error.message||"Gemini request failed.");
  const candidate=(body.candidates||[])[0];
  if(!candidate||!candidate.content) throw new Error("Gemini returned no content.");
  return (candidate.content.parts||[]).map(p=>p.text||"").join("\n");
}

function publishItem(req){
  const item=req.item, module=req.module||{};
  if(!item) throw new Error("Item is required.");
  if(item.status!=="Approved") throw new Error("CourseBuild requires instructor approval before publishing.");
  if(!item.draftHtml) throw new Error("Approved item has no draft content.");
  if(!item.coursebuildKey) throw new Error("CourseBuild item key is required for safe publishing.");
  const base=(req.canvasBaseUrl||props().getProperty("CANVAS_BASE_URL")||"").replace(/\/$/,"");
  const token=props().getProperty("CANVAS_API_TOKEN"); const courseId=req.canvasCourseId;
  if(!base||!token||!courseId) throw new Error("Canvas connection is incomplete.");

  const marker="<!-- coursebuild-key:"+escapeMarker(item.coursebuildKey)+" -->";
  const body=marker+"\n"+item.draftHtml;
  const canvasModule=findOrCreateModule(base,token,courseId,module.title||"CourseBuild");
  const existing=findExistingCourseBuildItem(base,token,courseId,item,marker);
  let saved, operation;
  if(existing){ saved=updateExisting(base,token,courseId,item,existing,body); operation="updated"; }
  else { saved=createNew(base,token,courseId,item,body); operation="created"; }
  ensureModuleItem(base,token,courseId,canvasModule.id,item.type,saved,item.title);
  return { operation:operation, canvasId:saved.id||saved.page_id, canvasUrl:saved.html_url||saved.url||"", moduleId:canvasModule.id };
}
function escapeMarker(v){ return String(v).replace(/[^A-Za-z0-9_.:-]/g,"_"); }
function canvasRequest(base,token,path,method,payload){
  const options={method:method||"get",headers:{Authorization:"Bearer "+token},muteHttpExceptions:true};
  if(payload){options.contentType="application/json";options.payload=JSON.stringify(payload);}
  const res=UrlFetchApp.fetch(base+"/api/v1"+path,options); const raw=res.getContentText()||"{}"; let body;
  try{body=JSON.parse(raw);}catch(err){body={message:raw};}
  if(res.getResponseCode()>=300) throw new Error(body.message||"Canvas API request failed.");
  return body;
}
function findOrCreateModule(base,token,courseId,name){
  const modules=canvasRequest(base,token,"/courses/"+courseId+"/modules?per_page=100","get");
  const found=(modules||[]).find(m=>m.name===name);
  return found||canvasRequest(base,token,"/courses/"+courseId+"/modules","post",{module:{name:name,published:false}});
}
function findExistingCourseBuildItem(base,token,courseId,item,marker){
  if(item.canvasId) return {id:item.canvasId,url:item.canvasUrl||"",known:true};
  if(item.type==="Assignment"){
    const rows=canvasRequest(base,token,"/courses/"+courseId+"/assignments?per_page=100","get")||[];
    return rows.find(x=>String(x.description||"").indexOf(marker)>=0)||null;
  }
  if(item.type==="Discussion"){
    const rows=canvasRequest(base,token,"/courses/"+courseId+"/discussion_topics?per_page=100","get")||[];
    return rows.find(x=>String(x.message||"").indexOf(marker)>=0)||null;
  }
  const rows=canvasRequest(base,token,"/courses/"+courseId+"/pages?per_page=100","get")||[];
  for(var i=0;i<rows.length;i++){
    const page=canvasRequest(base,token,"/courses/"+courseId+"/pages/"+encodeURIComponent(rows[i].url),"get");
    if(String(page.body||"").indexOf(marker)>=0) return page;
  }
  return null;
}
function createNew(base,token,courseId,item,body){
  if(item.type==="Assignment") return canvasRequest(base,token,"/courses/"+courseId+"/assignments","post",{assignment:{name:item.title,description:body,points_possible:Number(item.points||0),submission_types:["online_upload"],published:false}});
  if(item.type==="Discussion") return canvasRequest(base,token,"/courses/"+courseId+"/discussion_topics","post",{title:item.title,message:body,published:false});
  return canvasRequest(base,token,"/courses/"+courseId+"/pages","post",{wiki_page:{title:item.title,body:body,published:false}});
}
function updateExisting(base,token,courseId,item,existing,body){
  if(item.type==="Assignment") return canvasRequest(base,token,"/courses/"+courseId+"/assignments/"+existing.id,"put",{assignment:{name:item.title,description:body,points_possible:Number(item.points||0),published:false}});
  if(item.type==="Discussion") return canvasRequest(base,token,"/courses/"+courseId+"/discussion_topics/"+existing.id,"put",{title:item.title,message:body,published:false});
  const pageUrl=existing.url||item.canvasUrl; if(!pageUrl) throw new Error("Existing Canvas page URL could not be resolved.");
  return canvasRequest(base,token,"/courses/"+courseId+"/pages/"+encodeURIComponent(pageUrl),"put",{wiki_page:{title:item.title,body:body,published:false}});
}
function ensureModuleItem(base,token,courseId,moduleId,type,created,title){
  const rows=canvasRequest(base,token,"/courses/"+courseId+"/modules/"+moduleId+"/items?per_page=100","get")||[];
  const canvasType=type==="Assignment"?"Assignment":type==="Discussion"?"Discussion":"Page";
  const exists=rows.some(x=>canvasType==="Page"?x.page_url===created.url:Number(x.content_id)===Number(created.id));
  if(exists) return {existing:true};
  const payload={module_item:{type:canvasType,title:title}};
  if(canvasType==="Page") payload.module_item.page_url=created.url; else payload.module_item.content_id=created.id;
  return canvasRequest(base,token,"/courses/"+courseId+"/modules/"+moduleId+"/items","post",payload);
}
