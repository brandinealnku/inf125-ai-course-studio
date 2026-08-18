const STORE_KEY = "coursebuild.pilot.v3";
const SETTINGS_KEY = "coursebuild.settings.v1";
const clone = (v) => JSON.parse(JSON.stringify(v));
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>'\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'\"':"&quot;"}[c]));
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

let data = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || clone(window.COURSEBUILD_SAMPLE);
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
let selectedItemId = data.items?.[0]?.id || null;
data.source ||= { text:"", fileName:"", importedAt:"", importMode:"sample" };
data.modules ||= [];
data.items ||= [];
data.versions ||= [];

function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function toast(message){ const el=$("#toast"); el.textContent=message; el.className="show"; setTimeout(()=>el.className="",3000); }
function statusClass(status){ const s=String(status).toLowerCase(); if(/approved|ready|sent|current|pass|updated/.test(s)) return "good"; if(/review|draft|custom|warning|attention/.test(s)) return "warn"; return "muted"; }
function badge(status){ return `<span class="badge ${statusClass(status)}">${esc(status)}</span>`; }
function moduleFor(item){ return data.modules.find(m=>m.id===item.moduleId); }
function itemKey(item){ return `${data.profile.code || "COURSE"}:${item.id}`; }

async function api(action,payload={}){
  if(!settings.appsScriptUrl) throw new Error("Add the Apps Script Web App URL in Settings first.");
  const res=await fetch(settings.appsScriptUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,course:data.profile,canvasCourseId:settings.canvasCourseId,canvasBaseUrl:settings.canvasBaseUrl,...payload})});
  const json=await res.json().catch(()=>({ok:false,error:"Backend did not return JSON."}));
  if(!res.ok||json.ok===false) throw new Error(json.error||"CourseBuild request failed.");
  return json.data||json;
}

