const STORE = {
  profile: "inf125.v2.profile",
  modules: "inf125.v2.modules",
  memory: "inf125.v2.memory",
  queue: "inf125.v2.queue",
  export: "inf125.v2.export"
};

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneData(value) {
  return globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

const defaultProfile = {
  courseName: "Social Media and Society",
  courseNumber: "INF 125",
  semester: "Spring 2027",
  modality: "Hybrid with Canvas support",
  creditHours: "4",
  targetLevel: "Lower-division undergraduate students",
  meetingPattern: "Tuesday/Thursday 80-minute meetings plus weekly Canvas activities",
  description: "INF 125 examines how social media platforms shape identity, relationships, organizations, politics, culture, and information behavior. Students analyze platform affordances, data practices, creator economies, online communities, misinformation, digital well-being, and responsible participation.",
  instructorNotes: "Keep examples current, hands-on, and connected to student experience. Avoid assuming students want to become influencers; emphasize civic, professional, and ethical uses.",
  teachingStyle: "Applied, discussion-rich, scaffolded, inclusive, reflective",
  aiTone: "Warm, practical, student-facing, clear, and academically grounded"
};

const defaultModules = [
  ["Platform Society", "Explain how platforms mediate communication; identify affordances and constraints.", "Course launch, platform logics, attention, networked publics, and the difference between social media use and social media analysis."],
  ["Identity, Community, and Participation", "Analyze online identity performance; evaluate community norms and belonging.", "Students examine profiles, publics, context collapse, community moderation, and participation patterns."],
  ["Algorithms, Feeds, and Attention", "Describe recommender systems; assess attention and engagement incentives.", "A practical look at ranking, personalization, metrics, habit loops, and digital well-being."],
  ["Influencers, Labor, and Creator Economies", "Evaluate creator labor; connect monetization to platform governance.", "Creator case studies, sponsorship disclosure, authenticity, parasocial relationships, and invisible labor."],
  ["Misinformation and Information Quality", "Apply verification strategies; explain why false information spreads.", "Students practice lateral reading, source evaluation, and misinformation response planning."],
  ["Data, Privacy, and Surveillance", "Identify data flows; critique privacy tradeoffs and surveillance capitalism.", "Platform data collection, targeted ads, privacy settings, consent, and institutional responsibilities."],
  ["Online Harm, Safety, and Moderation", "Compare moderation approaches; propose inclusive safety practices.", "Harassment, content moderation, policy enforcement, accessibility, and support resources."],
  ["Social Media Futures Studio", "Synthesize course concepts; present a responsible platform intervention.", "Students complete a final applied design brief and reflect on responsible social media participation."],
].map((m, index) => ({
  id: createId(), week: index + 1, topic: m[0], objectives: m[1], lecture: m[2],
  readings: "Curated Canvas page with one scholarly excerpt, one current industry report, and one platform policy or help-center document.",
  activities: "Small-group platform analysis, exit ticket, and a practical media literacy check.",
  assignment: index === 7 ? "Final Responsible Platform Intervention Brief" : `Week ${index + 1} Applied Platform Analysis`,
  discussion: `What is one way ${m[0].toLowerCase()} changes how people communicate, learn, or organize? Use a concrete example.`,
  quiz: `5-question concept check aligned to Week ${index + 1} objectives.`,
  notes: "Add a current example before teaching. Include accessibility reminders for media content.",
  status: index < 2 ? "Approved" : index === 2 ? "Needs Review" : "Draft"
}));

const defaultMemory = [
  ["Department policy", "Accessibility baseline", "All Canvas pages should use headings, descriptive links, captions or transcripts for media, and plain-language instructions."],
  ["Instructor preference", "INF 125 teaching voice", "Use concrete platform examples, short explanations, and reflective prompts that invite students to connect personal experience with course concepts."],
  ["Approved assignment pattern", "Applied Platform Analysis", "Students select a platform artifact, connect it to a course concept, evaluate impacts, and propose one responsible practice."],
  ["Common rubric language", "Evidence and specificity", "Strong work uses specific evidence from the platform artifact and explains why the evidence supports the claim."],
  ["AI usage policy language", "Transparent AI support", "Students may use AI for brainstorming and revision support when permitted, but must disclose use and remain responsible for accuracy, citations, and original analysis."]
].map(([category, title, text]) => ({ id: createId(), category, title, text }));

function get(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : cloneData(fallback);
  } catch (error) {
    console.warn(`Resetting invalid localStorage data for ${key}`, error);
    return cloneData(fallback);
  }
}
function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not persist ${key}; continuing with in-memory state.`, error);
  }
}
let profile = get(STORE.profile, defaultProfile), modules = get(STORE.modules, defaultModules), memory = get(STORE.memory, defaultMemory), queue = get(STORE.queue, []);

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const esc = str => String(str ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

const pageNames = { dashboard:"Dashboard", profile:"Course Profile", modules:"Module Builder", generator:"AI Generator", review:"Approval Queue", canvasIntel:"Canvas Intelligence", memory:"Institutional Memory", export:"Canvas Export Center", alignment:"Accreditation Report" };
function navigate(id, updateHash = true){
  if(!$("#"+id)) id="dashboard";
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  $$(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
  $("#breadcrumb").textContent=pageNames[id];
  if (updateHash && location.hash.slice(1) !== id) history.replaceState(null, "", `#${id}`);
  $("#sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:"smooth"});
}
function toast(t,m){ $("#toastTitle").textContent=t; $("#toastMessage").textContent=m; $("#toast").classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$("#toast").classList.remove("show"),3000); }

