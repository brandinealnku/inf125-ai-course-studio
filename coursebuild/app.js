const STORE_KEY = "coursebuild.pilot.v2";
const SETTINGS_KEY = "coursebuild.settings.v1";
const clone = (v) => JSON.parse(JSON.stringify(v));
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

let data = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || clone(window.COURSEBUILD_SAMPLE);
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
let selectedItemId = data.items[0]?.id || null;
data.source ||= { text:"", importedAt:"", importMode:"sample" };
data.readiness ||= {};

function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function toast(message){ const el=$("#toast"); el.textContent=message; el.className="show"; setTimeout(()=>el.className="",2800); }
function statusClass(status){ const s=String(status).toLowerCase(); if(s.includes("approved")||s.includes("ready")||s.includes("sent")||s.includes("current")||s.includes("pass")) return "good"; if(s.includes("review")||s.includes("draft")||s.includes("custom")||s.includes("warning")) return "warn"; return "muted"; }
function badge(status){ return `<span class="badge ${statusClass(status)}">${esc(status)}</span>`; }
function outcomeList(){ return (data.profile.outcomes||[]).map(o=>`<li>${esc(o)}</li>`).join(""); }
function moduleFor(item){ return data.modules.find(m=>m.id===item.moduleId); }

async function api(action,payload={}){
  if(!settings.appsScriptUrl) throw new Error("Add the Apps Script Web App URL in Settings first.");
  const res=await fetch(settings.appsScriptUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,course:data.profile,canvasCourseId:settings.canvasCourseId,canvasBaseUrl:settings.canvasBaseUrl,...payload})});
  const json=await res.json().catch(()=>({ok:false,error:"Backend did not return JSON."}));
  if(!res.ok||json.ok===false) throw new Error(json.error||"CourseBuild request failed.");
  return json.data||json;
}

function renderProfile(){
  $("#profile").innerHTML=`<div class="section-head"><div><p class="eyebrow">Course Profile</p><h2>${esc(data.profile.code||"New course")} · ${esc(data.profile.title||"Untitled")}</h2><p>Define the course context once. CourseBuild uses this profile to plan and generate LMS content without course-specific code.</p></div>${badge("Configured")}</div>
  <form id="profileForm" class="panel form"><div class="grid two"><label>Course code<input name="code" value="${esc(data.profile.code||"")}" placeholder="BUS 210"></label><label>Course title<input name="title" value="${esc(data.profile.title||"")}" placeholder="Business Analytics"></label><label>Institution<input name="institution" value="${esc(data.profile.institution||"")}" placeholder="Optional"></label><label>Audience<input name="audience" value="${esc(data.profile.audience||"")}" placeholder="Undergraduate students"></label><label>Credits<input name="credits" value="${esc(data.profile.credits||"")}" placeholder="3"></label><label>Delivery mode<select name="defaultDeliveryMode"><option>In-Person</option><option>Online</option><option>Hybrid</option><option>Flexible</option></select></label></div><label>Description<textarea name="description" rows="4">${esc(data.profile.description||"")}</textarea></label><label>Learning outcomes <span class="hint">one per line</span><textarea name="outcomes" rows="6">${esc((data.profile.outcomes||[]).join("\n"))}</textarea></label><label>Generation guardrails <span class="hint">one per line</span><textarea name="policies" rows="4">${esc((data.profile.policies||[]).join("\n"))}</textarea></label><button class="primary">Save course profile</button></form>`;
  const select=$("#profileForm select"); if(select) select.value=data.profile.defaultDeliveryMode||"In-Person";
  $("#profileForm").onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);data.profile={...data.profile,...Object.fromEntries(f.entries()),outcomes:String(f.get("outcomes")||"").split(/\n+/).map(s=>s.trim()).filter(Boolean),policies:String(f.get("policies")||"").split(/\n+/).map(s=>s.trim()).filter(Boolean)};save();renderAll();toast("Course profile saved.");};
}

