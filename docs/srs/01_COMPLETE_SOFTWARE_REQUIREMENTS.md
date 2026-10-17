# APORIA — COMPLETE SOFTWARE REQUIREMENTS SPECIFICATION (SRS) v3.0

**Status:** build-to-completion engineering requirements, not an implemented product.  **Date:** 2026-10-17.  **Audience:** two autonomous coding agents plus human integrator/product owner.  **Normative:** every MUST below is required. **Original scope:** complete conceptual APORIA/FORKLINE vision, delivered as coherent end-to-end working modules. The implementation may use a bounded corpus and a bounded evaluator but may not substitute nonfunctional screens, fake agent calls, or pretend results for operational features.

## 0. Read order, scope, and conflicts

1. This SRS is the **functional source of truth**; requirements are individually numbered and testable.
2. `02_CFG_GUIDANCE_POLICY.md` is authoritative for discrete CFG-inspired experiment policy (replaces previous weighted-average pseudocode).
3. `contracts/openapi.yaml` + `04_DATA_AND_EVENT_MODEL.md` are authoritative for wire format and data semantics.
4. `03_FRONTEND_RENDERING_AND_UX.md` is authoritative for current frontend behavior/art direction.
5. `05_AGENT_A_RESEARCH_ENGINE.md` / `06_AGENT_B_FRONTEND.md` define ownership and build tasks.
6. `07_MILESTONES_AND_MERGE.md` defines branch workflow, staged user approval/push, and release gates.
7. `reference/LEGACY_VISION_EXPANDED.md` preserves the older long product spec. It **does not override** v3 or reintroduce deferred features. `reference/LEGACY_FRONTEND_EXPANDED.md` provides extra visual detail.

### Definition of complete

Completion is NOT “one happy-path demo and then stop.” Completion requires all 16 subsystems in §4 operational within documented limitations, feature-complete navigable screens in §5, public API endpoints in the OpenAPI contract, owned persistent schema, baseline tests, and two-agent integration checks. A bounded experiment domain is acceptable; a generic autonomous scientist for all of science is not asserted. Work proceeds in milestones so the human can periodically review and push, but later milestones are not discarded.

### Explicit distinction

- **Research claims** must be grounded in executed experiments and verifiable sources.
- **Fixtures** are for local/demo/test mode and have a persistent `data_mode=demo_fixture` badge; no fabricated arXiv paper IDs, Papiers highlights, results or Gemini successes.
- **Planned outcomes** must be labeled `planned`, never `measured`.
- **Implementation-complete** means backend behavior + persistent state + frontend interaction + passing tests, not just class/interface stubs.

## 1. Product identity and intent

**APORIA**: multiplayer autonomous research system. Each scientist has a research copilot; humans and agents jointly discover new research problems, execute falsifiable experiments, test whether human judgments improve science, and share evidence-backed methods across authorized researchers. FRONTIER is the executable scientific dependency graph, visually represented as an immersive cosmograph-style paper point cloud. PARALLAX is evidence-grounded structured scientific disagreement. FORK is counterfactual experiment branching. River-inspired team sessions preserve and reuse lessons. The flagship **Judgment Compiler** transforms Papiers notes and explicit human insights into candidate testable research policies.

**Primary sponsor:** Papiers human-centred autoresearch. **Additional target:** real Gemini API usage for planning/policy and real Tiger Data for persistent events and metrics. **No Solana feature.** Integration provider interface makes model/store swappable without faking sponsor usage.

### User roles
- Researcher: owns personal profile, initiates research, approves actions and memory sharing.
- Team member: views/joins authorized shared sessions, comments on evidence, contributes expertise.
- Team lead/admin: manages workspace permissions, research budgets, approvals and member access.
- Research agent: operates strictly inside workspace permissions/defined experiment budget; every action is auditable.
- Judge/demo viewer: read-only scoped view, with ability to start a safe demo where specifically enabled.

### Success criteria
- Judge traces goal → experiment → evidence → autonomously detected blocker → real child investigation → human intervention → changed planned/selected experiment → both controlled branches (if both completed) → measured comparison → candidate or reviewed reusable skill → another agent retrieves the skill.
- User can inspect data sources, tool execution records, scores (conditioned vs unconditioned), reviewer decisions, and research dependencies.
- No proprietary model context leaks to unauthorized teammates or public corpora.

## 2. Core user journeys

**UJ-01 Start research:** create workspace/project, enter broad goal, attach dataset and source scope, accept plan/hypotheses, initiate bounded research. View event timeline and run status after reload.

