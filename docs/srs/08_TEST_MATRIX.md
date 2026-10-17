# APORIA — Verification Matrix, Acceptance Protocols and Release Definition

**Key:** automatic `A` (unit/integration/contract), manual `M` (UI inspection), real-provider `L` (live integration, credential-dependent); no fixture can satisfy an L test. Human owner receives test logs/screenshots at each checkpoint. Failure means requirement INCOMPLETE and recorded follow-up work.

## 1. Full requirement traceability

| Requirements | Owner | Checkpoint | Automated proof | Human-visible proof |
|---|---|---|---|---|
| FR-001..004 workspace, roles | A; B UI | G1–G5 | Auth/ACL tests, denied cross-workspace read | two accounts see different scoped research |
| FR-010..014 paper/Papiers source | A; B | G1/G3 | real paper IDs/provenance, Papiers disconnected flow | paper click opens correct DOI/arXiv; approved annotation visible |
| FR-020..022 scientific compiler | A; B | G2 | JSON/Pydantic schema, source validation | objective → testable accepted hypotheses & protocol |
| FR-030..033 autoresearch and plugins | A; B | G2/G5 | deterministic evaluator and execution/restart tests | inspect run logs, code/dataset hashes and real metrics |
| FR-040..044 FRONTIER dependencies | A; B | G2 | graph schema, dedup, blocker threshold and parent revalidation tests | new child dot and queued agenda appear after measured blocker |
| FR-050..054 scientific preferences/CFG | A; B | G3 | CFG-01..10, consent and same candidate set tests | w slider changes action, source provenance and score components |
| FR-060..063 PARALLAX | A; B | G4 | contradiction resolution cannot occur sans evidence | two claims → discriminating experiment, unresolved state |
| FR-070..072 expert routing | A; B | G3/G4 | question/answer changes action; ACL and opt-in | researcher receives evidence packet, approves alteration |
| FR-080..082 FORK replay | A; B | G3 | dataset/evaluator checkpoint parity, separately measured run IDs | visible original/guided timeline, pending honesty |
| FR-090..093 River teamwork | A; B | G4 | multiuser session/skills reviewer/transfer tests | second user joins and later agent retrieves lesson |
| FR-100..101 transfer/truth | A; B | G4 | invalidation propagates, untested transfer not validated | affected project visibly disputed/needs verification |
| FR-110..111 meta | A; B | G5 | matched budget strategy evaluation & rollback | view evidence-backed policy trial and rollback |
| FR-120..121 Gemini | A; B status | G2/G6 | strict structured output, model failure/degraded paths, one real SDK test | real Gemini call receipt & resulting validated plan |
| FR-130..132 Tiger Data | A; B charts | G1/G6 | migrations, hypertable queries and persisted aggregate | actual per-minute live research chart sourced from DB |
| FR-140..145 neon FRONTIER/UX | B; A sources | G1–G5 | navigation, screenshot, picking and event integration E2E | dense particle universe, search/select/hover/node emerge |
| FR-150..153 ops/security/ownership | both/human | G0–G6 | CI, secret scanner, full tests, code + provenance review | fresh clone boots; all controls functional; license notices |

**Machine-readable list:** `checklists/requirement_traceability.csv` enumerates all individual FR IDs, owners, checkpoint and verification mode.

## 2. Required end-to-end acceptance journeys

### E2E-01 Real experiment to discovered dependency (required)
1. Create project with a camera goal and known permitted dataset.
2. Compile/approve plan with documented metric and evaluator.
3. Start actual bounded experiment, persist status and metrics, verify real run artifact/log.
4. Given deterministic insufficient coverage, ensure `problem.discovered` event is persisted once; `agenda.queued` child links to parent, has acceptance criteria and source evidence; frontend animates one corresponding node.
5. Reload UI/restart API; event, run and child remain identical; no duplicates.
6. Child resolved on actual evidence; parent remains blocked until rerun verifies parent acceptance criteria.

### E2E-02 Papiers judgment to guided experiment (required)
1. Connect authenticated read-only Papiers with user's authorization. Retrieve actual saved note; show source ID/location. If not authenticated, verify honest disconnected state; cannot pass sponsor live test on fixture.
2. Gemini transforms actual note/user statement into testable proposal and two candidate experiments; human reviews/approves.
3. Score identical candidate set U and C with scope isolation; w0/w1/w1.5 ranking and explanations persist to DB; constrained actions ineligible even if high score.
4. Fork common checkpoint; w0 and w1.5 branches execute measured experiments or show explicit pending, never fake outcome.
5. Show whether human choice improved, worsened or made no difference under predeclared common evaluator. Results logged in Tiger Data.