function renderProfile(){
  $("#profile").innerHTML=`<div class="section-head"><div><p class="eyebrow">Course Profile</p><h2>${esc(data.profile.code||"New course")} · ${esc(data.profile.title||"Untitled")}</h2><p>Define the reusable course context once.</p></div>${badge("Configured")}</div><form id="profileForm" class="panel form"><div class="grid two"><label>Course code<input name="code" value="${esc(data.profile.code||"")}" placeholder="BUS 210"></label><label>Course title<input name="title" value="${esc(data.profile.title||"")}" placeholder="Business Analytics"></label><label>Institution<input name="institution" value="${esc(data.profile.institution||"")}" placeholder="Optional"></label><label>Audience<input name="audience" value="${esc(data.profile.audience||"")}" placeholder="Undergraduate students"></label><label>Credits<input name="credits" value="${esc(data.profile.credits||"")}" placeholder="3"></label><label>Delivery mode<select name="defaultDeliveryMode"><option>In-Person</option><option>Online</option><option>Hybrid</option><option>Flexible</option></select></label></div><label>Description<textarea name="description" rows="4">${esc(data.profile.description||"")}</textarea></label><label>Learning outcomes <span class="hint">one per line</span><textarea name="outcomes" rows="6">${esc((data.profile.outcomes||[]).join("\n"))}</textarea></label><label>Generation guardrails <span class="hint">one per line</span><textarea name="policies" rows="4">${esc((data.profile.policies||[]).join("\n"))}</textarea></label><button class="primary">Save course profile</button></form>`;
  const select=$("#profileForm select"); if(select) select.value=data.profile.defaultDeliveryMode||"In-Person";
  $("#profileForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);data.profile={...data.profile,...Object.fromEntries(f.entries()),outcomes:String(f.get("outcomes")||"").split(/\n+/).map(s=>s.trim()).filter(Boolean),policies:String(f.get("policies")||"").split(/\n+/).map(s=>s.trim()).filter(Boolean)};save();renderAll();toast("Course profile saved.");};
}

function sourceLabel(){ if(data.source.fileName) return `${data.source.fileName} · ${data.source.importMode}`; if(data.source.text) return `${data.source.text.length.toLocaleString()} characters · ${data.source.importMode}`; return "No source imported yet"; }
function renderPlan(){
  $("#plan").innerHTML=`<div class="section-head"><div><p class="eyebrow">Import + Architecture</p><h2>Bring the syllabus. Build the blueprint.</h2><p>Paste source text or choose a PDF/text file. CourseBuild proposes the structure before it generates course content.</p></div>${badge(data.source.text?"Source loaded":"Start here")}</div><div class="grid two"><article class="panel"><h3>1. Import course source</h3><label class="file-drop">Choose syllabus or course-plan file<input id="sourceFile" type="file" accept="application/pdf,text/plain,text/markdown,text/csv,text/html,.md,.txt,.csv,.html,.htm"></label><p class="hint">PDF pilot limit: 8 MB. PDFs require the secure Apps Script/Gemini backend.</p><div class="or"><span>or paste text</span></div><textarea id="sourceText" class="source-input" rows="12" placeholder="Paste your syllabus or course plan here…">${esc(data.source.text||"")}</textarea><div class="actions"><button id="saveSource">Save pasted source</button><button id="architectBtn" class="primary">Generate course architecture</button></div><p class="hint">${esc(sourceLabel())}</p></article><article class="panel"><h3>2. Proposed architecture</h3><div class="cards mini-cards"><article class="card"><span>Modules</span><strong>${data.modules.length}</strong></article><article class="card"><span>LMS items</span><strong>${data.items.length}</strong></article><article class="card"><span>Outcomes</span><strong>${(data.profile.outcomes||[]).length}</strong></article></div><p>The architecture is always a proposal. Nothing reaches Canvas until an instructor approves generated items.</p><button id="clearPlan">Clear generated plan</button></article></div><div class="architecture-list">${data.modules.map(m=>`<article class="panel module"><div class="module-head"><div><span class="module-number">${m.order}</span><h3>${esc(m.title)}</h3></div>${badge(m.status||"Planned")}</div><p>${esc(m.summary||"")}</p><div class="item-list">${data.items.filter(i=>i.moduleId===m.id).map(i=>`<button class="item-row" data-item="${i.id}"><span><b>${esc(i.type)}</b> · ${esc(i.title)}</span>${badge(i.status)}</button>`).join("")||"<p>No planned items yet.</p>"}</div></article>`).join("")}</div>`;
  $("#sourceFile").onchange=handleFileImport;
  $("#saveSource").onclick=()=>{data.source={text:$("#sourceText").value.trim(),fileName:"",importedAt:new Date().toISOString(),importMode:"paste"};save();renderPlan();toast("Source saved.");};
  $("#architectBtn").onclick=generateArchitectureFromText;
  $("#clearPlan").onclick=()=>{data.modules=[];data.items=[];selectedItemId=null;save();renderAll();toast("Generated plan cleared.");};
}

function readFileAsDataUrl(file){ return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error||new Error("File read failed."));r.readAsDataURL(file);}); }
async function handleFileImport(e){
  const file=e.target.files?.[0]; if(!file)return;
  try{
    if(file.type==="application/pdf" || /\.pdf$/i.test(file.name)){
      if(file.size>MAX_PDF_BYTES) throw new Error("For this pilot, choose a PDF smaller than 8 MB.");
      const dataUrl=await readFileAsDataUrl(file); const base64=dataUrl.split(",")[1];
      toast("Reading PDF and proposing course architecture…");
      const architecture=await api("importPdfArchitecture",{fileName:file.name,mimeType:"application/pdf",base64});
      applyArchitecture(architecture,{text:architecture.sourceDigest||"",fileName:file.name,importedAt:new Date().toISOString(),importMode:"PDF + Gemini"});
      return;
    }
    const text=await file.text();
    if(text.trim().length<80) throw new Error("The selected file does not contain enough readable course text.");
    data.source={text:text.trim(),fileName:file.name,importedAt:new Date().toISOString(),importMode:"file text"}; save(); renderPlan(); toast("File imported. Generate the course architecture when ready.");
  }catch(err){ toast(err.message); }
}