function renderPlan(){
  const sourceState=data.source.text?`${data.source.text.length.toLocaleString()} characters imported` : "No source imported yet";
  $("#plan").innerHTML=`<div class="section-head"><div><p class="eyebrow">Import + Architecture</p><h2>Turn a syllabus or course plan into an LMS blueprint.</h2><p>Paste source material, let CourseBuild propose the structure, then review every planned module and object before generating content.</p></div>${badge(data.source.text?"Source loaded":"Start here")}</div>
  <div class="grid two"><article class="panel"><h3>1. Import course source</h3><p class="muted-text">Paste a syllabus, outline, course planning document, or structured notes. PDF/file upload comes later; this pilot keeps source handling transparent.</p><textarea id="sourceText" class="source-input" rows="14" placeholder="Paste your syllabus or course plan here…">${esc(data.source.text||"")}</textarea><div class="actions"><button id="saveSource">Save source</button><button id="architectBtn" class="primary">Generate course architecture</button></div><p class="hint">${esc(sourceState)}</p></article>
  <article class="panel"><h3>2. Proposed architecture</h3><div class="cards mini-cards"><article class="card"><span>Modules</span><strong>${data.modules.length}</strong></article><article class="card"><span>LMS items</span><strong>${data.items.length}</strong></article><article class="card"><span>Outcomes</span><strong>${(data.profile.outcomes||[]).length}</strong></article></div><p>CourseBuild creates a proposal, not a final course. You remain the approval authority.</p><button id="clearPlan">Clear generated plan</button></article></div>
  <div class="architecture-list">${data.modules.map(m=>`<article class="panel module"><div class="module-head"><div><span class="module-number">${m.order}</span><h3>${esc(m.title)}</h3></div>${badge(m.status||"Planned")}</div><p>${esc(m.summary||"")}</p><div class="item-list">${data.items.filter(i=>i.moduleId===m.id).map(i=>`<button class="item-row" data-item="${i.id}"><span><b>${esc(i.type)}</b> · ${esc(i.title)}</span>${badge(i.status)}</button>`).join("")||"<p>No planned items yet.</p>"}</div></article>`).join("")}</div>`;
  $("#saveSource").onclick=()=>{data.source={text:$("#sourceText").value.trim(),importedAt:new Date().toISOString(),importMode:"paste"};save();renderPlan();toast("Source saved.");};
  $("#architectBtn").onclick=generateArchitecture;
  $("#clearPlan").onclick=()=>{data.modules=[];data.items=[];selectedItemId=null;save();renderAll();toast("Generated plan cleared.");};
}

function localArchitecture(text){
  const lines=text.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const weekLines=lines.filter(l=>/^(week|module|unit)\s*\d+/i.test(l)).slice(0,12);
  const titles=weekLines.length?weekLines:lines.filter(l=>l.length>6&&l.length<90&&!/[.!?]$/.test(l)).slice(0,6);
  const seeds=(titles.length?titles:["Foundations","Core Concepts","Applied Practice","Analysis and Feedback","Integration and Reflection"]);
  const modules=seeds.map((t,idx)=>({id:uid("m"),order:idx+1,title:t.replace(/^(week|module|unit)\s*\d+\s*[:.-]?\s*/i,"")||`Module ${idx+1}`,summary:`Planned from imported course source. Review scope and alignment before generation.`,status:"Planned"}));
  const items=[]; modules.forEach((m,idx)=>{items.push({id:uid("i"),moduleId:m.id,type:"Page",title:`${m.title}: Overview`,purpose:`Introduce the module purpose, learning focus, and completion path.`,status:"Planned",draftHtml:""});items.push({id:uid("i"),moduleId:m.id,type:idx%2===0?"Discussion":"Assignment",title:idx%2===0?`${m.title}: Discussion`:`${m.title}: Applied Work`,purpose:`Give learners a meaningful opportunity to apply or discuss the module focus.`,points:idx%2===0?0:20,status:"Planned",draftHtml:""});});
  return {modules,items};
}

