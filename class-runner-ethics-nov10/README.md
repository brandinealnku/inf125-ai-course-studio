# INF 125 Class Runner — November 10 AI Ethics Lab

A standalone, runnable Class Runner classroom session grounded in slides 14–28 of `INF125_HandsOn_AI_Learning_Ethics(1).pptx`.

## Run

Requires Node.js 18+; no dependencies or installation.

```bash
cd class-runner-ethics-nov10
INSTRUCTOR_PIN='choose-a-strong-pin' node server.js
```

Open on the instructor laptop: `http://localhost:8787/#instructor`.
Open on the classroom projector: `http://localhost:8787/#room`.
Students on the **same network** open `http://<instructor-computer-LAN-IP>:8787/#student`.

The instructor computer must permit inbound port 8787 on its firewall; campus Wi-Fi may block device-to-device access. If so, host the same Node app on an approved accessible server, or use a classroom-compatible network.

## Preserved agenda

| Time | Mode | Activity |
|---|---|---|
| 0–10 | Slides + Poll | Introduction, goals, opinions |
| 10–25 | Slides + Responses | Slide-based ethical reasoning and reflections |
| 25–45 | Group Mode | Four color teams investigate cases |
| 45–55 | Group Mode + Slides | Team verdicts, cross-group critique |
| 55–68 | Group Mode | Co-design the November 17 high-school visit |
| 68–75 | Slides + Feedback | Signature infographic topic starter and exit |

## Cases mapped from uploaded slides

* Red — slide 16, Case B: Perfect AI Tutor
* Blue — slide 18, Case D: Employee AI Monitoring
* Purple — slide 15, Case A: AI Hiring
* Gold — slide 17, Case C: AI Art

The original deck's *Case A–D* and scenario facts are preserved. Color assignments follow the previously described zones, rather than original case letters. The Gen Ed preparation uses the deck's slide 22–27 expectations, including two credible non-AI sources and transparency when using AI.

## Multi-device collection

Student submissions use HTTP POST and save in `session-data.json`. Instructor and projector receive live phase changes through Server-Sent Events. Instructor data and export require an `INSTRUCTOR_PIN`. Student roster uses a pseudonymous browser identifier and can be rejoined. CSV includes all submissions and timestamps; subsequent submissions are retained rather than overwriting earlier work.

## Important limits

* This is **not integrated into the existing Class Runner** and does **not** control Google Slides. It is a separate, deployable Node app implementing the requested session in native Class Runner cards.
* This is a classroom prototype, not a hardened hosted service. Instructor PIN is sent as a header and stored in browser session storage. Use HTTPS on any internet-accessible server and a strong PIN. No student authentication beyond the nickname/browser ID; do not use for grades or sensitive student records without institutional review.
* `session-data.json` remains on the hosting server. Protect and dispose of it according to applicable university data rules. It is excluded from the included archive.
* Instructor's CSV response list is private to the PIN-protected view. Free-text submissions are not projected automatically.
* The Gen Ed signature assignment is started, not completed, in the final seven minutes.

## Quick test

1. Start the server with a PIN and open instructor, projector, and student views (ideally on two real devices).
2. Join a color group; submit opening poll.
3. Advance instructor phase; check projector and student view.
4. Submit a group verdict, critique, visit idea, and signature topic starter in the corresponding phases.
5. Download CSV; verify the response records and timestamps.
6. Rejoin after browser refresh, confirm nickname and team retained.