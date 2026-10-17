# AGENT B — Complete APORIA Frontend and FRONTIER Universe

**This is an autonomous coding-agent task specification, not an instruction for the human to code.** Worktree: `../aporia-frontier`, branch `feat/frontier-ui`; exclusively own `apps/web/**` and `tests/frontend/**`, plus frontend-specific docs. Do not change root files/contracts/backend without human-approved contract request. Read `01_COMPLETE_SOFTWARE_REQUIREMENTS.md`, `03_FRONTEND_RENDERING_AND_UX.md`, `02_CFG_GUIDANCE_POLICY.md`, `04_DATA_AND_EVENT_MODEL.md`, OpenAPI and all three reference images.

## Mandate / completion standard

Build a **complete functional product UI** for all thirteen SRS routes, not just the FRONTIER graph. Data must flow from typed shared backend client, honest fixture mode for stand-alone branch development, eventually real server data. Every visible primary button/setting routes to actual function or honest disabled state; no decorative dead controls. The immersive point-cloud visual look is non-negotiable. Retain human-vs-agent roles, status/provenance labels and experimental integrity.

## Phase B0 — Design system and contract audit

- Inspect scaffold/pinned dependencies, generate TypeScript contract client or typed wrapper from shared OpenAPI; identify schema conflicts before coding.
- Set typography, colors, dark layout shell, reusable inspector/dock/plot/button/loading/errors, data-mode badges, responsive drawer, reduced-motion fallback.
- Build screenshot fixture harness seeded and stable so visual regression meaningful; no arbitrary random paper clusters on every refresh.
- Commit `B0: UI contracts and shell`.

## Phase B1 — Immersive FRONTIER + corpus + session shell

- Build actual R3F/Three.js point-cloud galaxy: organic paper clusters based on stable graph positions, 10k+ shader points, bloom/soft falloff, optional cosmos.gl GPU layout or positions. Implement layered semantic points and unselectable decorative photons.
- 3D camera orbit/zoom/fly-to, point hover/select, paper source/provenance inspector, search/domain filters, graph relations selective reveal, action to inspect corresponding research node and runnable agenda, seeded fixture mode.
- `Home`, `Frontier`, `Library`, `Settings` with working navigation and truthful status; real projects and paper search from API client, SSE/poll event connection and reconnect.
- Show blocker node only on real `problem.discovered` event or clearly tagged fixture; test at screenshot/reference, include accessibility fallback. Commit `B1: true neon FRONTIER with paper interaction`.

## Phase B2 — Goal, plan, experiments, recursive research UI

- Research launch and objective approval with proper input validation.
- Research Lab (`/projects/:id/lab`): hypothesis, running/pending/failed/completed, selected experiment, logs/artifacts, physical 3D point-cloud/3DGS artifact viewer when artifact format available, and numeric metric charts; experiment-start/cancel actions wired to backend; no fake running state.
- Research Agenda: create/edit/inspect/queue child tasks via backend, explain blockers and downstream dependencies; node selection synchronized with FRONTIER.
- Event timeline bottom dock and task indicator; source references on metrics/evidence and real queue updates. Commit `B2: live research debugger and agenda`.

## Phase B3 — Papiers Judgment Compiler + genuine CFG view + FORK

- Build source selection, Papiers account state, note/highlight inspector with provenance; direct user insight input and human approval.
- Dual-score candidate action table. `s_u`, `s_c`, `delta`, guided score `s_g` and explanation per candidate displayed; guidance w slider 0–2 with planned choice projected live using deterministic formula and backend-authoritative snapshot; don't generate source values in UI.
- Display that w0 = independent, w1 = conditioned, w>1 = extrapolation; handle incomparable scores, fallback, hard-infeasible actions and approval requirements. Show selected candidate and why; never show predictions as measured metrics.
- Fork Explorer comparing independently executed branches; checkpoint, intervention diff, common controls, separate histories, curves/artifacts and uncertainty/incomparability. Support replay as new fork (no mutation of history). Commit `B3: measured human influence and fork UI`.

## Phase B4 — PARALLAX, team River, portfolio and meta UI

- Scientific Court disputes and proposed falsification test; treat unresolved as open.
- `/team`: multiple authorized users/sessions, comments/joins, expertise requests, approved skill review/promotion, cross-project reuse and visibility. Member switching must enforce ACL via API; don't assume fixture mode is live collab.
- `/researchers/:id`: personal rules/assumptions/decision history, consent/scope and evidence statuses. Profiles edit controls work.
- `/portfolio`: prioritized queue table, status and downstream unlock visualizations, action/approval controls.
- `/meta`: actual policy trial data and version history/rollback, not a fake graph of successful improvement.
- Truth-maintenance warnings and dependent graph highlights on invalidated claim. Commit `B4: all collaborative and meta views`.

## Phase B5 — Integration, performance and completeness

- Connect real backend, remove/clearly label fixtures in live mode, verify 13 routes + primary controls. Test network failures, SSE gaps and reconnect, 403/unauth sources, null results and no model access.
- Visual polish against user screenshot and reference art. 1440×900 screenshot + one orbited camera screenshot + interaction video; 25k semantic points frame timing, fallback behavior, keyboard navigation, responsive mobile.
- Evidence-backed judge flow, provider status badges and sponsor use transparent. Commit `B5: complete tested frontend`.

## UI test expectations

- Visual snapshot regression at fixed seed+viewport; screenshots clearly unlike basic flat concentric circles.
- Paper counts and clicked paper ID match real records; ambient photons ignored by pick/count.
- Search and camera focus correct IDs after filters/pagination; framerate reasonable.
- Each action transition reflects backend result (pending/success/error) with no false positives.
- CFG slider recomputes only guided ranking, not the source score vectors; w tests against known candidate table; w1.5>1 may score >1 as ranking, not probability.
- No human approval means agent policy cannot execute conditioned action; visible warning.
- Event replay creates one new node; reconnect does not duplicate it.
- Team scope respects 403; no private source title/body leaked in tooltips.
- WebGL unavailable yields usable DOM research explorer; reduced-motion correctly disables excessive bloom/movement.

## Required ongoing communication with human integrator

At EACH checkpoint, provide (1) FR IDs done, (2) screenshots and screen captures at fixed viewport, (3) test/lint/build logs, (4) running navigation list and links, (5) honest fixture/live mode, (6) local commit hash and remaining work. **Commit locally in your feature worktree; do not push/merge unless asked.** Do not edit Agent A files. For blockers, file an API change request instead of crafting fake backend behavior.

## Forbidden deliverables

Flat SVG network posing as Three.js; hardcoded screenshot behind clickable overlay; pretty cosmic scene with no real semantics; all research nodes labeled as papers; auto-generated fake citations; lack of corpus/source retrieval; generic cards drowning visualization; enormous unfiltered edges; unsupported 3DGS quality claims; mock provider statuses labeled online; invisible approvals, blind auto-promotions or erased fork records.