async function generateArchitecture(){
  const text=$("#sourceText").value.trim(); if(text.length<80){toast("Paste more course source material first.");return;}
  data.source={text,importedAt:new Date().toISOString(),importMode:"paste"};
  let architecture;
  try{architecture=await api("generateCourseArchitecture",{sourceText:text});data.source.importMode="AI architecture";}
  catch(err){architecture=localArchitecture(text);data.source.importMode="local architecture fallback";}
  if(!architecture.modules?.length) architecture=localArchitecture(text);
  data.modules=architecture.modules.map((m,idx)=>({...m,id:m.id||uid("m"),order:m.order||idx+1,status:m.status||"Planned"}));
  const idByOrder=new Map(data.modules.map((m,idx)=>[idx+1,m.id]));
  data.items=(architecture.items||[]).map((i,idx)=>({...i,id:i.id||uid("i"),moduleId:i.moduleId||idByOrder.get(Number(i.moduleOrder)||1)||data.modules[0]?.id,status:"Planned",draftHtml:i.draftHtml||""}));
  selectedItemId=data.items[0]?.id||null; save(); renderAll(); showView("plan"); toast(`Architecture generated: ${data.modules.length} modules, ${data.items.length} items.`);
}

function renderReview(){
  const item=data.items.find(i=>i.id===selectedItemId)||data.items[0];
  if(!item){ $("#review").innerHTML="<div class='panel'><h3>No planned items yet.</h3><p>Import a course source and generate an architecture first.</p><button data-go-plan class='primary'>Go to Plan</button></div>"; $("[data-go-plan]")?.addEventListener("click",()=>showView("plan")); return; }
  selectedItemId=item.id; const module=moduleFor(item);
  $("#review").innerHTML=`<div class="section-head"><div><p class="eyebrow">Human Review Gate</p><h2>${esc(item.title)}</h2><p>${esc(module?.title||"")} · ${esc(item.type)}</p></div>${badge(item.status)}</div><div class="grid two"><article class="panel"><h3>Intent</h3><p>${esc(item.purpose||"")}</p>${item.points?`<p><strong>${item.points} points</strong></p>`:""}<div class="actions"><button id="generateBtn" class="primary">Generate draft</button><button id="approveBtn">Approve</button></div></article><article class="panel"><h3>Draft</h3><div class="draft">${item.draftHtml||"<p class='muted-text'>No draft generated yet.</p>"}</div></article></div>`;
  $("#generateBtn").onclick=()=>generateItem(item.id); $("#approveBtn").onclick=()=>approveItem(item.id);
}

function readinessChecks(){
  const checks=[
    {label:"Course title and description",pass:Boolean(data.profile.title&&data.profile.description)},
    {label:"At least one learning outcome",pass:Boolean((data.profile.outcomes||[]).length)},
    {label:"Imported source retained",pass:Boolean(data.source.text)},
    {label:"Course architecture exists",pass:Boolean(data.modules.length&&data.items.length)},
    {label:"Every item belongs to a module",pass:data.items.length>0&&data.items.every(i=>moduleFor(i))},
    {label:"Every item has a purpose",pass:data.items.length>0&&data.items.every(i=>String(i.purpose||"").trim())},
    {label:"All planned content reviewed",pass:data.items.length>0&&data.items.every(i=>["Approved","Sent"].includes(i.status))},
    {label:"Canvas connection configured",pass:Boolean(settings.canvasBaseUrl&&settings.canvasCourseId&&settings.appsScriptUrl)}
  ];
  return checks;
}
function buildReadiness(){const checks=readinessChecks();const total=data.items.length,approved=data.items.filter(i=>["Approved","Sent"].includes(i.status)).length,sent=data.items.filter(i=>i.status==="Sent").length;return {total,approved,sent,checks,passed:checks.filter(c=>c.pass).length,ready:checks.every(c=>c.pass)};}
function renderBuild(){
  const r=buildReadiness();
  $("#build").innerHTML=`<div class="section-head"><div><p class="eyebrow">Readiness + Build</p><h2>Know what is ready before Canvas changes.</h2><p>CourseBuild checks structure, review state, and connection requirements before publishing.</p></div>${badge(r.ready?"Ready to build":"Not ready")}</div><div class="cards"><article class="card"><span>Readiness checks</span><strong>${r.passed}/${r.checks.length}</strong></article><article class="card"><span>Approved items</span><strong>${r.approved}/${r.total}</strong></article><article class="card"><span>Sent</span><strong>${r.sent}</strong></article></div><article class="panel"><h3>Readiness audit</h3><div class="check-list">${r.checks.map(c=>`<div class="check-row"><span class="check-icon">${c.pass?"✓":"!"}</span><span>${esc(c.label)}</span>${badge(c.pass?"Pass":"Needs attention")}</div>`).join("")}</div></article><article class="panel"><h3>Canvas build preview</h3>${data.modules.map(m=>`<div class="build-module"><b>${esc(m.title)}</b>${data.items.filter(i=>i.moduleId===m.id).map(i=>`<div class="build-row"><span>${esc(i.type)} · ${esc(i.title)}</span>${badge(i.status)}</div>`).join("")}</div>`).join("")||"<p>No architecture generated yet.</p>"}<div class="actions"><button id="sendApproved" class="primary" ${r.approved===0?"disabled":""}>Send approved items to Canvas</button></div></article>`;
  $("#sendApproved").onclick=sendApproved;
}