**UJ-02 Recursive discovery:** one measured experiment exposes a blocker, triggers evidence-backed subproblem (deduplicated), links `child blocks parent`, assigns agenda priority, launches or queues follow-up; resolving child requires verifying impact in parent.

**UJ-03 Human judgment and Papiers:** researcher selects an actual note/highlight or writes feedback; compiler extracts claim and falsifiable implications, requests approval, evaluates candidate experiments using double scoring + guidance weight, persists intervention and replayable policy details.

**UJ-04 Fork:** same checkpoint, datasets, evaluator, constraints, tool budget; original and guided choices diverge (when scores indicate), both actually execute if possible, UI compares measurable outcomes and lists confounds if no fair comparison.

**UJ-05 Team River:** team member watches authorized live session, comments/edits proposed hypothesis, approves scoped skill based on experiment evidence; second agent later retrieves/uses skill and logs transfer test.

**UJ-06 Scientific truth maintenance:** a replication contradicts a past result; dependent nodes are marked disputed/needs_revalidation, affected projects notified, child experiments queued; no automatic deletion of history.

**UJ-07 Frontier papers:** see clusters containing individually sourced arXiv/OpenAlex paper dots, select, search and navigate relationships with quality neon point-cloud rendering; distinguish corpus points, research nodes and ambient particles.

**UJ-08 Portfolio and meta:** portfolio prioritizes investigations and human consultation by expected information gain/downstream unlock; meta-run compares research policies on matched evaluations and suggests a versioned skills/policy change only when evidence permits.

## 3. System architecture

**Monorepo and boundaries**

```
aporia/
  apps/web/                     # Agent B ONLY: React + TypeScript + R3F + Three.js
  services/api/                 # Agent A ONLY: FastAPI HTTP + SSE/auth
  services/worker/              # Agent A ONLY: durable job queue / scheduler
  packages/research/            # Agent A ONLY: planners, policies, PARALLAX, meta
  packages/evaluators/          # Agent A ONLY: camera/scene bounded experiment plugins
  packages/connectors/          # Agent A ONLY: Gemini, Papiers, arXiv/OpenAlex
  packages/graph/               # Agent A ONLY: graph semantics, truth maintenance
  infra/db/                     # Agent A ONLY: Tiger Data/Postgres schema, migrations
  contracts/                    # FROZEN by scaffold; updates by human approval only
  fixtures/                     # Shared contract fixtures; owned by scaffold/human
  docs/                         # PRD + ADRs + operational/test docs
  tests/backend/                # Agent A
  tests/frontend/               # Agent B
  tests/integration/            # human/integration owner after branches merge
  .github/workflows/            # scaffold/human owns
```

Runtime: Web client → FastAPI (`/api/v1`, auth and rate limits) → policy/harness/graph services → worker queue → sandboxed evaluator → Tiger Data; integrations use provider interfaces. Reproducible object store for artifacts (local filesystem in dev / cloud-compatible in deployment). Web receives events via SSE with poll fallback. Agent A owns backend contracts and publishes matching fixtures only through an approved schema change request. Agent B **never edits backend code**. Start from the same scaffold commit and worktree isolation.

**NFR-01 Durability:** restarts preserve projects, decision logs, experiment records, graph states, forks, and team corrections. Idempotent operation keys prevent duplicate jobs/events.

**NFR-02 Resource control:** configured max experiments, compute cost/time, concurrency and cancellation; no unconstrained agent-generated shell code on host. Use allowlisted test plugins/sandbox execution.

**NFR-03 Scientific integrity:** evidence/protocol provenance; independent evaluator; predeclared metrics and success criteria; confidence and uncertainty; no guaranteed beneficial human impact.

**NFR-04 Security:** access checks at API, source retrieval, memory promotion, file artifacts, and agent tool calls. Secrets remain server-side. Log redaction. No sensitive team data in a global index without explicit permission.

**NFR-05 Accessibility/resilience:** keyboard-navigation to critical functions, labels in interactive panels, reduced-motion mode, WebGL fallback table/list, graceful disconnected/limited APIs, error boundaries.

**NFR-06 Performance:** aim at 60 fps on reference laptop with 25k visible semantic points; degrade particle counts/draw distance adaptively. UI must remain usable with 100k loaded points via level-of-detail (LOD), chunking/search/focus; **do not claim millions rendered/indexed without measured benchmark**.

