const STORE_KEY = "coursebuild.pilot.v1";
const SETTINGS_KEY = "coursebuild.settings.v1";
const clone = (v) => JSON.parse(JSON.stringify(v));
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

let data = JSON.parse(localStorage.getItem(STORE_KEY) || "null") || clone(window.COURSEBUILD_SAMPLE);
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
let selectedItemId = data.items[0]?.id || null;

function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
function saveSettings(){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
function toast(message){ const el=$("#toast"); el.textContent=message; el.className="show"; setTimeout(()=>el.className="",2600); }
function statusClass(status){ const s=String(status).toLowerCase(); if(s.includes("approved")||s.includes("ready")||s.includes("sent")||s.includes("current")) return "good"; if(s.includes("review")||s.includes("draft")||s.includes("custom")) return "warn"; return "muted"; }
function badge(status){ return `<span class="badge ${statusClass(status)}">${esc(status)}</span>`; }
function outcomeList(){ return data.profile.outcomes.map(o=>`<li>${esc(o)}</li>`).join(""); }
function moduleFor(item){ return data.modules.find(m=>m.id===item.moduleId); }

async function api(action,payload={}){
  if(!settings.appsScriptUrl) throw new Error("Add the Apps Script Web App URL in Settings first.");
  const res=await fetch(settings.appsScriptUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,course:data.profile,canvasCourseId:settings.canvasCourseId,canvasBaseUrl:settings.canvasBaseUrl,...payload})});
  const json=await res.json().catch(()=>({ok:false,error:"Backend did not return JSON."}));
  if(!res.ok||json.ok===false) throw new Error(json.error||"CourseBuild request failed.");
  return json.data||json;
}

function renderProfile(){
  $("#profile").innerHTML=`<div class="section-head"><div><p class="eyebrow">Course Profile</p><h2>${esc(data.profile.code)} · ${esc(data.profile.title)}</h2><p>This profile is the context CourseBuild uses instead of hard-coded course logic.</p></div>${badge("Configured")}</div>
  <div class="grid two"><article class="panel"><h3>Course context</h3><dl><dt>Institution</dt><dd>${esc(data.profile.institution||"Not specified")}</dd><dt>Audience</dt><dd>${esc(data.profile.audience)}</dd><dt>Credits</dt><dd>${esc(data.profile.credits)}</dd><dt>Default delivery</dt><dd>${esc(data.profile.defaultDeliveryMode)}</dd><dt>Tone</dt><dd>${esc(data.profile.tone)}</dd></dl></article>
  <article class="panel"><h3>Learning outcomes</h3><ol>${outcomeList()}</ol></article></div>
  <article class="panel"><h3>Description</h3><p>${esc(data.profile.description)}</p><h4>Generation guardrails</h4><ul>${data.profile.policies.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></article>`;
}

function renderPlan(){
  $("#plan").innerHTML=`<div class="section-head"><div><p class="eyebrow">Course Plan</p><h2>Modules and intended LMS objects</h2><p>CourseBuild separates course architecture from generated content.</p></div></div>
  ${data.modules.map(m=>`<article class="panel module"><div class="module-head"><div><span class="module-number">${m.order}</span><h3>${esc(m.title)}</h3></div>${badge(m.status)}</div><p>${esc(m.summary)}</p><div class="item-list">${data.items.filter(i=>i.moduleId===m.id).map(i=>`<button class="item-row" data-item="${i.id}"><span><b>${esc(i.type)}</b> · ${esc(i.title)}</span>${badge(i.status)}</button>`).join("")||"<p>No planned items yet.</p>"}</div></article>`).join("")}`;
}

function renderReview(){
  const item=data.items.find(i=>i.id===selectedItemId)||data.items[0];
  if(!item){ $("#review").innerHTML="<div class='panel'>No course items yet.</div>"; return; }
  selectedItemId=item.id;
  const module=moduleFor(item);
  $("#review").innerHTML=`<div class="section-head"><div><p class="eyebrow">Human Review Gate</p><h2>${esc(item.title)}</h2><p>${esc(module?.title||"")} · ${esc(item.type)}</p></div>${badge(item.status)}</div>
  <div class="grid two"><article class="panel"><h3>Intent</h3><p>${esc(item.purpose)}</p>${item.points?`<p><strong>${item.points} points</strong></p>`:""}<div class="actions"><button id="generateBtn" class="primary">Generate draft</button><button id="approveBtn">Approve</button></div></article>
  <article class="panel"><h3>Draft</h3><div class="draft">${item.draftHtml||"<p class='muted-text'>No draft generated yet.</p>"}</div></article></div>`;
  $("#generateBtn").onclick=()=>generateItem(item.id);
  $("#approveBtn").onclick=()=>approveItem(item.id);
}