function statusScore(){ return Math.round(modules.filter(m=>["Approved","Sent to Canvas"].includes(m.status)).length / modules.length * 100); }
function readinessScore(){ return Math.max(0, Math.min(100, statusScore() - modules.filter(m=>m.status==="Needs Review").length * 3 + queue.filter(q=>q.status==="Approved").length * 2)); }
function renderDashboard(){
  $("#courseOverview").innerHTML = `<article class="panel hero-card"><div><p class="eyebrow">${esc(profile.courseNumber)}</p><h2>${esc(profile.courseName)}</h2><p>${esc(profile.description)}</p><div class="badge-row"><span class="status neutral">${esc(profile.semester)}</span><span class="status neutral">${esc(profile.modality)}</span><span class="status neutral">${esc(profile.creditHours)} credits</span></div></div><div class="score-ring" style="--score:${readinessScore()}"><span><strong>${readinessScore()}</strong><small>Canvas readiness</small></span></div></article>`;
  $("#dashboardMetrics").innerHTML = [[modules.length,"Weeks planned","▤"],[statusScore()+"%","Content readiness","✓"],[queue.filter(q=>q.status==="Waiting Approval").length,"Pending approvals","◷"],[modules.filter(m=>m.status==="Sent to Canvas").length,"Sent to Canvas","↗"]].map(([v,l,i])=>`<article class="metric-card"><div class="metric-icon purple">${i}</div><span>${l}</span><strong>${v}</strong><small>Saved in browser localStorage</small></article>`).join("");
  $("#weeklyProgress").innerHTML = modules.map(m=>`<button class="week-chip" data-page-jump="modules"><b>W${m.week}</b><span>${esc(m.topic)}</span><i class="status ${statusClass(m.status)}">${m.status}</i></button>`).join("");
  $("#taskList").innerHTML = ["Review needs-review drafts", "Add rubrics for assignments without rubrics", "Check quiz objective alignment", "Approve final content before Canvas export"].map(t=>`<div class="task"><span>□</span><p>${t}<small>Suggested by Canvas Intelligence</small></p></div>`).join("");
  $("#quickActions").innerHTML = ["Module","Assignment","Quiz","Discussion","Rubric","Export Canvas package"].map(type=>`<button class="quick-card" data-action="quick" data-type="${type}"><span class="quick-icon purple">✦</span><div><strong>${type.startsWith("Export")?type:"Generate "+type.toLowerCase()}</strong><small>${type.startsWith("Export")?"Open Canvas Export Center":"Create a reviewable draft"}</small></div><b>→</b></button>`).join("");
}
function statusClass(s){ return s==="Approved"||s==="Sent to Canvas"?"success":s==="Needs Review"?"warning":"neutral"; }