**NFR-07 Auditability:** log all policy calls, inputs via allowed fingerprints, model/provider status, score vectors, choices, experiment code/dataset hashes, approvals, identity, timestamps, status and artifact pointers. Do not log API keys/private Papiers raw content into open logs.

**NFR-08 Deployment:** documented `make dev` or equivalent; separate test/fixture and live configurations, migrations, health endpoint, live sponsor connectivity test, runbook, clean fresh-clone installation.

## 4. Functional requirements — ALL are required

### Module M01 — Accounts, teams and research spaces
- **FR-001** Create/list/archive personal/workspace/project; membership roles; scoped audit actor IDs.
- **FR-002** Authorized member can join/view/comment on team research sessions; unapproved member receives 403 including for sources/artifacts.
- **FR-003** Distinguish personal/team/global memory. Global requires explicit opt-in and provenance; no implicit cross-workspace leak.
- **FR-004** Auth may be demo-safe locally but must genuinely enforce role boundaries; production provider replaceable.

### M02 — Source ingestion, Papiers, corpus
- **FR-010** Search and retrieve real papers via arXiv/OpenAlex (stable DOI/arXiv/work IDs, citation relationships, metadata, licensing/compliance, sync timestamps).
- **FR-011** Index a bounded but real paper corpus, embed/search with pluggable embedding provider or deterministic ranking baseline; visually every semantic paper dot maps 1:1 to a paper record.
- **FR-012** Papiers connector reads actual authorized notes/highlights/papers via documented CLI; source references and retrieval status preserved. Handle unauthenticated/unsupported read operations. No unsupported write assumed.
- **FR-013** Retrieval merges public literature, personal notes and approved team knowledge while maintaining provenance, source quality, access context, time and distinct ranks; citation links are not semantic similarity edges.
- **FR-014** Allow researcher's real note selection and correction; actively distinguish annotation/judgment from mere bookmarking.

### M03 — Scientific Compiler and hypotheses
- **FR-020** Turn a goal into objective, variables, competing hypotheses, controlled protocol(s), metrics (units/direction), success/failure criteria, safety/resource limits, known uncertainties, possible dependencies.
- **FR-021** User reviews/edits plan; version all approvals/changes; Gemini model output must be schema-validated proposal only.
- **FR-022** Plans can include multiple candidate experiments and a literature gap check; reject unsupported sources. Each experiment has deterministic evaluator specification.

### M04 — Durable autoresearch execution
- **FR-030** Agent chooses experiment, executes actual code/plugin in isolated bounded environment, collects stdout/stderr, code commit hash, dataset ID/hash, evaluator version, seed, runtime, metrics and artifacts.
- **FR-031** Autonomous research loop uses results to keep/discard/modify hypothesis or schedule child; errors/failed experiments are durable events.
- **FR-032** Support resume, retry/idempotence, cancel, timeout, queue, status, resource budget, concurrency and tool-call trace.
- **FR-033** Domain plugins: real deterministic camera coverage/viewpoint selection **and** pluggable image/scene method comparison (may use precomputed real visual artifacts under honest provenance). Do not assert actual 3DGS scores from a coverage proxy.

### M05 — FRONTIER executable graph/recursive questions
- **FR-040** Typed nodes (paper, objective, problem, hypothesis, method, run, claim, evidence, human judgment, skill, agent, researcher, project) and directed typed edges with source, status and confidence.
- **FR-041** Detect new blockers based on measured threshold, unexpected failure, conflicting evidence or missing technique; attach evidence and deduplicate against prior questions.
- **FR-042** Create a *queued actionable child investigation*, not just a node: completion criteria, metric, literature context, parent dependency, priority score, assignee, action state.
- **FR-043** Prioritize competing agendas using value of information, expected unlock impact, uncertainty, cost and human priorities; handle cycles/duplicate tasks.
- **FR-044** Mark parent unblocked only after child completion AND parent-side verification. Maintain source lineage for every claim.

### M06 — Researcher scientific judgment/CFG policy
- **FR-050** Persistent inspectable individual profile of research priorities, expertise, methodological rules, assumptions, evidence and confidence; edit/delete/disable with consent.
- **FR-051** Compile sourced annotations or direct feedback into falsifiable proposals with provenance, applicability scope, alternatives, tests and approval; human note is never automatically a fact.
- **FR-052** For the SAME feasible candidate experiment set, independently score (a) unguided policy and (b) Papiers/human-conditioned policy; derive `s_guided(a) = s_u(a) + w · (s_c(a) − s_u(a))`; rank argmax among feasible candidates. See normative `02_CFG_GUIDANCE_POLICY.md` for calibrations/extrapolation/edge cases.
- **FR-053** Expose/record both score vectors, guidance weight, selected action, score explanation, snapshot and resulting run; allow weight changes and counterfactual choices. Constraints are hard filters, never overridden by extrapolation.
- **FR-054** Missing/unapproved/no-authorized-human context: policy safely falls back to unguided; score failures marked and not silently imputed as grounded judgments.