function localArchitecture(text){
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const weekLines=lines.filter(l=>/^(week|module|unit)\s*\d+/i.test(l)).slice(0,12);
  const titles=weekLines.length?weekLines:lines.filter(l=>l.length>6&&l.length<90&&!/[.!?]$/.test(l)).slice(0,6);
  const seeds=titles.length?titles:["Foundations","Core Concepts","Applied Practice","Analysis and Feedback","Integration and Reflection"];
  const modules=seeds.map((t,idx)=>({id:uid("m"),order:idx+1,title:t.replace(/^(week|module|unit)\s*\d+\s*[:.-]?\s*/i,"")||`Module ${idx+1}`,summary:"Planned from imported course source. Review scope and alignment before generation.",status:"Planned"}));
  const items=[]; modules.forEach((m,idx)=>{items.push({id:uid("i"),moduleId:m.id,type:"Page",title:`${m.title}: Overview`,purpose:"Introduce the module purpose, learning focus, and completion path.",status:"Planned",draftHtml:""});items.push({id:uid("i"),moduleId:m.id,type:idx%2===0?"Discussion":"Assignment",title:idx%2===0?`${m.title}: Discussion`:`${m.title}: Applied Work`,purpose:"Give learners a meaningful opportunity to apply or discuss the module focus.",points:idx%2===0?0:20,status:"Planned",draftHtml:""});});
  return {modules,items,sourceDigest:text.slice(0,24000)};
}
function applyArchitecture(architecture,source){
  if(!architecture?.modules?.length) architecture=localArchitecture(source.text||"");
  data.source=source;
  data.modules=architecture.modules.map((m,idx)=>({...m,id:m.id||uid("m"),order:m.order||idx+1,status:m.status||"Planned"}));
  const idByOrder=new Map(data.modules.map((m,idx)=>[idx+1,m.id]));
  data.items=(architecture.items||[]).map(i=>({...i,id:i.id||uid("i"),moduleId:i.moduleId||idByOrder.get(Number(i.moduleOrder)||1)||data.modules[0]?.id,status:"Planned",draftHtml:""}));
  if(architecture.sourceDigest) data.source.text=architecture.sourceDigest;
  selectedItemId=data.items[0]?.id||null; save(); renderAll(); showView("plan"); toast(`Architecture generated: ${data.modules.length} modules, ${data.items.length} items.`);
}
async function generateArchitectureFromText(){
  const text=$("#sourceText").value.trim() || data.source.text; if(text.length<80){toast("Paste or import more course source material first.");return;}
  let architecture; let mode="AI architecture";
  try{architecture=await api("generateCourseArchitecture",{sourceText:text});}
  catch(err){architecture=localArchitecture(text);mode="local architecture fallback";}
  applyArchitecture(architecture,{text,fileName:data.source.fileName||"",importedAt:new Date().toISOString(),importMode:mode});
}

function renderReview(){
  const item=data.items.find(i=>i.id===selectedItemId)||data.items[0];
  if(!item){$("#review").innerHTML="<div class='panel'><h3>No planned items yet.</h3><p>Import a course source and generate an architecture first.</p><button data-go-plan class='primary'>Go to Plan</button></div>";$("[data-go-plan]")?.addEventListener("click",()=>showView("plan"));return;}
  selectedItemId=item.id; const module=moduleFor(item);
  $("#review").innerHTML=`<div class="section-head"><div><p class="eyebrow">Human Review Gate</p><h2>${esc(item.title)}</h2><p>${esc(module?.title||"")} · ${esc(item.type)}</p></div>${badge(item.status)}</div><div class="grid two"><article class="panel"><h3>Intent</h3><p>${esc(item.purpose||"")}</p>${item.points?`<p><strong>${item.points} points</strong></p>`:""}<p class="hint">CourseBuild key: ${esc(itemKey(item))}</p><div class="actions"><button id="generateBtn" class="primary">Generate draft</button><button id="approveBtn">Approve</button></div></article><article class="panel"><h3>Draft</h3><div class="draft">${item.draftHtml||"<p class='muted-text'>No draft generated yet.</p>"}</div></article></div>`;
  $("#generateBtn").onclick=()=>generateItem(item.id); $("#approveBtn").onclick=()=>approveItem(item.id);
}