function renderProfile(){ const fields = [["courseName","Course name"],["courseNumber","Course number"],["semester","Semester"],["modality","Modality"],["creditHours","Credit hours"],["targetLevel","Target student level"],["meetingPattern","Weekly meeting pattern"],["description","Course description","textarea"],["instructorNotes","Instructor notes","textarea"],["teachingStyle","Preferred teaching style"],["aiTone","AI generation tone"]]; $("#profileFields").innerHTML = fields.map(([k,l,t])=>`<label class="${t==='textarea'||k==='description'?'wide':''}">${l}${t==='textarea'?`<textarea name="${k}">${esc(profile[k])}</textarea>`:`<input name="${k}" value="${esc(profile[k])}">`}</label>`).join(""); }
function renderModules(){ $("#moduleBuilder").innerHTML = modules.map(m=>`<article class="panel module-edit"><div class="module-edit-head"><div><p class="eyebrow">WEEK ${m.week}</p><h2>${esc(m.topic)}</h2></div><span class="status ${statusClass(m.status)}">${m.status}</span></div>${["topic","objectives","lecture","readings","activities","assignment","discussion","quiz","notes"].map(k=>`<label>${labelFor(k)}<textarea data-module="${m.id}" data-field="${k}">${esc(m[k])}</textarea></label>`).join("")}<div class="button-row"><button class="secondary-btn" data-module-action="regen" data-id="${m.id}">Regenerate mock AI content</button><button class="secondary-btn" data-module-action="approve" data-id="${m.id}">Approve</button><button class="secondary-btn" data-module-action="sent" data-id="${m.id}">Mark sent to Canvas</button><button class="secondary-btn" data-module-action="duplicate" data-id="${m.id}">Duplicate</button><button class="primary-btn" data-module-action="markdown" data-id="${m.id}">Export markdown</button></div></article>`).join(""); }
function labelFor(k){ return ({topic:"Topic",objectives:"Learning objectives",lecture:"Lecture overview",readings:"Readings/resources",activities:"Practice activities",assignment:"Assignment",discussion:"Discussion prompt",quiz:"Quiz idea",notes:"Instructor notes"})[k]; }
function moduleMarkdown(m){ return `# Week ${m.week}: ${m.topic}\n\n## Learning Objectives\n${m.objectives}\n\n## Lecture Overview\n${m.lecture}\n\n## Readings / Resources\n${m.readings}\n\n## Practice Activities\n${m.activities}\n\n## Assignment\n${m.assignment}\n\n## Discussion\n${m.discussion}\n\n## Quiz Idea\n${m.quiz}\n\n## Instructor Notes\n${m.notes}\n`; }

function mockGenerate(type, module, prompt, contexts){
  // Future Gemini integration: replace this mock return with a fetch to your secure proxy or backendless-approved function.
  // Do not place Gemini API keys in GitHub Pages JavaScript. Send {type, prompt, contexts, profile, module, memory} to a protected endpoint later.
  const title = `${type}: ${module ? `Week ${module.week} ${module.topic}` : profile.courseNumber}`;
  const body = `Draft created in a ${profile.aiTone} tone.\n\nPurpose: Help INF 125 students connect ${module?.topic || "course concepts"} to real social media examples.\n\nStudent-facing directions:\n1. Review the Canvas materials.\n2. Apply one course concept to a current platform example.\n3. Explain the social impact and cite evidence.\n\nContext used: ${contexts.join(", ") || "prompt only"}.\n\nPrompt: ${prompt}`;
  return { id: createId(), title, type, week: module?.week || "Course", generated: new Date().toLocaleString(), status: "Waiting Approval", preview: body };
}
function renderGenerator(){ $("#selectedModule").innerHTML = modules.map(m=>`<option value="${m.id}">Week ${m.week}: ${esc(m.topic)}</option>`).join(""); }
function renderQueue(){ $("#reviewQueue").innerHTML = queue.length ? queue.map(q=>`<article class="panel review-card"><div class="panel-header"><div><h2>${esc(q.title)}</h2><p>${esc(q.type)} · ${esc(q.week)} · ${esc(q.generated)}</p></div><span class="status ${statusClass(q.status)}">${q.status}</span></div><pre>${esc(q.preview)}</pre><div class="button-row"><button class="secondary-btn" data-queue-action="edit" data-id="${q.id}">Edit</button><button class="secondary-btn" data-queue-action="approve" data-id="${q.id}">Approve</button><button class="secondary-btn" data-queue-action="reject" data-id="${q.id}">Reject</button><button class="primary-btn" data-queue-action="send" data-id="${q.id}">Send to Canvas</button></div></article>`).join("") : `<div class="empty-state"><span>✓</span><h3>No pending content</h3><p>Generated drafts will appear here for approval.</p></div>`; }

