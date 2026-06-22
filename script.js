const pages = document.querySelectorAll(".page");
const navLinks = document.querySelectorAll(".nav-link[data-page]");
const breadcrumb = document.getElementById("breadcrumb");
const sidebar = document.getElementById("sidebar");

const pageNames = {
  dashboard: "Dashboard",
  architect: "Course Architect",
  generator: "AI Course Generator",
  canvas: "Canvas Export",
  workload: "Workload Analyzer",
  alignment: "Alignment Engine",
  health: "Course Health Dashboard",
  collaboration: "Faculty Collaboration",
  memory: "Institutional Memory",
  accreditation: "Accreditation Assistant",
  settings: "Settings"
};

function navigate(pageId, updateHash = true) {
  if (!document.getElementById(pageId)) pageId = "dashboard";
  pages.forEach(page => page.classList.toggle("active", page.id === pageId));
  navLinks.forEach(link => link.classList.toggle("active", link.dataset.page === pageId));
  breadcrumb.textContent = pageNames[pageId];
  if (updateHash) history.replaceState(null, "", `#${pageId}`);
  sidebar.classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navLinks.forEach(link => link.addEventListener("click", () => navigate(link.dataset.page)));
document.querySelectorAll("[data-page-jump]").forEach(button =>
  button.addEventListener("click", () => navigate(button.dataset.pageJump))
);
document.getElementById("menuBtn").addEventListener("click", () => sidebar.classList.toggle("open"));

window.addEventListener("hashchange", () => navigate(location.hash.slice(1) || "dashboard", false));
navigate(location.hash.slice(1) || "dashboard", false);

function showToast(title, message) {
  const toast = document.getElementById("toast");
  document.getElementById("toastTitle").textContent = title;
  document.getElementById("toastMessage").textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function loadingMarkup(label = "Generating with AI...") {
  return `<div class="loading-state"><div class="loading-orb"></div><h3>${label}</h3><p>Analyzing outcomes, standards, and learning design patterns.</p></div>`;
}

document.getElementById("architectureForm").addEventListener("submit", event => {
  event.preventDefault();
  const output = document.getElementById("architectureOutput");
  const name = document.getElementById("courseName").value || "Untitled Course";
  const code = document.getElementById("courseCode").value || "NEW 101";
  output.innerHTML = loadingMarkup();
  setTimeout(() => {
    output.innerHTML = `
      <div class="ai-output">
        <div class="output-title"><p class="eyebrow">AI-GENERATED ARCHITECTURE</p><h2>${code} · ${name}</h2><small>Aligned to HLC Teaching & Learning criteria</small></div>
        <h3>Course outcomes</h3>
        <ul class="output-list">
          <li><b>CO1</b> Evaluate competing ethical frameworks for emerging digital systems.</li>
          <li><b>CO2</b> Analyze the social impact of algorithmic decision-making using credible evidence.</li>
          <li><b>CO3</b> Construct a defensible ethical position for a complex technology case.</li>
          <li><b>CO4</b> Communicate recommendations to technical and non-technical audiences.</li>
        </ul>
        <h3>Learning architecture</h3>
        <ul class="output-list"><li>Foundations → Applied analysis → Stakeholder inquiry → Ethical intervention</li><li>Signature assessment: Digital Ethics Impact Brief</li><li>Evidence: Case analyses, deliberation logs, portfolio defense</li></ul>
        <h3>Competencies & skills</h3>
        <div class="skills"><span>Ethical reasoning</span><span>Systems thinking</span><span>Evidence synthesis</span><span>Stakeholder analysis</span><span>Public communication</span></div>
      </div>`;
    showToast("Architecture generated", "Your editable course foundation is ready.");
  }, 1400);
});

const moduleCount = document.getElementById("moduleCount");
moduleCount.addEventListener("input", () => document.getElementById("moduleCountValue").textContent = moduleCount.value);

const moduleTopics = [
  ["Ethics in a Digital World", "Frameworks, values, and technological change"],
  ["Data, Privacy & Consent", "The ethics of collection, inference, and ownership"],
  ["Algorithmic Bias", "How systems reproduce and amplify inequity"],
  ["Platform Power", "Governance, speech, and the attention economy"],
  ["AI & Human Agency", "Automation, responsibility, and meaningful choice"],
  ["Designing for Justice", "Participatory design and inclusive innovation"],
  ["Policy & Accountability", "From voluntary principles to enforceable rules"],
  ["Ethical Futures Studio", "Defending a responsible technology intervention"]
];

document.getElementById("generateContentBtn").addEventListener("click", () => {
  const output = document.getElementById("modulesOutput");
  output.innerHTML = loadingMarkup("Generating with AI...");
  setTimeout(() => {
    const count = Number(moduleCount.value);
    let cards = "";
    for (let i = 0; i < count; i++) {
      const topic = moduleTopics[i % moduleTopics.length];
      cards += `<article class="module-card"><span class="week">W${i + 1}</span><div><strong>${topic[0]}</strong><p>${topic[1]} · Reading · Applied activity · ${i % 2 ? "Discussion" : "Case analysis"}</p></div><button>Open →</button></article>`;
    }
    output.innerHTML = `<div class="panel-header"><div><h2>Course sequence</h2><p>PHI 245 · Foundations of Digital Ethics</p></div><span class="status success">${count} modules generated</span></div><div class="module-list">${cards}</div>`;
    showToast("Course content generated", `${count} modules are ready to review.`);
  }, 1600);
});

document.getElementById("canvasExportBtn").addEventListener("click", event => {
  const button = event.currentTarget;
  button.textContent = "Validating package…";
  button.disabled = true;
  setTimeout(() => {
    button.textContent = "✓ Package prepared";
    document.getElementById("canvasSuccess").classList.add("show");
    showToast("Canvas package ready", "62 course items passed validation.");
  }, 1200);
});

const workloadData = [
  [2.5,2,1,.8],[3,2.5,.7,1],[4,1.5,.8,.6],[3.2,3,1,.8],
  [4,5.5,1.5,1.6],[2.5,4.2,.8,1],[3.5,5,1.2,1.3],[2.5,2.8,.8,1],
  [3,3.5,1,.8],[3.5,2.2,1.2,1],[2.8,4,.8,1.4],[2.4,2.5,1,.8]
];
document.getElementById("workloadChart").innerHTML = workloadData.map((values, index) => {
  const total = values.reduce((sum, value) => sum + value, 0);
  return `<div class="bar-week"><div class="stack" title="${total.toFixed(1)} hours" style="height:${total * 15}px"><i class="read" style="height:${values[0] * 15}px"></i><i class="assign" style="height:${values[1] * 15}px"></i><i class="video" style="height:${values[2] * 15}px"></i><i class="discuss" style="height:${values[3] * 15}px"></i></div><label>W${index + 1}</label></div>`;
}).join("");

document.getElementById("historianForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.getElementById("historianInput");
  const query = input.value.trim();
  if (!query) return;
  const chat = document.getElementById("historianChat");
  chat.innerHTML += `<div class="user-bubble">${query}</div><div class="ai-bubble" id="thinking">Searching connected history…</div>`;
  input.value = "";
  chat.scrollTop = chat.scrollHeight;
  setTimeout(() => {
    const thinking = document.getElementById("thinking");
    thinking.removeAttribute("id");
    thinking.innerHTML = `<b>Here’s what I found:</b><br>The current assignment was introduced by Dr. Maya Chen in August 2021 after assessment data showed students struggled to apply theory independently. It added two scaffolded checkpoints and was later mapped to HLC Criterion 4.B in January 2025. <span style="color:#b7a9ff">View 4 sources →</span>`;
    chat.scrollTop = chat.scrollHeight;
  }, 1100);
});

document.querySelectorAll(".suggestions button").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById("historianInput").value = button.textContent;
    document.getElementById("historianForm").requestSubmit();
  });
});