function readinessChecks(){ return [
  {label:"Course title and description",pass:Boolean(data.profile.title&&data.profile.description)},
  {label:"At least one learning outcome",pass:Boolean((data.profile.outcomes||[]).length)},
  {label:"Imported source retained",pass:Boolean(data.source.text)},
  {label:"Course architecture exists",pass:Boolean(data.modules.length&&data.items.length)},
  {label:"Every item belongs to a module",pass:data.items.length>0&&data.items.every(i=>moduleFor(i))},
  {label:"Every item has a purpose",pass:data.items.length>0&&data.items.every(i=>String(i.purpose||"").trim())},
  {label:"All planned content reviewed",pass:data.items.length>0&&data.items.every(i=>["Approved","Sent","Updated"].includes(i.status))},
  {label:"Canvas connection configured",pass:Boolean(settings.canvasBaseUrl&&settings.canvasCourseId&&settings.appsScriptUrl)}
]; }
function buildReadiness(){const checks=readinessChecks();const total=data.items.length,approved=data.items.filter(i=>["Approved","Sent","Updated"].includes(i.status)).length,sent=data.items.filter(i=>["Sent","Updated"].includes(i.status)).length;return {total,approved,sent,checks,passed:checks.filter(c=>c.pass).length,ready:checks.every(c=>c.pass)};}
function renderBuild(){
  const r=buildReadiness();
  $("#build").innerHTML=`<div class="section-head"><div><p class="eyebrow">Readiness + Build</p><h2>Safe to run more than once.</h2><p>CourseBuild checks readiness and uses stable item keys so repeat publishing updates CourseBuild-created Canvas objects instead of duplicating them.</p></div>${badge(r.ready?"Ready to build":"Not ready")}</div><div class="cards"><article class="card"><span>Readiness checks</span><strong>${r.passed}/${r.checks.length}</strong></article><article class="card"><span>Approved items</span><strong>${r.approved}/${r.total}</strong></article><article class="card"><span>Sent/updated</span><strong>${r.sent}</strong></article></div><article class="panel"><h3>Readiness audit</h3><div class="check-list">${r.checks.map(c=>`<div class="check-row"><span class="check-icon">${c.pass?"✓":"!"}</span><span>${esc(c.label)}</span>${badge(c.pass?"Pass":"Needs attention")}</div>`).join("")}</div></article><article class="panel"><h3>Canvas build preview</h3>${data.modules.map(m=>`<div class="build-module"><b>${esc(m.title)}</b>${data.items.filter(i=>i.moduleId===m.id).map(i=>`<div class="build-row"><span>${esc(i.type)} · ${esc(i.title)}</span>${badge(i.status)}</div>`).join("")}</div>`).join("")||"<p>No architecture generated yet.</p>"}<div class="actions"><button id="sendApproved" class="primary" ${r.approved===0?"disabled":""}>Build/update approved items in Canvas</button></div></article>`;
  $("#sendApproved").onclick=sendApproved;
}
function renderVersions(){ $("#versions").innerHTML=`<div class="section-head"><div><p class="eyebrow">Versions</p><h2>Build once. Adapt without starting over.</h2><p>Versions inherit from the approved master while tracking customization state.</p></div></div><div class="grid two">${data.versions.map(v=>`<article class="panel"><h3>${esc(v.name)}</h3><dl><dt>Mode</dt><dd>${esc(v.mode)}</dd><dt>Sync</dt><dd>${badge(v.syncStatus)}</dd></dl><button data-customize="${v.id}">Generate version plan</button></article>`).join("")}</div>`; }
function renderSettings(){ $("#settings").innerHTML=`<div class="section-head"><div><p class="eyebrow">Pilot Settings</p><h2>Connect the secure backend</h2><p>Never enter Gemini API keys or Canvas tokens in this browser UI.</p></div></div><form id="settingsForm" class="panel form"><label>Apps Script Web App URL<input name="appsScriptUrl" value="${esc(settings.appsScriptUrl||"")}"></label><label>Canvas Base URL<input name="canvasBaseUrl" value="${esc(settings.canvasBaseUrl||"")}" placeholder="https://institution.instructure.com"></label><label>Canvas Course ID<input name="canvasCourseId" value="${esc(settings.canvasCourseId||"")}"></label><button class="primary">Save pilot settings</button></form>`; $("#settingsForm").onsubmit=e=>{e.preventDefault();settings=Object.fromEntries(new FormData(e.currentTarget).entries());saveSettings();renderAll();toast("Settings saved.");}; }

async function generateItem(id){
  const item=data.items.find(i=>i.id===id); if(!item)return; item.status="Draft"; renderAll();
  try{const out=await api("generateItem",{item,module:moduleFor(item),outcomes:data.profile.outcomes,sourceText:data.source.text});item.draftHtml=out.draftHtml||out.html||"";item.status="Needs Review";}
  catch(err){item.draftHtml=`<h3>${esc(item.title)}</h3><p>${esc(item.purpose)}</p><p><strong>Pilot sample:</strong> Connect the secure backend to generate source-grounded content.</p>`;item.status="Needs Review";}
  save();renderAll();toast("Draft ready for review.");
}
function approveItem(id){const item=data.items.find(i=>i.id===id);if(!item)return;if(!item.draftHtml){toast("Generate a draft before approval.");return;}item.status="Approved";save();renderAll();toast("Item approved.");}
async function sendApproved(){
  const approved=data.items.filter(i=>i.status==="Approved"); if(!approved.length){toast("No newly approved items to build.");return;}
  for(const item of approved){try{const out=await api("publishItem",{item:{...item,coursebuildKey:itemKey(item)},module:moduleFor(item)});item.status=out.operation==="updated"?"Updated":"Sent";item.canvasUrl=out.canvasUrl||item.canvasUrl||"";item.canvasId=out.canvasId||item.canvasId||"";}catch(err){toast(err.message);break;}}
  save();renderAll();
}
function renderAll(){renderProfile();renderPlan();renderReview();renderBuild();renderVersions();renderSettings();bindDynamic();}
function bindDynamic(){document.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>{selectedItemId=b.dataset.item;showView("review");renderReview();});document.querySelectorAll("[data-customize]").forEach(b=>b.onclick=()=>toast("Version planning remains staged for the next product slice."));}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!==id));document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#closeModal").onclick=()=>$("#modal").close();
renderAll();