function renderVersions(){ $("#versions").innerHTML=`<div class="section-head"><div><p class="eyebrow">Versions</p><h2>Build once. Adapt without starting over.</h2><p>Versions inherit from the approved master while tracking customization state.</p></div></div><div class="grid two">${(data.versions||[]).map(v=>`<article class="panel"><h3>${esc(v.name)}</h3><dl><dt>Mode</dt><dd>${esc(v.mode)}</dd><dt>Sync</dt><dd>${badge(v.syncStatus)}</dd></dl><button data-customize="${v.id}">Generate version plan</button></article>`).join("")}</div>`; }
function renderSettings(){ $("#settings").innerHTML=`<div class="section-head"><div><p class="eyebrow">Pilot Settings</p><h2>Connect the secure backend</h2><p>Never enter API keys or Canvas tokens in this browser UI.</p></div></div><form id="settingsForm" class="panel form"><label>Apps Script Web App URL<input name="appsScriptUrl" value="${esc(settings.appsScriptUrl||"")}"></label><label>Canvas Base URL<input name="canvasBaseUrl" value="${esc(settings.canvasBaseUrl||"")}" placeholder="https://institution.instructure.com"></label><label>Canvas Course ID<input name="canvasCourseId" value="${esc(settings.canvasCourseId||"")}"></label><button class="primary">Save pilot settings</button></form>`; $("#settingsForm").onsubmit=(e)=>{e.preventDefault();settings=Object.fromEntries(new FormData(e.currentTarget).entries());saveSettings();renderAll();toast("Settings saved.");}; }

async function generateItem(id){const item=data.items.find(i=>i.id===id);if(!item)return;item.status="Draft";renderAll();try{const out=await api("generateItem",{item,module:moduleFor(item),outcomes:data.profile.outcomes,sourceText:data.source.text});item.draftHtml=out.draftHtml||out.html||"";item.status="Needs Review";}catch(err){item.draftHtml=`<h3>${esc(item.title)}</h3><p>${esc(item.purpose)}</p><p><strong>Pilot sample:</strong> Connect the secure backend to generate source-grounded course content.</p>`;item.status="Needs Review";}save();renderAll();toast("Draft ready for review.");}
function approveItem(id){const item=data.items.find(i=>i.id===id);if(!item)return;if(!item.draftHtml){toast("Generate a draft before approval.");return;}item.status="Approved";save();renderAll();toast("Item approved.");}
async function sendApproved(){const approved=data.items.filter(i=>i.status==="Approved");if(!approved.length)return;for(const item of approved){try{const out=await api("publishItem",{item,module:moduleFor(item)});item.status="Sent";item.canvasUrl=out.canvasUrl||"";}catch(err){toast(err.message);break;}}save();renderAll();}

function renderAll(){renderProfile();renderPlan();renderReview();renderBuild();renderVersions();renderSettings();bindDynamic();}
function bindDynamic(){document.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>{selectedItemId=b.dataset.item;showView("review");renderReview();});document.querySelectorAll("[data-customize]").forEach(b=>b.onclick=()=>toast("Version generation is the next product slice."));}
function showView(id){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!==id));document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));}
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#closeModal").onclick=()=>$("#modal").close();
renderAll();