### M07 — PARALLAX evidence-backed scientific court
- **FR-060** Investigator, skeptic, methodologist and human-aligned critic propose falsifiable competing interpretations, confounders and discriminating experiments; same orchestration harness may implement all roles.
- **FR-061** Log disagreement graph and reasons; no majority-vote "truth." Unresolved contradictions stay unresolved until evidence arrives.
- **FR-062** Disagreement between actual team members can be converted into mutually agreed comparison under same evaluation criteria.
- **FR-063** Two distinct, consented researchers’ Papiers-grounded annotations can produce explicit, provenance-linked opposing claims and a test discriminating them. Never blend their individual profiles into an invented collective opinion.

### M08 — Human intervention and expert routing
- **FR-070** Ask a targeted question only when the answer can change hypothesis, evaluator, resource allocation or next action. Include evidence packet, alternatives, uncertainty and expected consequence.
- **FR-071** Human can approve/redirect/reject/annotate; must persist intervention, action before/after, rationale/source, and author. Other independent work can proceed during wait.
- **FR-072** Expertise routing selects authorized opt-in researchers based on contributed work; human can decline; no guessed sensitive traits; resulting answer scoped to access policy.

### M09 — FORK counterfactual experiment branching
- **FR-080** Checkpoint prior policy decision; create true unguided `w=0` and guided `w=selected` branches with common dataset, evaluator, seed/budget where applicable; both have independent run/action histories.
- **FR-081** Compare actual outcomes when executed. If one is pending, say `not_evaluated` instead of inventing branch result. Show confounds where objectives or resources differ.
- **FR-082** Allow rewind and re-run an alternative guidance weight or researcher correction from compatible checkpoint; preserve predecessor and all provenance.

### M10 — River-inspired team intelligence
- **FR-090** Durable shared sessions/events visible to authorized teammates; live join, comment/correct, collaborate without restarting agent; preserve agent/human attribution.
- **FR-091** Extract candidate lesson/skill from evidence + human insight; include applicability, test, provenance, reviewer, validation/version, known counterexamples and access scope.
- **FR-092** Promote to reviewed skills only via evidence/reviewer policy; other agent can retrieve and explicitly apply skill. Show whether transfer was tested and passed/failed.
- **FR-093** Identify overlapping investigations and relevant work across authorized team projects, with opt-in suggestions not automatic confidential disclosure.

### M11 — Cross-project transfer and truth maintenance
- **FR-100** Form a transfer hypothesis from validated method to new project; run compatible evaluation or mark transfer untested; no unverified global generalization.
- **FR-101** New contradicting evidence triggers graph propagation `disputed/needs_revalidation` to dependent claims and project alerts; queue revalidation protocol and keep historic versions.

### M12 — Meta-autoresearch
- **FR-110** Compare at least two selectable research strategies with recorded trial conditions, budgets and outcomes (e.g. w=0 vs w=1 / skepticism timing / retrieval policy). Produce guarded policy suggestion, not automatic unrestricted fine-tune.
- **FR-111** Version strategies and ability to roll back. Scope to bounded supported evaluations; report confidence and inconclusive studies honestly.

### M13 — Gemini provider and adapters
- **FR-120** Real Gemini server-side model calls for structured scientific plans, judgment compiler and optional policy scoring. Store model/version/status/cost/budget metadata and Pydantic validation errors.
- **FR-121** Provider-swappable interface for other LLMs. No mock marked Gemini; offline fixture mode labeled. Retriable limits/errors visible.

### M14 — Tiger Data persistence and analytics
- **FR-130** Relational Postgres/Tiger tables for people/workspaces, graph, sources, runs, policies, judgments, skills, forks, approvals and ACL.
- **FR-131** Real Timescale hypertables for timestamped research events and per-run metric samples; continuous aggregate with meaningful minute bucket stats and auditably queryable counts/durations.
- **FR-132** Dashboard reads actual DB analytics; fallback Postgres/local mode clearly identified. Do not fabricate activity metrics, scale or compression statistics.