function renderCanvasIntel(){ const insights = [["Missing pages","Week 6 needs a Canvas overview page."],["Overloaded weeks","Weeks 5 and 8 contain the heaviest deliverables."],["Unpublished modules",`${modules.filter(m=>m.status!=="Sent to Canvas").length} modules are not marked sent.`],["Assignments without rubrics","Weeks 1, 3, and 5 need rubric drafts."],["Discussions without criteria","Add reply expectations and quality criteria."],["Quizzes without objective alignment","Tag each question to the week objective."],["Student workload balance","Move one reading from Week 5 to Week 4."],["Canvas readiness score",`${readinessScore()}/100`]]; $("#canvasInsights").innerHTML = `<div class="metric-grid">${insights.slice(0,4).map(([a,b])=>`<article class="metric-card"><span>${a}</span><strong>${b.split(' ')[0]}</strong><small>${b}</small></article>`).join("")}</div><div class="panel"><h2>Sample recommendations</h2><div class="recommendation-grid">${insights.slice(4).map(([a,b])=>`<article class="recommendation idea-card"><span>✦</span><div><strong>${a}</strong><p>${b}</p></div></article>`).join("")}</div></div>`; }
function renderMemory(){ $("#memoryStats").innerHTML = ["Policies","Patterns","Rubrics","Support"].map((l,i)=>`<div><strong>${memory.filter((_,idx)=>idx%4===i).length}</strong><span>${l}</span></div>`).join(""); $("#memoryList").innerHTML = memory.map(e=>`<article class="memory-entry"><span class="status neutral">${esc(e.category)}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><button class="text-btn" data-memory-action="edit" data-id="${e.id}">Edit</button><button class="text-btn danger-text" data-memory-action="delete" data-id="${e.id}">Delete</button></article>`).join(""); }
function renderExport(){ $("#exportModules").innerHTML = modules.map(m=>`<label><input type="checkbox" value="${m.id}" checked><span>W${m.week}</span><b>${esc(m.topic)}</b><small>${m.status}</small></label>`).join(""); }
function alignmentData(){ return { outcomes:["Analyze social media platforms using communication and information concepts.","Evaluate ethical, privacy, and social impacts of platform design.","Create evidence-based recommendations for responsible social media participation."], gaps:["Rubric language is incomplete for two applied analyses.","Quiz alignment tags need to be added for Weeks 5–7."], recommendations:["Add objective IDs to quizzes.","Attach the common evidence rubric to all applied analyses.","Include accessibility checks in each Canvas page."] }; }
function renderAlignment(){ const data=alignmentData(); $("#alignmentReport").innerHTML = `<div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>Outcome</th><th>Modules</th><th>Assignments</th><th>Quizzes</th><th>Discussions</th><th>Status</th></tr></thead><tbody>${data.outcomes.map((o,i)=>`<tr><td>${esc(o)}</td><td>Weeks ${i+1}, ${i+4}, ${i+6}</td><td>${i+2} mapped</td><td>${i===1?'Needs tags':'Aligned'}</td><td>Weekly prompt mapped</td><td><span class="status ${i===1?'warning':'success'}">${i===1?'Gap':'Aligned'}</span></td></tr>`).join("")}</tbody></table></div></div><div class="recommendation-grid">${[...data.gaps,...data.recommendations].map(x=>`<article class="recommendation warning-card"><span>!</span><div><strong>Action</strong><p>${esc(x)}</p></div></article>`).join("")}</div>`; }

