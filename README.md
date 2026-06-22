# AI Course Studio V2 · INF 125

AI Course Studio V2 is a static GitHub Pages prototype focused on helping an instructor build, review, approve, and export content for **INF 125: Social Media and Society**. It uses plain HTML, CSS, and JavaScript with no backend, no build system, no paid dependencies, and no exposed API keys.

## How to use the GitHub Pages app

1. Open `index.html` directly in a browser, or publish the repository root with GitHub Pages.
2. Use the left navigation to move between the INF 125 dashboard, course profile, module builder, generator, approval queue, Canvas Intelligence, Institutional Memory, Canvas Export Center, and Accreditation Report.
3. Edit the course profile and module content. Changes are saved in browser `localStorage`.
4. Generate mock AI content from the AI Generator panel. Generated drafts are placed in the approval queue.
5. Approve drafts before marking them as sent to Canvas or including them in simulated exports.

For local preview with a simple static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Current mock features

- INF 125 dashboard with course overview, weekly progress, readiness scores, content tasks, and quick actions.
- Editable course profile preloaded with INF 125 sample data.
- Eight-week module builder with editable objectives, lectures, readings, activities, assignments, discussions, quizzes, notes, and statuses.
- Mock AI content generator with content type, prompt, and context selectors.
- Approval workflow for generated content with edit, approve, reject, and send-to-Canvas actions.
- Canvas Intelligence simulation for missing pages, overloaded weeks, unpublished modules, rubric gaps, discussion criteria, quiz alignment, workload balance, and readiness scoring.
- Institutional Memory CRUD for department policies, instructor preferences, approved patterns, rubric language, design decisions, accreditation notes, accessibility reminders, support language, and AI policy language.
- Canvas Export Center for selected modules, approved content, JSON, Markdown, Canvas-ready HTML, and import checklists.
- Accreditation and alignment report with sample INF 125 outcomes, mappings, gaps, and recommendations.

## Persistence

The prototype stores data only in browser `localStorage`, including:

- Course profile
- Modules
- Institutional Memory entries
- Generated content and approval queue
- Canvas export status

Use **Reset demo data** in the top bar to clear local V2 data and reload the defaults.

## Future Gemini API integration plan

The JavaScript is structured around a reusable `mockGenerate()` function in `app.js`. Later, replace the mock response with a request to a secure API proxy that calls Gemini. Do **not** put Gemini API keys directly in GitHub Pages JavaScript. A production path should:

1. Send the selected content type, prompt, course profile, selected module, Institutional Memory, and Canvas Intelligence context to a protected endpoint.
2. Keep API keys in server-side environment variables or an institution-approved secrets manager.
3. Return generated content to the same approval queue workflow.
4. Preserve human approval before Canvas publishing.

## Future Canvas API integration plan

The Canvas Export Center is currently simulated. Future Canvas support should use Canvas OAuth or another institution-approved secure flow. A production path should:

1. Authenticate the instructor securely.
2. Map approved modules, pages, assignments, discussions, quizzes, and rubrics to Canvas API payloads.
3. Send POST/PUT requests from a secure backend or proxy, not from hardcoded tokens in static JavaScript.
4. Record Canvas item IDs and publish status back into the app's persistent store.
5. Keep the current approval-before-publish workflow as a safety gate.

## Repository structure

- `index.html` — static app shell and section markup
- `styles.css` — responsive visual design, cards, badges, progress, and layouts
- `app.js` — localStorage state, mock generation, module editing, approval workflow, exports, and reports
- `README.md` — project overview and integration roadmap