### M15 — FRONTIER neon 3D frontend
- **FR-140** React/TypeScript app with immersive Three.js/R3F semantic paper point cloud; cosmos.gl used where beneficial for GPU graph layout/interaction. User reference aesthetic is **glowing volumetric dense points**, not diagram circles.
- **FR-141** Paper node select/search/filter/fly-to, orbit/zoom, source inspector, typed research layers, sparse edges on selection; atmospheric glow excluded from count.
- **FR-142** Research Lab, Agenda, Paper/Claim Inspector, Evidence and Timeline, Judgment Compiler/scoring view, PARALLAX, Fork Explorer, River Team, Researcher Intelligence, Portfolio, Meta Experiments, Settings/Integrations all functional.
- **FR-143** New blocker event visibly grows linked research node and opens actionable child; views show actual run state, evidence/permission and measurements.
- **FR-144** Responsive layouts, reduced motion, keyboard access, WebGL-unavailable fallback; screenshot regression vs references and performance instrumentation.
- **FR-145** Research Lab includes a physical 3D experiment viewer for supported real point-cloud/mesh/3DGS artifacts with camera orbit, alternate-view comparison and visually marked uncertain/unobserved regions when provided by evaluator data. Artifact provenance is explicit; no synthetic regions claimed as measured. Selecting a supported uncertain region can create a proposed actionable research problem, subject to normal evidence checks.

### M16 — Operations, testing, demo, ownership
- **FR-150** Clean setup with documented local/hosted provider modes, migrations, seed of clearly labeled sample data, CI checks, load and permission tests, controlled demo replay.
- **FR-151** Every route and primary control implemented and tested (no dead controls or screen-only mock). API/version compatibility verified via contract tests and fixture/live modes.
- **FR-152** Integration diagnostics show actual Papiers/Gemini/Tiger health/status and `data_mode` at point of use; no claim sponsor category compliance without actual functional use.
- **FR-153** Private proprietary APORIA repo, no project MIT license unless team decides, third-party notices preserved; code ownership among team contributors to be agreed independently.

## 5. Pages and navigation — no inert panels

1. `/` Research launch: project setup, natural-language goal, safe dataset/scope selection, consent and launch history.
2. `/frontier` Neon research cosmos: cluster/LOD/paper inspector, graph edge filters, live research overlay, search, zoom presets and layer toggles.
3. `/projects/:id/lab` Experiment controller: hypotheses, evaluator, actual run/metrics/artifacts, physical point-cloud / 3DGS viewer for supported artifacts, current agent decision and event log.
4. `/projects/:id/agenda` Executable child research queue: priority, status, blockers, dedup and approve/launch/revise; trace parent verification.
5. `/projects/:id/judgments` Papiers source packets, judgment compiler proposals, dual-score tables, weight slider, action selection explanations and human approval.
6. `/projects/:id/forks/:forkId` Snapshot, w=0 and guided branches, independent actions, fair-measurement charts and uncertainties, replay with alternate w.
7. `/projects/:id/court` PARALLAX dispute, evidence, next discriminating experiment and verdict status (unresolved unless proven).
8. `/team` Live authorized sessions, participants, chat annotations, expertise requests, shared skills review/promotion, cross-project overlaps.
9. `/researchers/:id` Personal profile, principles, confidence, contributing notes, scope editor, learned methodological policies; private-by-default.
10. `/portfolio` All queued research agendas ordered by explainable utility, downstream unlocks and budget.
11. `/meta` Recorded research-policy comparisons, effect sizes / experiment logs, versions and rollback.
12. `/library` Search and inspect verified papers, source provenance, notes/annotations, reading history and corpus sync status.
13. `/settings` Integration status, workspace/members, data permissions, provider settings, resource budgets, accessibility, storage and demo mode.

## 6. Baseline science demo and plugin strategy

**Initial domain:** camera position/view coverage using known small mesh/voxel/point samples and camera visibility. This is a real, bounded scientific computation, not a trained 3DGS improvement claim. Inputs contain camera intrinsics/extrinsics, visible surfaces, candidate poses, optional held-out views. Baseline computes observed coverage and view quality per pose. A low-coverage candidate triggers discovery of missing geometry and creates a scene-completion subproject. Child compares meaningful options (e.g. conservative existing-geometry-only pose selection vs coverage-aware candidate selection or an actual supported inpainting plugin). Declare each proxy vs perceptual metric explicitly, preserve units/direction and evaluator version.

**Alternative plugin:** model-evaluation/scene-completion experiment when real compute/model resources are available. All the same architecture (proposal, run, logs, metrics, controls, dependency, human guidance) must work with at least two experiments, proving domain abstraction. Do not add simulated PSNR/SSIM/LPIPS/3DGS imagery and mark as measured. Honest research result may be negative or inconclusive.