### E2E-03 River/team/transfer/truth (required)
1. Two users sign into same authorized workspace; one live agent session, second joins/comments and changes a proposed method.
2. Store method lesson as candidate only. Require evidence and approved reviewer before team sharing.
3. Separate authorized agent retrieves reviewed skill and initiates transfer test on a distinct project. UI labels tested/untested results accurately.
4. Invalidate supporting claim through new evidence; graph propagation marks dependent lessons/project conclusions disputed or needs revalidation. Shared research never silently carries old validation status.
5. An unauthorized third user cannot access personal Papiers note/source/skill/artifact via any API or LLM tool call.

### E2E-04 Meta + disagreement (required)
1. Two interpretations conflict in PARALLAX; discrimination test proposed and run; agent disagreement does not automatically resolve claim.
2. Run two research strategy settings with matched budget, persist trial and methods; inconclusive result remains inconclusive.
3. Meta policy revision is versioned and reversible. Portfolio ranks existing child tasks and explains sources of priority.

### E2E-05 Frontend real paper galaxy (required)
1. Load nonempty verified arXiv/OpenAlex corpus. Record indexed count vs loaded count.
2. Smoothly orbit and focus dense glow points; click paper from GPU point ID. Inspector source matches paper ID; citation vs embedding edges correctly labeled.
3. Search results scroll/fly-to and selected source persists across changed filters.
4. Inject one backend test event, verify newly created research node and link only once; no random on-page inventions.
5. At 1440×900, compared with three references, point cloud is volumetric/cinematic rather than obvious labeled circle graph. Frame-rate measurements documented.
6. Run with WebGL blocked/reduced motion; usable search/DOM inspector remains.

### E2E-06 Provider integrity (required)
- Real Gemini inference checked from provider HTTP request log and schema validation. Local fake mode not conflated.
- Tiger Cloud/Timescale current connection, two real hypertables, one used continuous aggregate query, actual event + metric persist across restart. Live chart shows real rows, not synthetic events.
- Papiers actual note retrieval when authenticated; if not, use explicit `not_connected` and do not claim sponsor integration demo success.
- Secrets never reach frontend bundle, API health response, screenshots or public/committed logs.

## 3. Independent tests Agent A must run

- Pytest deterministic physics/coverage evaluator numerical cases (known camera geometry, occlusion, missing surfaces, threshold edge).
- Tests for Gemini malformed/unsafe/citation-hallucinated outputs and backend redaction/rate limit/retry.
- Policy U context isolation; C only authorized notes; score-aggregation calibration; full CFG-01..10; event + DB persistence under retry/restart.
- Database migration on Tiger-compatible engine, backed by actual `time_bucket` and continuous aggregate reads; random data not necessary to claim scale.
- Agenda dedup, dependency cycle checks, parent validation, claim propagation and opt-in lesson access.
- Fork run hashes/budgets comparison, cost/time limits and failure handling.
- Worker sandbox denies arbitrary shell/unallowlisted filesystem/network while recording permitted run artifacts.

## 4. Independent tests Agent B must run

- React/Vitest component tests and Playwright E2E for all 13 routes / loading-success-error flows.
- Shader/point picking map IDs stable across zoom/filter, no ambient particle selected as paper.
- Dedicated screenshot regression: full scene first load, hovering paper, clicking paper, selecting new blocker, open fork; manual comparison to provided target render and Cosmograph reference.
- Event-stream SSE cursor/catchup, gap recovery and duplicate suppression.
- CFG math displayed exactly; w>1 score as ranking not probability; independent action stable at w0 and conditioned action at w1.
- Accessibility keyboard nav, viewport resizing and reduced-motion tests; WebGL fallback accessible.
- All links/buttons real or disabled with reason; provider mode labeled.

## 5. Release checklist

- [ ] All FR rows implemented in main/integration with documented tests and manual proof.
- [ ] No intentionally dead screens, placeholder model calls or fake scientific output presented as real.
- [ ] One real Gemini, real Tiger Data and real Papiers demonstration captured if claiming those sponsor integrations.
- [ ] Live experiment → blocker → child → judgment → decision fork → evidence → reusable reviewed skill can run end to end.
- [ ] Data from two users respects ACL in backend and frontend.
- [ ] Project resumes correctly after restart with history and artifacts.
- [ ] Neon 3D visual meets aesthetic bar at reference viewport and functional source selection.
- [ ] CI / secret scans / auth tests / visual/E2E / budget and worker safety checks pass.
- [ ] Both feature branches tested independently and after merge; human approved each gate and final main commit.
- [ ] Current limitations and unexecuted scientific claims truthfully documented; full product completed **within bounded supported domain**.