document.getElementById("handoffBtn").addEventListener("click", event => {
  const report = document.getElementById("handoffReport");
  const button = event.currentTarget;
  button.textContent = "Generating with AI...";
  button.disabled = true;
  setTimeout(() => {
    button.textContent = "✓ Handoff report generated";
    button.disabled = false;
    report.classList.add("show");
    report.innerHTML = `<strong>PSY 301 · Faculty Handoff Brief</strong><br>Teaching note: Students benefit from an annotated case example before Week 5.<br>Common issue: Research methods vocabulary requires reinforcement.<br>Key decision: The signature assignment was scaffolded in 2021.<br>Next step: Pilot peer calibration before the portfolio defense.`;
  }, 1300);
});

document.getElementById("generateAccreditationBtn").addEventListener("click", event => {
  const preview = document.getElementById("accreditationReport");
  const button = event.currentTarget;
  preview.innerHTML = loadingMarkup("Generating with AI...");
  button.disabled = true;
  setTimeout(() => {
    button.disabled = false;
    preview.innerHTML = `<div class="report-document"><header><span>NORTHBRIDGE UNIVERSITY · HLC EVIDENCE REPORT</span><h2>Teaching & Learning Quality Narrative</h2><p>College of Arts & Sciences · 2026 Accreditation Cycle</p></header><section><b>Executive finding</b><p>The college demonstrates systematic outcome alignment and an established cycle of evidence-based course improvement across 84% of active programs.</p></section><section><b>Evidence base</b><p>342 course lineages · 2,402 evidence artifacts · 68 program reviews · 4,320 documented revisions</p></section><section><b>Criterion 4.B</b><p>Assessment results are used consistently to improve curriculum. Direct evidence is complete for 18 of 21 program outcomes.</p></section><section><b>Priority action</b><p>Complete two missing evidence artifacts and document the improvement narrative for the Civic Responsibility outcome by September 2026.</p></section></div>`;
    showToast("Report generated", "Your HLC evidence narrative is ready to review.");
  }, 1400);
});

document.querySelectorAll(".standard-options label").forEach(label => {
  label.addEventListener("click", () => {
    document.querySelectorAll(".standard-options label").forEach(item => item.classList.remove("selected"));
    label.classList.add("selected");
  });
});

document.getElementById("requestReviewBtn").addEventListener("click", () => showToast("Review requested", "Dr. Ravi Patel and Dr. Dana Reed were notified."));
document.getElementById("approveBtn").addEventListener("click", event => {
  event.currentTarget.textContent = "✓ Course approved";
  event.currentTarget.classList.add("success");
  showToast("Course approved", "Your approval is now part of the version record.");
});
document.getElementById("addCommentBtn").addEventListener("click", () => {
  const input = document.getElementById("commentInput");
  if (!input.value.trim()) return;
  showToast("Comment added", "Your note is visible to the review team.");
  input.value = "";
});
document.getElementById("saveSettingsBtn").addEventListener("click", () => showToast("Settings saved", "Workspace defaults have been updated."));