## 7. Multi-module causal pipeline

1. Goal submitted and accepted → `goal.created`, scientific plan `plan.proposed/approved`.
2. Literature/Papiers/team retrieval with provenance → `source.retrieved` and evidence packet.
3. Candidate experiment set compiled; policy double-scoring → `policy.scored` → approved `action.selected`.
4. Execute actual evaluator → `experiment.started`, metric sample events, artifacts, `experiment.completed/failed`.
5. Interpretation and PARALLAX critique → `claim.proposed`, contradiction/dispute events.
6. If blocker → new graph node and agenda with `problem.discovered`, `agenda.queued`, `dependency.created`.
7. Priority/routing decision schedules child, consults expert when warranted.
8. Papiers judgment compiled → hypothesis+scoped principle proposed → human approves → rerank same candidates with guided w.
9. Fork and execute baseline/guided branches → compare honest measurements; save human influence evidence.
10. Resolve verified child, rerun parent acceptance test; update graph and downstream dependents.
11. Offer validated lesson for review, share with authorized team; second agent retrieves and tests transfer.
12. Meta evaluator compares competing research policies (and human consultation strategies) under matched budget; version/rollback. Repeat.

## 8. Traceable completion gates

**Gate G0:** scaffold, environment, contract, CI, all module directories and routing stubs, private repo; both agents start same commit. (Stubs permitted **only at G0**.)

**G1:** real corpus/paper search, realistic point cloud with live select and source details, projects/workspaces, backend graph and Tiger data migration, SSE/poll, integration wiring.

**G2:** Scientific Compiler, Gemini, durable bounded experiment and full lab/timeline; measured events persist through server restarts. FRONTIER generates real queued subproblem from threshold; parent dependency exists.

**G3:** Papiers note grounding, Judgment Compiler, exact two-score guided policy, researcher profile, human question, fully measured FORK comparison, decision logs and correct charts.

**G4:** PARALLAX, team River sessions, expertise routing, skill review and transfer, portfolio scheduler, truth-maintenance propagation.

**G5:** Meta-autoresearch, research policy versioning, library settings, multi-user auth/privacy, secondary science plugin, full UI routes, WebGL/accessibility/performance and comprehensive tests.

**G6:** Full smoke suite and security checks, provider demonstrations, judge flow, integration branch merged, production-readiness limitations recorded. **All G0–G6 required for 'complete'; iteration order does not excuse leaving a module unbuilt.**

## 9. Acceptance strategy

Every FR needs at least one automated test or scriptable acceptance sequence in `08_TEST_MATRIX.md`. Examples:
- `FR-052`: fixed shared candidates; w0, w1, w1.5 produce logged scores and predictable rankings, constraints honored, no-context fallback.
- `FR-042`: metric failure makes persisted linked child `queued` work item; re-run deduplicates; parent is not silently marked complete.
- `FR-081`: both executed branches have different run IDs and shared evaluator/dataset; pending branch cannot display metric.
- `FR-091`: candidate skill needs provenance/reviewer before team reuse; unauthorized retrieval 403.
- `FR-141`: every visible semantic paper point has a valid source ID or is explicitly fixture; decorative glows cannot be selected/counted.
- `FR-131`: database migration builds real hypertables and continuous aggregate; query proves persisted metrics through restart.
- `FR-120`: provider audit confirms an authenticated live Gemini request, with schema validation; disconnected path marked clearly.

Full test types: unit, contracts, DB migration/SQL, integration with fake providers, real-provider smoke (opt-in), E2E browser, image/interaction visual regressions, permission boundary, crash recovery, deterministic reproducibility, and load/performance.

## 10. Known limitations, quality threshold and future extensibility

A sophisticated multi-agent research platform cannot guarantee meaningful new science from arbitrary datasets or validate researchers' judgment with one comparison. Product communicates *bounded scientific experiments*, not promises of general scientific discovery. In v3, all subsystems must function on supported test research with clear evidence/permissions; full global arXiv ingestion and industrial production infrastructure are scaling targets rather than claims. All extra capabilities must be additive: API provider swaps, corpus expansion, distributed GPU workers, automatic 3DGS training, large-team management.

**Final delivery:** running repo + docs + migrations + reproducible demo + actual provider integrations + screenshot of expected neon scene + full backend test suite + complete feature matrix. PRD documents alone are not finished code.