function buildReadiness(){
  const total=data.items.length, approved=data.items.filter(i=>["Approved","Ready","Sent"].includes(i.status)).length, sent=data.items.filter(i=>i.status==="Sent").length;
  return {total,approved,sent,ready:total>0&&approved===total};
}
function renderBuild(){
  const r=buildReadiness();
  $("#build").innerHTML=`<div class="section-head"><div><p class="eyebrow">Build</p><h2>Preview before Canvas</h2><p>Nothing is sent until the instructor approves it.</p></div>${badge(r.ready?"Ready":"Needs review")}</div>
  <div class="cards"><article class="card"><span>Planned items</span><strong>${r.total}</strong></article><article class="card"><span>Approved</span><strong>${r.approved}</strong></article><article class="card"><span>Sent</span><strong>${r.sent}</strong></article></div>
  <article class="panel"><h3>Canvas build preview</h3>${data.modules.map(m=>`<div class="build-module"><b>${esc(m.title)}</b>${data.items.filter(i=>i.moduleId===m.id).map(i=>`<div class="build-row"><span>${esc(i.type)} · ${esc(i.title)}</span>${badge(i.status)}</div>`).join("")}</div>`).join("")}<div class="actions"><button id="sendApproved" class="primary" ${r.approved===0?"disabled":""}>Send approved items to Canvas</button></div></article>`;
  $("#sendApproved").onclick=sendApproved;
}

function renderVersions(){
  $("#versions").innerHTML=`<div class="section-head"><div><p class="eyebrow">Versions</p><h2>Build once. Adapt without starting over.</h2><p>Versions inherit from the master while tracking customization state.</p></div></div><div class="grid two">${data.versions.map(v=>`<article class="panel"><h3>${esc(v.name)}</h3><dl><dt>Mode</dt><dd>${esc(v.mode)}</dd><dt>Sync</dt><dd>${badge(v.syncStatus)}</dd></dl><button data-customize="${v.id}">Generate version plan</button></article>`).join("")}</div>`;
}

function renderSettings(){
  $("#settings").innerHTML=`<div class="section-head"><div><p class="eyebrow">Pilot Settings</p><h2>Connect the secure backend</h2><p>Never enter API keys or Canvas tokens in this browser UI.</p></div></div><form id="settingsForm" class="panel form"><label>Apps Script Web App URL<input name="appsScriptUrl" value="${esc(settings.appsScriptUrl||"")}"></label><label>Canvas Base URL<input name="canvasBaseUrl" value="${esc(settings.canvasBaseUrl||"")}" placeholder="https://institution.instructure.com"></label><label>Canvas Course ID<input name="canvasCourseId" value="${esc(settings.canvasCourseId||"")}"></label><button class="primary">Save pilot settings</button></form>`;
  $("#settingsForm").onsubmit=(e)=>{e.preventDefault(); const f=new FormData(e.currentTarget); settings=Object.fromEntries(f.entries()); saveSettings(); toast("Settings saved.");};
}

async function generateItem(id){
  const item=data.items.find(i=>i.id===id); if(!item)return;
  item.status="Draft"; renderAll();
  try { const out=await api("generateItem",{item,module:moduleFor(item),outcomes:data.profile.outcomes}); item.draftHtml=out.draftHtml||out.html||""; item.status="Needs Review"; }
  catch(err){ item.draftHtml=`<h3>${esc(item.title)}</h3><p>${esc(item.purpose)}</p><p><strong>Pilot sample:</strong> Connect the secure backend to generate course-specific content.</p>`; item.status="Needs Review"; }
  save(); renderAll(); toast("Draft ready for review.");
}
function approveItem(id){ const item=data.items.find(i=>i.id===id); if(!item)return; if(!item.draftHtml){toast("Generate a draft before approval.");return;} item.status="Approved"; save(); renderAll(); toast("Item approved."); }
async function sendApproved(){
  const approved=data.items.filter(i=>i.status==="Approved"); if(!approved.length)return;
  for(const item of approved){ try{ const out=await api("publishItem",{item,module:moduleFor(item)}); item.status="Sent"; item.canvasUrl=out.canvasUrl||""; }catch(err){ toast(err.message); break; } }
  save(); renderAll();
}

function renderAll(){ renderProfile(); renderPlan(); renderReview(); renderBuild(); renderVersions(); renderSettings(); bindDynamic(); }
function bindDynamic(){
  document.querySelectorAll("[data-item]").forEach(b=>b.onclick=()=>{selectedItemId=b.dataset.item; showView("review"); renderReview();});
  document.querySelectorAll("[data-customize]").forEach(b=>b.onclick=()=>toast("Version planning is staged for the next pilot slice."));
}
function showView(id){ document.querySelectorAll(".view").forEach(v=>v.classList.toggle("hidden",v.id!==id)); document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id)); }
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$("#closeModal").onclick=()=>$("#modal").close();
renderAll();
