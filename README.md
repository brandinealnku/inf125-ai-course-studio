# AI Course Studio

AI Course Studio is a polished, static front-end prototype for an AI-powered higher education course creation and quality platform. It demonstrates how faculty, instructional designers, academic leaders, and accreditation teams could design, analyze, improve, preserve, and export university courses from one workspace.

> Tagline: “Create, improve, and manage entire university courses with AI.”

## Features

- Portfolio dashboard with course status, metrics, quick actions, and recent AI activity
- AI-assisted Course Architect with generated outcomes, learning architecture, and competencies
- Course content generator with editable generation settings and weekly module previews
- Mock Canvas export workflow and package validation
- Student workload analysis with stacked bar charts and recommendations
- Program-to-assessment alignment matrix and gap detection
- Course health scores for engagement, accessibility, workload, and accreditation readiness
- Faculty review workflow, comments, approvals, roles, and version history
- Institutional Memory repository, course decision timeline, AI Course Historian, and faculty handoff reports
- Accreditation readiness tracking and generated report previews
- Responsive settings and institutional configuration screens

All data and AI responses are simulated locally in the browser.

## Run locally

No build step, package manager, or API key is required.

1. Download or clone this repository.
2. Open `index.html` directly in a browser.

For a simple local web server, run:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push these files to the root of a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder.
5. Save. GitHub will provide the public Pages URL after deployment.

Navigation uses URL hashes, so every screen works on GitHub Pages without server-side routing or reload errors.

## Prototype notes

This is a static stakeholder prototype built with plain HTML, CSS, and JavaScript. It does not transmit form data, call paid AI services, store API keys, or connect to Canvas. The Canvas integration, AI generation, report generation, and institutional search experiences use realistic mock data.

## Future backend and API roadmap

- Add secure authentication and role-based access
- Connect to institution-approved LLM providers through a protected server
- Add database-backed course, artifact, version, and comment storage
- Integrate Canvas through OAuth and supported Canvas APIs
- Add document ingestion, semantic search, and source citations for Institutional Memory
- Support real-time collaboration, notifications, and approval workflows
- Generate Common Cartridge exports and accessible document packages
- Add analytics pipelines for student outcomes and course health
- Implement security, privacy, retention, and governance controls for institutional data