function renderAll(){ renderDashboard(); renderProfile(); renderModules(); renderGenerator(); renderQueue(); renderCanvasIntel(); renderMemory(); renderExport(); renderAlignment(); }

document.addEventListener("click", e => {
  const jump=e.target.closest("[data-page-jump]"); if(jump) navigate(jump.dataset.pageJump);
  const nav=e.target.closest(".nav-link[data-page]"); if(nav) navigate(nav.dataset.page);
  const quick=e.target.closest("[data-action='quick']"); if(quick){ if(quick.dataset.type.startsWith("Export")) navigate("export"); else { navigate("generator"); $("#contentType").value=quick.dataset.type; } }
  const ma=e.target.closest("[data-module-action]"); if(ma){ const m=modules.find(x=>x.id===ma.dataset.id); if(!m) return; const a=ma.dataset.moduleAction; if(a==="regen"){ Object.assign(m, { lecture:`Updated mock AI lecture overview for ${m.topic}, with a current platform case and an active-learning checkpoint.`, status:"Needs Review" }); toast("Module regenerated",`Week ${m.week} moved to review.`); } if(a==="approve") m.status="Approved"; if(a==="sent") m.status="Sent to Canvas"; if(a==="duplicate"){ modules.splice(modules.indexOf(m)+1,0,{...m,id:createId(),week:modules.length+1,topic:m.topic+" (copy)",status:"Draft"}); } if(a==="markdown"){ download(`inf125-week-${m.week}.md`, moduleMarkdown(m)); toast("Markdown exported",`Week ${m.week} downloaded.`); } set(STORE.modules,modules); renderAll(); }
  const qa=e.target.closest("[data-queue-action]"); if(qa){ const q=queue.find(x=>x.id===qa.dataset.id); if(!q) return; const a=qa.dataset.queueAction; if(a==="edit"){ const next=prompt("Edit generated content", q.preview); if(next!==null) q.preview=next; } if(a==="approve") q.status="Approved"; if(a==="reject") q.status="Rejected"; if(a==="send") q.status="Sent to Canvas"; set(STORE.queue,queue); toast("Queue updated",`${q.title} is ${q.status}.`); renderAll(); }
  const mem=e.target.closest("[data-memory-action]"); if(mem){ const item=memory.find(x=>x.id===mem.dataset.id); if(!item) return; if(mem.dataset.memoryAction==="edit"){ $("#memoryId").value=item.id; $("#memoryCategory").value=item.category; $("#memoryTitle").value=item.title; $("#memoryText").value=item.text; } else { memory=memory.filter(x=>x.id!==item.id); set(STORE.memory,memory); renderAll(); toast("Memory deleted", item.title); } }
});
$("#menuBtn").onclick=()=>$("#sidebar").classList.toggle("open");
$("#profileForm").onsubmit=e=>{ e.preventDefault(); profile=Object.fromEntries(new FormData(e.target).entries()); set(STORE.profile,profile); renderAll(); toast("Profile saved","INF 125 course profile updated."); };
document.addEventListener("input", e=>{ if(e.target.matches("[data-module][data-field]")){ const m=modules.find(x=>x.id===e.target.dataset.module); m[e.target.dataset.field]=e.target.value; set(STORE.modules,modules); }});
$("#generatorForm").onsubmit=e=>{ e.preventDefault(); const contexts=$$(".context-box input:checked").map(i=>i.parentElement.textContent.trim()); const m=modules.find(x=>x.id===$("#selectedModule").value); const item=mockGenerate($("#contentType").value,m,$("#generatorPrompt").value,contexts); queue.unshift(item); set(STORE.queue,queue); $("#generatorOutput").innerHTML=`<h2>${esc(item.title)}</h2><pre>${esc(item.preview)}</pre><button class="primary-btn" data-page-jump="review">Review for approval</button>`; renderQueue(); toast("Draft generated","Added to approval queue."); };
$("#memoryForm").onsubmit=e=>{ e.preventDefault(); const id=$("#memoryId").value || createId(); const item={id,category:$("#memoryCategory").value,title:$("#memoryTitle").value,text:$("#memoryText").value}; memory = memory.some(x=>x.id===id) ? memory.map(x=>x.id===id?item:x) : [item,...memory]; set(STORE.memory,memory); e.target.reset(); $("#memoryId").value=""; renderAll(); toast("Memory saved",item.title); };
$("#useMemoryBtn").onclick=()=>{ navigate("generator"); $("#generatorPrompt").value="Use institutional memory to generate content aligned with INF 125 policies, rubrics, support language, and teaching preferences."; toast("Memory attached","Institutional Memory context selected."); };
$("#resetDemoBtn").onclick=()=>{
  try {
    Object.values(STORE).forEach(k=>localStorage.removeItem(k));
  } catch (error) {
    console.warn("Could not clear localStorage; resetting in-memory data.", error);
  }
  location.reload();
};
$("#addModuleBtn").onclick=()=>{ modules.push({...defaultModules[0],id:createId(),week:modules.length+1,topic:"New INF 125 Module",status:"Draft"}); set(STORE.modules,modules); renderAll(); };
function exportPayload(){ return { profile, modules, memory, queue, exportedAt:new Date().toISOString() }; }
function download(name,text){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"})); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
$("#downloadJsonBtn").onclick=()=>download("inf125-course-export.json", JSON.stringify(exportPayload(),null,2));
$("#downloadMarkdownBtn").onclick=()=>download("inf125-course-export.md", modules.map(moduleMarkdown).join("\n---\n"));
$("#copyHtmlBtn").onclick=async()=>{ const html=modules.map(m=>`<h2>Week ${m.week}: ${esc(m.topic)}</h2><p>${esc(m.lecture)}</p>`).join("\n"); $("#exportOutput").textContent=html; try { await navigator.clipboard?.writeText(html); toast("Copied HTML","Canvas-ready HTML copied."); } catch (error) { toast("HTML preview ready","Copy from the export preview below."); } };
$("#checklistBtn").onclick=()=>$("#exportOutput").textContent=["Canvas import checklist","1. Create modules in Canvas.","2. Paste pages and verify headings.","3. Add assignments and rubrics.","4. Publish only approved modules.","5. Run accessibility checker."].join("\n");
$("#exportSelectedBtn").onclick=()=>{ set(STORE.export,{selected:$$('#exportModules input:checked').map(i=>i.value),date:new Date().toISOString()}); toast("Export prepared","Selected package saved locally."); /* Future Canvas API integration: POST selected modules to Canvas through a secure backend/OAuth flow here, never directly with a hardcoded token. */ };
$("#exportApprovedBtn").onclick=()=>{ $("#exportOutput").textContent=JSON.stringify(modules.filter(m=>["Approved","Sent to Canvas"].includes(m.status)),null,2); toast("Approved content exported","Preview generated."); };
function alignmentMarkdown(){
  const data = alignmentData();
  return `# INF 125 Accreditation & Alignment Report\n\n## Course Outcomes\n${data.outcomes.map((o, i) => `${i + 1}. ${o}`).join("\n")}\n\n## Gaps\n${data.gaps.map(g => `- ${g}`).join("\n")}\n\n## Recommendations\n${data.recommendations.map(r => `- ${r}`).join("\n")}\n`;
}
$("#alignmentMdBtn").onclick=()=>download("inf125-alignment-report.md", alignmentMarkdown());
$("#alignmentJsonBtn").onclick=()=>download("inf125-alignment-report.json", JSON.stringify(alignmentData(),null,2));
window.addEventListener("hashchange",()=>navigate(location.hash.slice(1)||"dashboard", false));
renderAll(); navigate(location.hash.slice(1)||"dashboard", false);
