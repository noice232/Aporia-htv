# APORIA — COMPLETE ONE-FILE ENGINEERING HANDOFF v3

This companion combines all prose requirements for easy AI-agent ingestion. `contracts/openapi.yaml` in the ZIP remains authoritative for machine-readable wire schemas. Both older reference documents and three visual references are in `reference/`. **The handoff contains specification and contracts, not a built application.**



---

# INCLUDED DOCUMENT: README_FIRST.md

# APORIA — COMPLETE TWO-AGENT SRS / IMPLEMENTATION HANDOFF v3.0

**Purpose:** A specification sufficiently precise to hand to two autonomous coding agents. The user supervises decisions, periodically reviews/commits/pushes, and merges milestones. **No application has been implemented by this deliverable.** The prior v2 handoff was a narrow MVP and must be **discarded as implementation source of truth**.

## Do exactly this

1. Create a new **private** repository `aporia`, no APORIA open-source license by default; preserve third-party notices and agree authorship/ownership with collaborators.
2. Give a scaffolding agent THIS ENTIRE ZIP with `09_INITIAL_SCAFFOLD_PROMPT.md`. Have it commit G0 to `main`; review/push it yourself.
3. Create **two separate Git worktrees** at the SAME G0 commit. Agent A uses `05_AGENT_A_RESEARCH_ENGINE.md`; Agent B uses `06_AGENT_B_FRONTEND.md`.
4. Each agent works to completion across ALL requirements and checkpoints. Every milestone it locally commits and gives you a checkpoint packet. You inspect, approve and PUSH its branch; then integrate verified checkpoints. Do not ask either to "build the whole thing" without test gates; conversely, do not let them end at MVP.
5. Use `08_TEST_MATRIX.md` to judge whether each requirement actually works. For the intended Papiers/Gemini/Tiger prize demonstrations, provide actual authenticated connections; fixtures are not sponsor integrations.

## What changed from v2 / former FORKLINE v1.1

- APORIA is final product name; FRONTIER, PARALLAX, FORK remain subsystem names.
- **Full product scope** now mandatory: 16 functional modules, 13 navigable views, all required endpoints, real scientific runner, real team collaboration, Papiers judgment grounding, Gemini, Tiger, truth maintenance, portfolio and meta-policy.
- **Exact CFG-inspired policy:** two separately evaluated policies on the SAME candidates, `score_guided = score_uncond + w*(score_cond - score_uncond)`, extrapolation w>1, calibrated scores, hard constraints, recorded provenance and experiment forks. Old v1.1 single blended utility is superseded.
- **No 'P2 defer' loophole.** Required modules delivered in phases G0–G6; scaling to all of arXiv/production-grade multi-GPU is separately an infrastructure capacity question.
- **Human does not code backend.** Both lanes owned by coding agents, source-of-truth contract frozen, user periodically reviews/pushes.
- Old long-form v1.1 product and visual specs **preserved and APORIA-renamed** in `reference/` for detailed inspiration; SRS v3 controls if any conflict.

## Reading order

`01_COMPLETE_SOFTWARE_REQUIREMENTS.md` → `02_CFG_GUIDANCE_POLICY.md` → `03_FRONTEND_RENDERING_AND_UX.md` → `04_DATA_AND_EVENT_MODEL.md` → `contracts/openapi.yaml` → lane instructions (`05`/`06`) → `07_MILESTONES_AND_MERGE.md` → `08_TEST_MATRIX.md` → archived references/target PNGs. Contracts are the initial frozen v1 wire schema; schema changes require signoff and coordinated regeneration.

## Packaging map

- `01_...` 16-module full SRS and complete gates
- `02_...` concrete dual-policy guided decision algorithm
- `03_...` 13 screens and point-cloud art/interaction engineering
- `04_...` DB, events, provenance, teams, privacy and audit
- `05_...` Agent A detailed phases
- `06_...` Agent B detailed phases
- `07_...` worktrees, periodic human pushing, merge protocol
- `08_...` traceability and release acceptance
- `09_...` shared scaffold prompt
- `contracts/openapi.yaml` machine-readable API contract
- `contracts/fixtures/` safe deterministic sample objects
- `reference/` long-form renamed legacy specs + actual images

**Key product behavior:** give research objective → evidence-grounded compiler → actual bounded experiment → discover new dependency → obtain meaningful Papiers/human judgment → independently and conditionally score same experiments with configurable CFG-like guidance → run fair experimental fork → use results to update FRONTIER → team shares validated skills → agent improves future methods through trials.

**End condition:** complete working repo is built by agents and passes live/demo gates. This ZIP is a **requirements package**, not a runnable application.


---

# INCLUDED DOCUMENT: 01_COMPLETE_SOFTWARE_REQUIREMENTS.md

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


---

# INCLUDED DOCUMENT: 02_CFG_GUIDANCE_POLICY.md

# APORIA — Normative Dual-Policy CFG-Inspired Research Guidance v3

This document **replaces** the previous v1.1 line `score(a)=(1-w)*independentEvidenceValue(a)+w*researcherPreferenceValue(a)-penalty` as the authoritative implementation. The older convex combination is algebraically equal to the new formula **only within** `0 ≤ w ≤ 1` when the scores are identical in meaning; it does not express intended extrapolation for `w>1`, standardized per-candidate dual scoring, provenance and full audit.

## 1. Exact algorithm

For one snapshot of research context `C`, choose a common finite set of admissible candidate next actions `A={a_1,...,a_n}`. The candidates MUST have same IDs, resources/budget, context snapshot and evaluation rubric in both policies. Filter hard constraints BEFORE scoring and AGAIN before execution.

- **Unconditioned planner U:** scores each `a` using research objective, measured evidence, sources, uncertainty, cost and generic methodological rigor. It **does not** ingest researcher-specific style/priorities/Papiers notes (although it can ingest public scientific evidence independent of researcher preferences). Emit `s_u(a)`.
- **Human-conditioned planner C:** uses all public evidence U uses **plus** authorized Papiers highlights/notes, explicit human priorities, approved personal scientific principles and current intervention. Emit `s_c(a)` for the exact same `a` on the **same calibrated scoring rubric**.
- Guided action score: `s_g(a;w) = s_u(a) + w * (s_c(a) - s_u(a))`; select `argmax_{a∈A_feasible} s_g(a;w)` with deterministic tie-break rules.

`w=0`: independent policy (unconditioned); `w=1`: ordinary human-conditioned policy; `w>1`: extrapolates in direction of human influence. Example slider `0.0,0.5,1.0,1.5,2.0` with experiment admin-configured max `2.0` (max is **illustrative**, should be configurable and safety-tested). Negative `w` disabled by default. No instruction to ignore safety or scientific rigor may pass hard constraints.

This is a mathematically meaningful **discrete choice extrapolation inspired by classifier-free guidance**, not a claim to be computing the identical score/noise function in diffusion networks, nor proof that larger `w` improves science. Explain to users that the score blend biases *experiment selection*, not experimental measurements.

### The scoring rubric and calibration

Both planners score 0–1 on a predefined weighted rubric independent of the researcher's priorities (same weights/anchors for U and C; personalized context changes assessment, not underlying scale). Example generic dimensions: information gain 0–1, relevant evidence quality 0–1, expected objective progress 0–1, novelty 0–1, cost/budget efficiency 0–1, experimental discriminative power 0–1, relevance-to-human-purpose 0–1. The rubric is versioned and anchored with test examples. U receives an explicit neutral formulation of human-purpose relevance, C receives approved specific priorities; both use same dimension weights and anchors. If model outputs are uncalibrated, apply common predetermined calibration function (`score_scale_version`) or reject rather than mixing incomparable values. Store per-dimension scores and confidence/rationale. Do not re-normalize each policy independently to its own min/max because that can manufacture a guidance direction.

Potential safeguard: model returns evidence-grounded per-dimension values and deterministic rubric code computes `s_u`, `s_c`. This reduces score-scale drift. Unconditioned and conditioned calls need not be separate models; they must be **distinct contexts with logged inclusion/exclusion flags**, and source lists verified. Even if Gemini produces both in one batch request, conceal human-conditioned notes from the U subtask or use isolated requests to avoid context contamination.

### Worked deterministic example

| Action | Unguided `s_u` | Conditioned `s_c` | `w=0` | `w=1` | `w=1.5` |
|---|---:|---:|---:|---:|---:|
| A: visually attractive view | 0.80 | 0.50 | 0.80 | 0.50 | 0.35 |
| B: geometry-consistent view | 0.60 | 0.90 | 0.60 | 0.90 | 1.05 |

At `w=0`, choose A; at `w=1`, choose B; at `w=1.5`, choose B more decisively. **Guided scores may exceed [0,1] under extrapolation**—they are ranking scores, not calibrated probabilities. Never reinterpret `s_g=1.05` as 105% success probability or as a measured improvement.

### Selection and safety

1. Freeze decision snapshot: problem/goal, experiment registry, dataset/evaluator, budget, candidates, metrics and source ACL context.
2. Deduplicate candidates; assign stable IDs; reject those without runnable protocol, evaluator or defined metric.
3. Apply resource/ethics/scientific hard constraints; record infeasibility reason.
4. Evaluate independent policy with no private Papiers notes or personal preferences. Record model/rubric version and `s_u` vector.
5. Evaluate conditioned policy using only scoped, consented, review-approved insights. Record context source IDs, `s_c` vector and `confidence`. **Do not allow prompt injection in source material to change system/tool permissions.**
6. Confirm score commensurability and completeness for all feasible candidates. If unavailable, request human review or use honest `w=0` fallback; never silently fabricate values.
7. Compute extrapolated scores deterministically, rank with fixed tie-break: highest `s_g`, then highest evidence quality, then lowest estimated execution cost, then lexicographic candidate ID.
8. Apply final hard filters and human approval if required; emit `policy.scored`, `action.selected` with full explanation and provenance.
9. Execute selected experiment under configured budget. Record metrics separately from predicted scores.
10. Use recorded trials to test whether particular `w` values actually cause better outcomes. Only suggest updated `w` based on controlled/meta evaluations, not because the user moved a slider.

### Handling policy conflicts and missing context

- If no authorized Papiers/human preference: `s_c=s_u` with `conditioned_context_status=missing`, and notify UI `unguided_only`. The zero difference is not proof of agreement.
- If a human preference conflicts with safety or fixed evaluator, that candidate remains infeasible regardless of `w`.
- If two humans disagree, each judgment is its own sourced context/policy; do not average beliefs. Route to PARALLAX to design discrimination.
- If human feedback changes the scientific **objective or metric**, this is a *different experimental comparison*. Freeze shared evaluation metrics to compare outcomes fairly, and display revised objective separately. Do not declare branch universally better just because it optimized different targets.
- A source highlight is only evidence of what the person marked, not automatic endorsement; distinguish note/approval timestamps.

## 2. Normative persisted entities

**PolicySnapshot:** `id`, `project_id`, `research_goal_version`, `candidate_set_hash`, `candidate_ids[]`, `metric_rubric_version`, `constraints_hash`, `evidence_source_ids[]`, `human_context_source_ids[]`, `prompt_template_version`, `model_provider`, `model_id`, `created_at`, `workspace_id`.

**CandidateScore:** `policy_run_id`, `candidate_id`, `s_unconditioned`, `s_conditioned`, `delta`, `s_guided`, `weight`, `rubric_dimension_scores_u`, `rubric_dimension_scores_c`, `explanation_u`, `explanation_c`, `feasibility`, `infeasibility_reason`, `calibration_version`, `source_refs`, `validation_state`, `data_mode`.

**PolicyRun:** `id`, `snapshot_id`, `w`, `selected_candidate_id`, `fallback_reason`, `computed_at`, `proposer`, `human_approval_id`, `source_acl_digest`, `scores[]`, `status`, `policy_version`. Complete policy history immutable; slider recalculation creates a derived view or new run, not mutation of the historical executed choice.

**Intervention:** `id`, `person_id`, `source_note_id?`, `original_text`, `interpreted_preference`, `scope`, `approved`, `applied_policy_run_id`, `created_at`.

**ResearchFork:** `checkpoint_id`, `branch_0.policy.w=0`, `branch_guided.policy.w=approved`, `shared_evaluator_id`, `shared_dataset_hash`, `shared_budget`, `run_ids`, `comparison_status`, `measured_metrics`, `limitations`.

All scored actions must link to **hypothesis** and **runnable experiment** IDs. Never return just scalar scores detached from the scientific question.

## 3. API and event requirements

- `POST /api/v1/projects/{project_id}/policy/score` accepts `candidate_ids`, `snapshot_id`, `weight` and optional approved `intervention_id`; returns `PolicyRun` with all per-action scores. **Server recomputes** scores and validates approval; frontend cannot submit arbitrary trusted `s_c`.
- `GET /api/v1/projects/{project_id}/policy/runs/{policy_run_id}` returns full score/provenance explanation.
- `POST /api/v1/projects/{project_id}/policy/choose` accepts `policy_run_id`, `candidate_id?`, `human_approval_id`, idempotency key; enforces constraints and prevents unapproved overrides.
- `POST /api/v1/projects/{project_id}/forks` captures an existing policy decision/checkpoint and launches independent vs guided paths. Both branch actions/metrics are distinguishable.
- Events: `policy.snapshot_created`, `policy.scored`, `policy.fallback`, `action.selected`, `intervention.approved`, `fork.created`, `fork.branch_completed`, `meta.policy_evaluated`.

## 4. Exact frontend controls

On the Judgment & Guidance view, show note source/link, human interpretation, approval status, common candidate experiment table (`Experiment`, `Evidence`, `s_u`, `s_c`, `Difference`, `Guided score`, `Eligible`, `Why`), slider `w` (defaults e.g. 1, range 0–2), explicit labels `Independent`, `Human-aligned`, `Extrapolate`, highlighted `argmax` and `Run chosen experiment`. Do not color an action 'best science' based on subjective guidance score. Visualize policy action changes live on slider, but **do not claim an actual experiment was executed** until backend runner confirms measured run. Show replayable w=0 vs w>0 fork view.

## 5. Test cases (non-optional)

- **CFG-01 math:** table above yields A@0, B@1, B@1.5 and numeric scores 0.35/1.05.
- **CFG-02 isolation:** U payload cannot include Papiers source text, personal profile, or approved preference; C payload can include authorized context only.
- **CFG-03 common candidates:** adding an action to one policy but not the other invalidates scoring; no ranking until identical set.
- **CFG-04 hard constraints:** infeasible action with `s_g=999` is never chosen.
- **CFG-05 no-context:** fallback marks missing instead of fabricating alignment.
- **CFG-06 score-scale mismatch:** rejected with explicit error (not combined).
- **CFG-07 source permission:** a note not visible to the user cannot affect C.
- **CFG-08 fork fairness:** same dataset/evaluator/budget hash (or recorded explicit deviation), distinct run IDs and measured outcomes.
- **CFG-09 idempotency:** retries cannot double-execute chosen experiment.
- **CFG-10 metaevaluation:** conclusions about optimal w require actual trials and admit inconclusive outcomes.

## 6. Judge explanation

“We score each possible experiment twice: once using independent scientific evidence, and once with a researcher's Papiers-grounded judgment. We then apply a controllable guidance weight, **including extrapolation above one**, to choose the next experiment. Crucially, we actually run the unguided and guided branches and compare evidence—human intuition earns trust through experiments, not merely through the AI agreeing with it.”


---

# INCLUDED DOCUMENT: 03_FRONTEND_RENDERING_AND_UX.md

# APORIA — FRONTEND SRS / VISUAL ENGINEERING SPEC v3

**Owner:** Agent B in `apps/web/**`. **Target:** browser-based, actual interactive WebGL/Three.js system, not a generated image, noninteractive SVG wireframe or simple spiral layout. This document supersedes older FRONTIER art directions; older long-form spec is included as secondary reference.

## 0. Composition and aesthetic

**Visual equation:** Paperscape paper identities + Cosmograph graph density/navigation + glowing volumetric point-cloud sculpture/neon bloom + research debugger and scientific lab. An arXiv/OpenAlex **paper is ONE selectable semantic dot**; thousands of tiny noninteractive decorative dust photons may reinforce visual mass but may never be included in semantic paper counts/search/selection.

Desktop at 1440×900: app header 48–60px; left collapsible rail 200–255px; central visualization majority remaining width with optional non-modal right inspector 280–360px; bottom timeline 95–160px expandable. Center visualization dominates first impression, with panels translucent, collapsible, overlaid and never forcing a tiny diagram. At smaller widths replace sidebar/right inspector with drawers; retain full-screen canvas and visible research control. Search in slim upper overlay. On a blank launch show immersive paper universe, not giant marketing text.

**Colors:** background `#05070C` / `#090C13`; rail `#0B111B`; border `rgba(151,180,220,0.14)`; base text `#E5EFFA`; muted `#8898AF`; semantic cluster colors mint `#4EE8BA`, cyan `#57DDF6`, icy `#B4F2FF`, lavender `#B99AFF`, subtle fuchsia `#E790EE`; amber only for research blockers or attention, red for falsified/failed evidence. Semantic colors should not make all papers in every category the same flat discs. CSS should not imitate generic glass SaaS cards or render concentric node rings.

Visual priorities (descending): organic high-density research-paper point clouds; clearly perceptible 3D depth; smooth interaction/hover focus; subtle glow bloom; readable inspector/time-series; tasteful labels. Avoid bright UI chrome, SVG radial-gradient mockups, static image-as-canvas, huge default on-scene labels or always-on edges.

## 1. Real point-cloud universe render

- R3F/Three.js with `BufferGeometry`, batched `Points`/`InstancedBufferGeometry`, soft-disc fragment shader (circular falloff) and additive/nearly-additive blending with depth attenuation. Configure tone mapping/exposure and UnrealBloomPass or R3F postprocessing bloom; do not let all pixels wash out white.
- Layout: generated from actual citation/semantic/group memberships. `@cosmos.gl/graph` may produce graph layout/positions (confirm installed API and license), or use seeded offline UMAP/force layout; persist `x,y,z` and deterministic layout version so reload doesn't remix graph. Avoid running two force layout engines on same frame. If cosmos WebGL renderer is active simultaneously, avoid wasteful overlapping canvases/selection conflicts; preferred approach is reuse positions and render semantic points in Three.js.
- Color by research neighborhood; point size from visual salience/citation count in bounded log scale; positions reflect embedding/neighborhood not fake random domain spheres. Cluster cores brightened where semantic density is high; faint irregular wisps and empty pockets. Embed Z from a documented weak depth basis if underlying embedding is 2D; never imply scientifically meaningful depth.
- Visibility / loading: chunk by clustering/community; 1k/10k/100k switches and progressive loading; stable IDs with selected point ref; GPU picking by ID framebuffer or Three Raycaster for manageable batches. Use frustum/zoom LOD and hover throttle. Search/filter updates semantic target set, not decorative dust. Show `indexed`, `visible`, `rendered dust` separately if numbers shown.
- Curves/edges: citations and evidence/dependencies are types, not all the same. By default fade/show sparse important intercluster relationships; hover reveals one-hop related papers and support/contradiction edges. Labels on focus/hover or gentle 2–4 anchor titles at most; never hundreds of always-on labels.
- Camera: orbit, pan, inertial zoom/fly-to, reset/home, 2D projection toggle if performant, minimap optional, search fly-to and saved selection. On clicked paper show source title, authors, date, URL, abstract, source provenance, related citations and why retrieved.
- New research node appears based on real backend `problem.discovered` + `agenda.queued` events, not animated on a timer. Research nodes are NOT arXiv dots: use brighter multi-ring halo/pulse and connective filament to parent objective. Clicking goes to actionable agenda.
- No WebGL: list/tree/table fallback with search, node inspector and timeline; usable functionality remains.

## 2. Screens and concrete interactions

### `/` Launch / research intake
Objective textbox, workspace selector, dataset/source-scope picker, optional team toggle, cost/safety cap, `Compile research` → plan proposal → edit/approve → `Start`. Show no pseudo "running" when offline.

### `/frontier` FRONTIER universe
Scene with real paper graph, source counts, search and filters (paper, claim, agenda, method, evidence, project, judgment); select topic, paper, research question, link, project. Right inspector tabs `Evidence`, `Dependencies`, `People`, `Experiments`, `Source`. Event dock at bottom. Animate blocker as new node at event timestamp. Provide transparent option for 2D/table layout for accessibility.

### `/projects/:id/lab` Research Lab
Goal/status, planned protocols, hypothesis list, live/post-run metric plots, logs and artifacts, dataset/evaluator hashes, reproducibility invocation, cancel/retry, evidence inspection, source links, human requests and next-agent decision. A failed run must look failed. Include a **distinct physical scene viewer** (real point cloud, mesh or supported Gaussian splat) when real artifact exists. It supports orbit, camera-pose overlay, optional confidence/coverage heatmap, view A/B and clicking an evidence-backed uncertain region to propose a FRONTIER child question. It is not the same renderer as the abstract paper universe. Images of actual 3D scenes/point clouds only if there is a real artifact with provenance.

### `/projects/:id/agenda` Research Agenda
Tasks with problem statement, status, source experiment, existing related research, dependencies (parent/child), prioritization score decomposition, acceptance criterion, estimated cost, human assignee, queue/launch/reprioritize. Parent cards show `blocked by X` until verification. Hover task highlights related FRONTIER node.

### `/projects/:id/judgments` Judgment Compiler + CFG
Papiers source search/selection with exact note locators; editable extracted testable claim; approval/reject; **same candidate experiments dual-scored** with columns `s_uncond`, `s_cond`, delta, guidance w, `s_guided`, eligible, rationales; weight slider w 0–2 (configured), live action ranking, frozen snapshots, provenance, `Run` only after approval. No measured outcome before execution. User can inspect original and guided policy prompts' provenance summaries (redact private content appropriately), see w=0 action vs w selected, and launch controlled fork.

### `/projects/:id/forks/:forkId` Scientific Fork Explorer
Decision checkpoint, two comparable experiment policies, branch timeline nodes, independent code/dataset/evaluator/budget/protocol, measured metrics and confidence bars. Cross-time travel by creating new branch from existing checkpoint; never alter old measured runs. If objectives differ, show Pareto/tradeoff/limitations rather than a fake single winner. Both pending and failed are honest visual states.

### `/projects/:id/court` PARALLAX
Human and agent claims / who said them; support and contradiction edges, assumptions, discriminating test proposal, ability to approve/run; persist unresolved status until empirical result and expert review. No conversation-only theatre.

### `/team` River collaboration
Live sessions with participant role, event streams, authorized chat/comment, agent ownership, role-selected expertise request cards, shared reviewed-skill library and review queue, provenance, duplicate-project discovery. Second demo user joins/changes action; page updates across clients, not merely two labels on one screen.

### `/researchers/:id`
Scoped scientific profile, priorities, rule candidates, evidence, approved/invalidated rules, intervention history, visibility controls, editable researcher preferences, history of when intuition improved or hurt outcomes (only from measured comparisons).

### `/portfolio` and `/meta`
Portfolio tabular/graph priority rankings, project blockers and unlock count, task scheduling and explanation. Meta page shows policy trial comparison, w sweeps, matched evaluator hashes, evidence sufficiency, strategy versioning and rollback.

### `/library`, `/settings`
Real corpus search, Papiers/notes/source locators, distinction citation vs embedding vs human annotations, integrate sync status/errors. Workspace access; provider health (`gemini`, `papiers`, `tiger`/fallback); budgets; visibility/consent; demo mode; accessibility.

## 3. Shared UI architecture

- Client API module generated/typed from `contracts/openapi.yaml`; frontend uses only API requests, not direct DB or Gemini credentials.
- Server events via EventSource SSE with reconnect and monotonically increasing `sequence`; fallback polling `after=sequence`, dedup by event ID. Re-fetch snapshot after reconnect if gap.
- React state modules: `projects`, `graph`, `events`, `runs`, `agenda`, `judgments`, `policy`, `forks`, `team`, `profile`, `sources`, `meta`, `settings`. Optimistic updates limited to UI state, never claim a backend operation succeeded before ACK.
- Validation/error: all actions need loading, success/error, retry/cancel where appropriate; provenance badges `Measured`, `From Papiers`, `From OpenAlex`, `Demo fixture`, `Proposed`, `Unknown`.
- Accessibility: DOM mirror/keyboard navigable node list, focus ring, selectable annotation list, mobile-safe alternatives; reduced-motion WebGL disabling effects and minimum accessible contrast.

## 4. Visual verification before merge

Agent B MUST capture reproducible screenshots/videos at 1440×900 against `reference/point-cloud-target.png`, `reference/cosmograph-target.png`, and `reference/target-ui-render.png`. A basic force-directed labeled circle chart **fails** even if semantic graph is correct. Requirements: visibly dense nonuniform point masses, soft glow, dark near-black background, useful depth via camera move, local edge highlighting, functional search, source inspector, research blocker blooming from event. Do not use target images as background replacements. Test 25k visible points reference hardware, record approximate fps. No untrusted remote images/corpus claims baked into visuals.

## 5. Module integration matrix

| Frontend view | Backend requirement | Test |
|---|---|---|
| Home | Projects + compiler | Goal persists, plan approved, project starts |
| Universe | Corpus + graph + events | Paper click opens source; blocker event appears |
| Lab | Runner + artifacts/metrics + physical scene viewer | Real recorded run after reload; interactive artifact viewer or explicit unavailable status |
| Agenda | Recursive dependency/portfolio | Child created, dedup, parent verification |
| Judgment | Papiers + compiler + policy | w slider reranks same candidate set with exact formula |
| Forks | branch run/checkpoints | real/pending properly marked, controlled comparison |
| Court | scientific criticism | disagreement yields test proposal and status |
| Team | session stream, approvals, skills | authorized second session contribution and reuse |
| Researcher | profile/ACL/feedback | scoped principle editable, inaccessible to nonmember |
| Portfolio/Meta | priorities and policy trials | ratings evidence and policy versioning |
| Library | Papiers/OpenAlex | real locator, source permissions |
| Settings | provider health and ACL | live vs fixture mode explicitly shown |


---

# INCLUDED DOCUMENT: 04_DATA_AND_EVENT_MODEL.md

# APORIA — Data, permissions, artifacts, event model and contracts

**Owner:** Agent A for tables/storage/events; both agents consume `contracts/openapi.yaml`. Approval of breaking changes by user. **Conventions:** IDs are opaque UUID/string; all times UTC RFC3339; decimals are finite numbers and include units; source references are immutable snapshots/locators; data modes are `measured`, `live_source`, `proposed`, `planned`, `demo_fixture`, `disconnected`, `error` as applicable. Do not confuse real literature metadata (`live_source`) with measured experimental results (`measured`).

## 1. Canonical relational entities and required columns

1. `users(id, display_name, created_at)`, `workspaces(id, owner_id, name, visibility)`, `memberships(workspace_id, user_id, role, state)`; unique membership, user-level ACL checks.
2. `projects(id, workspace_id, title, objective, objective_version, status, created_by, created_at, archived_at)`; `research_sessions(id, project_id, actor_id, state, checkpoint_id, started_at, updated_at)`.
3. `paper_sources(id, canonical_arxiv_id?, doi?, openalex_work_id?, title, authors_json, published_at?, source_url, abstract?, citation_count?, provenance_json, indexed_at, embedding_ref?)`; indexes on arXiv DOI/OpenAlex, full-text. `paper_links(source_paper_id, target_paper_id, relation_type, provenance, weight)`.
4. `source_contexts(id, provider, owner_id?, workspace_id?, project_id?, source_locator, kind, body_ciphertext_or_pointer, fetched_at, consent_scope, permission_hash, data_mode, metadata_json)`; separate private Papiers content/access. `source_usages(id, decision_id, source_context_id, usage_kind)`.
5. `graph_nodes(id, workspace_id, project_id?, kind, title, summary, status, confidence?, owner_id?, source_refs_json, attributes_json, data_mode, version, created_at)`; `graph_edges(id, source_node_id, target_node_id, relation, evidence_source_ids_json, status, created_at)`; direction for `depends_on`: `parent → required_child`, so `parent` blocked by `child`.
6. `hypotheses(id, project_id, title, statement, controls_json, metrics_json, constraints_json, status, source_ids_json, proposed_by, reviewed_by?, created_at)`; `experiment_specs(id, hypothesis_id, plugin, evaluator_id, evaluator_version, dataset_id, dataset_sha, parameters_json, seed, budget_json, success_criteria_json, created_at)`.
7. `experiment_runs(id, spec_id, project_id, session_id, branch_id?, status, started_at, ended_at?, code_sha, dataset_sha, evaluator_version, seed, run_command_redacted, artifact_manifest_json, metrics_json, error_json?, data_mode)`.
8. `agenda_items(id, workspace_id, project_id, problem_node_id, originating_run_id?, originating_event_id, question, status, priority, priority_breakdown_json, blocked_parent_node_id, completion_criteria_json, assigned_agent_id?, assigned_user_id?, dedup_key, created_at)`; status `proposed|queued|active|blocked|needs_human|validated|rejected|completed`.
9. `claims(id, project_id, statement, status, evidence_refs_json, confidence?, reviewer_id?, created_at)`; `claim_dependencies(claim_id, upstream_claim_id, relation, status)` for truth propagation.
10. `human_questions(id, project_id, reason, prompt, options_json, evidence_refs_json, status, routed_to_id?, opened_at)`; `human_interventions(id, project_id, question_id?, author_id, source_context_id?, original_text, interpreted_judgment_json, decision_json, approval_state, access_scope, applied_policy_run_id?, created_at)`.
11. `researcher_profiles(user_id, workspace_id?, personal_preferences_json, expertise_json, methodological_rules_json, assumptions_json, confidence_json, visibility, version)`; store rule provenance separately.
12. `policy_snapshots(id, project_id, objective_version, candidates_hash, rubric_version, evidence_ids_json, human_source_ids_json, constraints_hash, model_provider, model_id, created_at)`; `policy_runs(id, snapshot_id, project_id, w, selected_candidate_id?, status, actor_id, approved_intervention_id?, fallback_reason?, raw_json, created_at)`; `candidate_scores(policy_run_id,candidate_id,s_unconditioned,s_conditioned,s_guided,delta,dimension_json,explanations_json,feasible,reason,calibration_version)`.
13. `research_forks(id, project_id, checkpoint_id, human_intervention_id?, original_policy_run_id, guided_policy_run_id, comparison_status, common_dataset_sha, common_evaluator_version, common_budget_json, limitations_json)`; `fork_branches(id,fork_id,branch_type,policy_run_id,status,run_ids_json,result_json)`.
14. `research_lessons(id, workspace_id, created_from_intervention_id?, title, statement, applicability_json, counterexamples_json, evidence_run_ids_json, version, review_state, reviewer_id?, visibility, created_at)`; `skill_usages(lesson_id, agent_id, target_project_id, candidate_action_id, transfer_experiment_id?, result_state, created_at)`.
15. `agent_profiles(id, workspace_id, role, capabilities_json, tool_allowlist_json, model_profile_json, created_at)`; `agent_jobs(id, project_id, profile_id, idempotency_key, status, budget_json, started_at, ended_at, checkpoint_ref?, error_json?)`.
16. `audit_log(id, workspace_id, actor_id, operation, resource_type, resource_id, occurred_at, redacted_details_json)`, `artifact_blobs(id, run_id, uri, sha256, content_type, privacy_scope, size_bytes, created_at)`.
17. `research_strategy_versions(id, name, config_json, status, evidence_run_ids_json, created_at)` and `meta_trials(id, strategy_a_id, strategy_b_id, common_conditions_json, measured_results_json, conclusion_state, created_at)`.

All mutable domain tables need `created_at`, `updated_at`, optimistic `version` where appropriate. Field-level source ACL and deleted-user data handling should be implemented; never publish internal notes by default.

## 2. Tiger Data time-series tables

**Hypertable A:** `research_events(occurred_at TIMESTAMPTZ, event_id UUID, project_id UUID, session_id UUID?, sequence BIGINT, type TEXT, actor_id UUID?, entity_id UUID?, data_mode TEXT, payload_json JSONB, correlation_id UUID, idempotency_key TEXT?)`. Partition on `occurred_at`. Monotonic **per-project `sequence`** allocated transactionally in normal relational table `project_event_cursors`, not derived from timestamp. Hypertable uniqueness constraints must include partitioning time; enforce idempotency via non-hypertable `job_idempotency` index if necessary.

**Hypertable B:** `experiment_metric_samples(observed_at TIMESTAMPTZ, project_id UUID, run_id UUID, metric_name TEXT, value DOUBLE PRECISION, unit TEXT, protocol TEXT, step BIGINT, source_mode TEXT)`. Validate finite values and protocol; queries scoped by workspace/project and run.

**Continuous aggregate:** `research_activity_by_minute` buckets `research_events` by `time_bucket('1 minute', occurred_at)`, groups `project_id`, `type`, counts events; show live activity chart with recent raw tail if continuous aggregate refresh is delayed. **Do not assume materialized aggregates automatically include fresh rows**; Tiger Data supports explicit refresh/real-time config. Optionally create `run_metrics_by_minute` for trends. Include migration for TigerDB version in use; SQLite fallback implements compatible API in local mode but is labeled.

Persist experiment results and graph node update in same consistent flow (transaction or outbox pattern). The event log is authoritative for history; graph and read models are rebuildable from events + snapshots. Define event upcast strategy on schema versions.

## 3. Required semantic event types

`workspace.created`, `project.created`, `goal.created`, `plan.proposed`, `plan.approved`, `source.retrieved`, `source.unavailable`, `corpus.indexed`, `policy.snapshot_created`, `policy.scored`, `policy.fallback`, `action.selected`, `experiment.queued`, `experiment.started`, `metric.recorded`, `experiment.completed`, `experiment.failed`, `experiment.canceled`, `claim.proposed`, `claim.disputed`, `claim.invalidated`, `disagreement.opened`, `disagreement.test_approved`, `problem.discovered`, `problem.deduplicated`, `dependency.created`, `agenda.queued`, `agenda.prioritized`, `agenda.started`, `agenda.completed`, `parent.revalidated`, `human_question.opened`, `human_answer.recorded`, `intervention.approved`, `expertise.requested`, `fork.created`, `fork.branch_completed`, `fork.compared`, `lesson.proposed`, `lesson.reviewed`, `lesson.rejected`, `lesson.reused`, `transfer.experiment_completed`, `team.member_joined`, `team.comment_created`, `truth.revalidation_requested`, `meta.policy_evaluated`, `llm.plan_generated`, `llm.plan_failed`, `provider.health_changed`.

All events include id, `schema_version`, project/session/workspace and actor as relevant, sequence, server timestamp, object ID, payload, `data_mode`, `correlation_id`. Event payloads are **not** generic opaque human-trustworthy arbitrary LLM text: validated against event-type schemas. `after=<sequence>` supports cursor pagination; SSE may emit heartbeat without advancing sequence.

## 4. Data-state taxonomy and claim truth

- Proposed hypothesis ≠ tested finding.
- Preliminary experimental observation ≠ replicated finding.
- Published paper metadata ≠ paper's scientific claims proven.
- Human preference/annotation ≠ truth. A human can be right, wrong, uncertain, or simply express optimization preferences.
- `validated` requires declared acceptance protocol/measurement, reviewer status and origin; `replicated` separate flag. `invalidated` does not delete prior record.
- Experiment run `measured` requires actual execution artifact and evaluator hash, not a model-generated number. Comparison may be `partial`, `completed`, `incomparable` or `not_evaluated`.

## 5. Access control matrix

| Resource | Owner | Same workspace member | Unrelated user | Global/public (opt-in) |
|---|---|---|---|---|
| Personal Papiers annotations | Read/write | No unless explicitly shared | No | No default |
| Personal judgment profile | Read/write | Aggregated opt-in only | No | No default |
| Team research events | Read/write by role | Scoped read/comment | No | Explicit publication only |
| Private experiment artifacts | Read/write | Based on project membership | No | Explicit release only |
| Approved team skills | Read/write/review | Read + usage logged | No | Requires independent opt-in |
| Public arXiv/OpenAlex metadata | Read | Read | Read per corpus policy | May be linked |

Permission tests must use API as well as retrieval and agent tool invocation; an LLM running for a teammate must not fetch a private Papiers note just because it shares a project label. Source snippets in prompts should be redacted/filtered before external Gemini calls unless user/workspace has authorized that transfer.

## 6. Storage, artifacts and integrity

- Artifact URI can be local private file path mapped through authenticated `/api/v1/artifacts/{id}` or object storage signed URL; no raw filesystem leakage or unsecured absolute paths.
- Compute SHA-256 for datasets/code/config/output/metadata manifest. Fixed random seed for baseline; record nondeterminism of GPU ops if applicable.
- Record stdout/stderr with redaction and truncation, independent evaluator output, status and budget consumption.
- Keep detailed source attribution per knowledge item and user approval; duplicate paper IDs collapse deterministically.
- Failed Papiers/Gemini/Tiger connections propagate visible provider health states and an honest `offline` status, not auto-fabricated live records.

## 7. Contract change procedure

During scaffold, contracts are generated once and frozen as `v1`; both branches build against same committed version. Breaking changes require a proposed new version (`v1.1` additive; `v2` breaking), approval recorded in `docs/contract-decisions.md`, updated OpenAPI, backend model, frontend client fixture and tests. Changes are applied on `main` or dedicated integration branch before agents rebase; no unilateral edits to `contracts/` from branch A or B. Appendix contracts contain initial sample shapes; implementation may expand only via approved changes.


---

# INCLUDED DOCUMENT: 05_AGENT_A_RESEARCH_ENGINE.md

# AGENT A — Research Engine, Scientific Integrity and Integrations

**This is an autonomous coding-agent task specification, not an instruction for the human to code.** Worktree: `../aporia-research`, branch `feat/research-engine`. Own exactly `services/**`, `packages/**`, `infra/db/**`, `tests/backend/**`, `docs/backend-*.md`. Scaffold/root/contracts/fixtures changes require approval by the human integrator. Read SRS, dual-policy algorithm, data/event model, API contracts and the old vision reference before coding.

## Mandate / completion standard

Implement the FULL backend: research objectives; sources and Papiers; Gemini structured planning; reproducible experiment loop and bounded image/camera domain plugin; recursive child agendas; double-score CFG policy and judgment compiler; human questions and expertise; actual counterfactual branches; PARALLAX; team sessions and reviewed lesson transfer; portfolio scheduling; truth maintenance; meta-policy comparisons; Tiger Data persistence/analytics; multi-user access, provider health, auditing, safe worker/executor, migrations and tests. **Do not stop at the first functioning demo.** Every API endpoint in `contracts/openapi.yaml` must have a real handler and contract test by completion, not `501` or `TODO`.

## Phase A0 — Discovery/alignment (no code modifications outside owned paths)

1. Read all v3 docs, inspect scaffold/API contracts and fixture IDs, report assumptions and API issues as change request before implementation.
2. Confirm real vendor SDK signatures using installed versions (Google GenAI API, Papiers CLI, Tiger Data/Timescale); do not guess flags. Choose pinned Python and Node versions compatible with scaffold.
3. Install/test tools, write risk list: credentials Papiers, Gemini key, Tiger Cloud, arXiv/OpenAlex rate limits and evaluation data.
4. Create backend test matrix with requirement IDs and no fake passing results.

## Phase A1 — Persistent foundation

- SQLAlchemy/Pydantic/migrations; Tiger cloud/Timescale hypertables + one working continuous aggregate; standard Postgres fallback; separate source ACL and artifact storage.
- FastAPI health, projects, workspaces/memberships, authentication/role checks, graph/sources/history endpoints.
- Durable event append/SSE/poll, per-project sequence transactionally assigned and replayable; idempotency keys, simple job queue and reliable restart behavior.
- Actual literature ingestion of a real bounded arXiv/OpenAlex set with stable IDs and graph citation vs similarity distinctions; source previews/ACL.
- Unit tests: migration up/down, unique cursors, restart persistence, team ACL, source metadata validity, provider health reporting. Commit `A1: persistence and research events`.

## Phase A2 — Scientific compiler + real autoresearch

- `ResearchPlan` validated from Gemini (real SDK), generated with bounded evidence/context; handle unavailable Gemini with explicit degraded mode; no unsupported citations.
- `ExperimentSpec` with evaluator plugin, measurable success criteria, control variables, budget, seed, artifacts, execution fingerprint.
- Implement camera visibility/viewpoint coverage real numeric evaluator using small known geometry/sample scene and camera intrinsics/extrinsics, candidate poses and held-out views. Expose actual artifact geometry/camera poses/uncertainty overlay data for Agent B physical scene viewer through secure artifact API. Decide quality metric and coverage threshold before first run; maintain reproducibility.
- Worker executes safe isolated plugins (no direct unbounded LLM shell), records runs and metric samples. Agent interprets run and either improves candidate protocol, rejects hypothesis, creates blocker based on metric, or completes bounded goal.
- FRONTIER graph plus agenda child semantics, priority scheduler/dedup/parent blocking and parent revalidation.
- Implement source and claims provenance; reproducible experiment commands in artifact inspector. Tests with fixed geometries and expected coverage numbers; detect blocker only when threshold reached, dedup duplicate run/replay. Commit `A2: full goal-to-blocker research loop`.

## Phase A3 — Judgment Compiler + exact CFG + forks

- Papiers CLI read-only adapter with auth/status, secure authorized source retrieval and note/highlight identification; no fabricated Papiers content. Source may be direct user-provided judgment when not connected.
- Gemini judgment/hypothesis compiler with strict output structure, source grounding, human approval before policy effect.
- EXACT `s_g(a)=s_u(a)+w(s_c(a)-s_u(a))` applied to identical candidate set, shared rubric and score calibration, hard filters, w 0–2 configurable. Independent U excludes human-specific source material, conditioned C includes approved authorized context. Persist candidate-level vectors with evidence/rationale and cache/cache-invalidations for slider w changes. Do not call this actual diffusion CFG; validate as discrete analog.
- Choice and counterfactual: checkpoint and two separately executed bounded branches with original/guided policy, identical dataset/evaluator/resources where possible. State divergence only if choice actually changes. Honest pending/incomparable statuses and confidence.
- Test cases `CFG-01` to `CFG-10`, end-to-end approval and fork branch persisted records; test w>1, no context fallback, ACL, high-score hard constraint rejection. Commit `A3: grounded guidance and verified forks`.

## Phase A4 — Collective scientist systems

- PARALLAX profiles investigator, skeptic, methodologist, researcher-aligned critic; disagreement objects with evidence, proposed discriminating experiment, proof status. No consensus-vote truth.
- Researcher profiles: scoped evidence, preferences, methodological rules and consent; human question/answer and opt-in expertise routing backed by project contributions.
- River team sessions: events/comments/shared stream, membership ACL, second user participation, lesson candidate → review → promotion → retrieval → test transfer on a different project; dedup related research.
- Truth maintenance: contradiction propagation across claim/dependency graph, queue revalidation, parent status updates.
- Portfolio priorities: information gain, unlock impact, cost, uncertainty, user priorities, rationale and queue scheduling.
- Versioned metaresearch strategy comparisons on matched evaluation budget and actual tracked outcomes; rollback, failure/inconclusive states.
- Tests: second user access/no access, consensus disagreement doesn't count as evidence, reviewer gate, transfer test, propagation from invalidated finding and meta-run trace. Commit `A4: team/critic/meta systems`.

## Phase A5 — Sponsor and production hardening

- Gemini real request receipt/metadata, schema errors and rate limits; Tiger Cloud migration + real persisted timeline/continuous aggregate; Papiers real read when owner authenticated; provider states honest.
- Secondary experiment plugin (even modest algorithmic image/camera method comparison) to prove architecture generality without unsupported training claims.
- Worker cancellation, timeout, crashes, safe sandbox, ACL across agent retrievals, secrets/log redaction, performance, test coverage and docs.
- End-to-end integration with Agent B's UI on integration branch; no claiming full science generality from proxy. Commit `A5: hardened full backend`.

## Backend design interfaces (conceptual responsibilities; implement source after scaffold)

- `LLMProvider` (`GeminiProvider`, swappable `OtherProvider`) with structured output and provenance.
- `ContextProvider` (`PapiersCLIProvider`, `ArxivProvider`, `OpenAlexProvider`, `TeamMemoryProvider`) with signed access context and source IDs.
- `ExperimentRunner` / `EvaluatorPlugin` with immutable experiments, deterministic testing, sandbox/budget and artifact hashes.
- `GraphRepository` and `TruthMaintainer`, `AgendaScheduler`, `PortfolioRanker`.
- `DualPolicyScorer` with `PolicySnapshot`, one feasible candidate list, U and C scoring and guidance/rationale.
- `HumanQuestionRouter`, `JudgmentCompiler`, `ResearchForkService`, `SharedSkillRegistry`, `MetaEvaluationService`.
- `WorkspaceAuth`, `SourceACL`, `EventStore` and `ResearchRepository` abstract real persistence/provider specifics.

## Required ongoing communication with human integrator

At EACH checkpoint: **(1)** report implemented modules by FR IDs, **(2)** run tests and paste actual commands/results, **(3)** demo API examples + evidence pointers, **(4)** record failures/blockers/provider mode, **(5)** commit code on your feature worktree; **do not push or merge unless owner asks**, **(6)** list outstanding scope and planned next milestone. Never call scaffold types or test fixtures a feature-complete implementation. Do not modify/commit frontend code.

## Explicit red flags to avoid

No dead API stubs, fabricated metrics, arbitrary command execution from prompt, fake Gemini API usage, fake Papiers note, fabricated global scientific discovery, source permission leaks, self-referential Papiers note masquerading as published paper, lost research checkpoints, silent fallback as success, agent deciding its own metric after observing outcomes, or pretending `w>1` is a probability.


---

# INCLUDED DOCUMENT: 06_AGENT_B_FRONTEND.md

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


---

# INCLUDED DOCUMENT: 07_MILESTONES_AND_MERGE.md

# APORIA — Two Autonomous Agents, Human Checkpointed Commits, and Merge Protocol

## 0. Human role and operating principle

The human user is **product owner, not primary coder**. The two agents operate in separate checkouts and write code. User approves design deviations, credentials/provider accounts, reviews diff/tests/screenshots, and **periodically pushes** completed checkpoint commits. Both agents MUST continue through ALL milestone gates G0–G6 until full SRS acceptance, not stop when demo works. No one commits code in this document package; it is the scaffold for agents to implement.

## 1. One-time shared scaffolding — done BEFORE starting two agents

Give a single scaffold agent `09_INITIAL_SCAFFOLD_PROMPT.md`, plus the entire ZIP. It establishes private `aporia` repo, directory structure, pinned deps, `.env.example` (never secrets), build/test scripts, auth/fixture plumbing, OpenAPI contract mirror, typed frontend client, basic Docker/dev run, GitHub Actions lint/typecheck/test, no-project-license copyright/third-party notices, base app/API runnable, and first smoke passing. **Scaffold may contain basic stubs only at G0**; frontend/backend agents then replace with real modules. Initial scaffold commit hash is announced to both agents and pushed by the human.

Scaffold can be done by an agent in fresh checkout. After completion, human checks remote repo is PRIVATE and commits no `.env`, credentials, private paper corpus, or uploaded docs with confidential user work.

## 2. Branch and checkout topology

```
private GitHub: aporia
     main   [immutable shared G0 scaffold commit]
     ├── feat/research-engine    → ../aporia-research    (Agent A)
     └── feat/frontier-ui       → ../aporia-frontier    (Agent B)

integration/g1 → integration/g2 → ... → integration/g6 → main
```

Example commands (run from newly cloned `aporia/` after G0 scaffold pushed):

```bash
git switch main
git pull --ff-only
git worktree add -b feat/research-engine ../aporia-research main
git worktree add -b feat/frontier-ui ../aporia-frontier main
```

Start Agent A in `../aporia-research`, Agent B in `../aporia-frontier`. Agents must never work in the same directory or touch another's owned files. Shared root, `contracts/`, `fixtures/`, CI and `.github` are human/scaffold-controlled. Agents propose changes through `docs/contract-change-requests/` or chat; integrate after approval. **Do not have agents repeatedly reset/rebase concurrently without coordinating with user.**

## 3. Periodic checkpoints — exactly how user pushes

A checkpoint is **a small verified vertical slice**, not a timed promise. Request an update after every meaningful milestone or approximately every 30–60 minutes of agent work. If an agent is blocked, it must report immediately rather than silently implement an incompatible workaround. Agents are allowed to commit locally but not push unless user explicitly delegates.

Agent delivers this brief review packet:

```
Agent: A or B
Checkpoint: A2 / B2 / etc.
Local branch + HEAD SHA:
Completed FR IDs:
Paths changed:
Commands/tests run + actual results:
Screenshots/API evidence (links or paths):
Fixture vs real mode:
Secrets/config requested:
Breaking contract changes? (yes/no and requested diff)
Blocked / risks:
Remaining SRS modules:
Next milestone:
```

Human reviews locally: `git -C ../aporia-research status`, `git -C ../aporia-research log -3 --oneline`, `git -C ../aporia-research diff main...HEAD` (similarly frontend). If acceptable, HUMAN pushes each feature branch:

```bash
git -C ../aporia-research push -u origin feat/research-engine
git -C ../aporia-frontier push -u origin feat/frontier-ui
```

**Do not push unless secrets check and agent tests pass.** If rejected, request a new local commit and repeat. Agents continue in their feature worktrees after approved pushes.

## 4. Integration cadence (no big-bang merge)

At G1, G2, ... after both agents have reached compatible checkpoint, human or designated integration agent creates/updates `integration/gN` from latest integrated commit, merges both branches with `--no-ff` and runs suite. Integration does not need to merge into `main` every milestone: can maintain `integration/progress` until gates pass, but ensure both agents know integration baseline if new contracts landed. Changes from a previous integration gate can be forwarded to feature branches with an explicit user-mediated sync/rebase only; ensure no overwritten work.

Suggested command from main checkout:

```bash
git fetch origin
git switch main
git switch -c integration/g1
git merge --no-ff feat/research-engine
git merge --no-ff feat/frontier-ui
# run make check + make e2e + smoke run
```

At subsequent gate, branch from latest merged integration commit (or advance same `integration/progress` branch) and merge new feature commits. If a merge conflict occurs, assign fix to owner on respective branch, not silent contract rewrites. For CI, prefer GitHub PRs from both features to a protected integration branch, human approves. `main` remains stable and demoable.

## 5. Milestone gates and required shared demonstration

| Gate | Agent A must show | Agent B must show | Merge gate |
|---|---|---|---|
| **G0** | scaffold only | scaffold only | root lint/dev/contract fixtures, private repo |
| **G1** | real papers/projects/graph/events/Tiger migrations/auth | neon semantic paper galaxy, layout, search and source inspector | paper click provenance, live event renders, restart persists |
| **G2** | real Gemini plan, bounded camera experiment, blocker child + agenda | Lab, agenda, event timeline, live metrics | run → measured blocker → new node + queue through API |
| **G3** | live/secured Papiers, compiler, exact score formula, approved action, two runs | Judgment+CFG scoring view, fork explorer, source browser | w=0 vs w>0 traceable and executed or honest pending |
| **G4** | PARALLAX, expertise, team sessions, skills, transfer, truth graph, portfolio | Court, Team, Profile, Portfolio and warnings | two users access team, tested lesson reuse, disputes |
| **G5** | meta trials, secondary evaluator, security/resume hardening | Meta, library, settings, all route tests, visual/perf/a11y | complete FR coverage, error/reconnect/restart tests |
| **G6** | live Gemini + Tiger + Papiers integration checks / docs | judge 4-min flow, WebGL fallback, final visual signoff | full release test suite; main merge; tag v1.0 |

**No deferral trap:** A module absent at G3 is not “cut for hackathon”; it remains required by G5/G6. User may choose an explicit reduced release only through recorded scope change, with accurate completion disclosure.

## 6. Agreement on contract ownership

`contracts/openapi.yaml` and `contracts/fixtures/*.json` start frozen G0. Schema changes requested by A/B go into `docs/contract-decisions.md`: proposed reason, backward compatibility, exact fields/endpoints affected, fixture/consumer tests, user approval. A user-approved contract update is committed on integration and then brought to both feature branches. Do not rewrite event names or `PolicyRun` contract independently. Design components against client types, not invented nested JSON.

## 7. Human decision moments

The human only needs to make decisions at: (1) scope changes (must not silently drop original requirements), (2) credentials/registration and explicit access sharing for Papiers/Gemini/Tiger, (3) proprietary repo/teammate code rights, (4) acceptance of design visual compared to references, (5) disputed science metric definition, (6) reviewed skill/global sharing, (7) release. All routine implementation belongs to agents.

## 8. Security and legal checklist before EACH push

- `.env`, Google key, Papiers session tokens, Tiger DB URL, private corpus notes absent from Git history and diffs; check with secret scanning.
- Third-party libraries retain their license/NOTICE obligations. Don't copy workshop source without verifying grant; treat code as inspiration if unclear.
- User wanted proprietary code: private repo + `All rights reserved` copyright statement, no APORIA MIT LICENSE; dependency MIT notices unaffected. Teammate author rights require explicit agreement.
- Tests and static checks actually pass; screenshots contain no private Papiers details unauthorized for team demo.

## 9. Stop conditions

Agents may stop only on (a) explicit instruction to pause, (b) waiting for human credential or permission, (c) unresolvable infrastructure block reported with actionable steps, or (d) ALL gates G0–G6 passed with acceptance evidence. “The demo looks awesome” is **not** a completion criterion.


---

# INCLUDED DOCUMENT: 08_TEST_MATRIX.md

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


---

# INCLUDED DOCUMENT: 09_INITIAL_SCAFFOLD_PROMPT.md

# FIRST CODING-AGENT PROMPT — SHARED APORIA SCAFFOLD (G0 ONLY)

You are scaffolding a PRIVATE proprietary project named APORIA. The attached ZIP is the complete authoritative specification. Read `README_FIRST.md`, `01_COMPLETE_SOFTWARE_REQUIREMENTS.md`, `02_CFG_GUIDANCE_POLICY.md`, `03_FRONTEND_RENDERING_AND_UX.md`, `04_DATA_AND_EVENT_MODEL.md`, `07_MILESTONES_AND_MERGE.md`, and `contracts/openapi.yaml` completely. Read the archived long-form product and frontend references for context. This scaffolding task is only G0: establish shared foundation and freeze contracts so **two subsequent coding agents** can implement the entire project in parallel.

DO: create root monorepo with `apps/web`, `services/api`, `services/worker`, `packages/research`, `packages/evaluators`, `packages/connectors`, `packages/graph`, `infra/db`, `docs`, tests, etc. Pin usable dependency versions. Add local startup scripts, `.env.example`, `.gitignore`, Docker/compose or equivalent for Postgres/Tiger-compatible local environment, CI checks, minimal FastAPI/OpenAPI health route, React typed API client, basic auth/test fixture provider, migrations skeleton, README commands, and a protected shared `contracts/openapi.yaml` (copy from this handoff). The G0 app and API must actually boot and pass basic tests, but do not spend time implementing full features—Agents A/B own those. Store API fixture JSON (from handoff) under `contracts/fixtures/`; ensure client can run against fixtures while Agent A writes real endpoints.

DON'T: fork someone else's narrow workshop as full architecture; turn the product name back into FORKLINE; copy non-permissively licensed code; create an MIT license for APORIA; commit real secrets; make actual research metrics up; edit the SRS to reduce its scope; start both coding agents in same worktree.

After G0: provide a scaffold tree, command outputs from successful boot/lint/test, dependency pin list, initial commit hash, any contract discrepancies, and **stop**. Human reviews/pushes `main`, creates two worktrees from same commit, then launches Agent A with `05_AGENT_A_RESEARCH_ENGINE.md` and Agent B with `06_AGENT_B_FRONTEND.md`.


---

# INCLUDED DOCUMENT: 10_INTEGRATIONS_AND_ARCHITECTURE_DECISIONS.md

# APORIA — External integrations, engineering decisions, and scope reconciliation

## 1. Vendor and public code references

| System | Source/reference | Required use | Critical note |
|---|---|---|---|
| Gemini API | https://ai.google.dev/gemini-api/docs/structured-output | Server-side structured scientific plans, judgment compilation and optional dual-score rubric scoring | Agent must verify installed SDK and model name and demonstrate **real** live inference. No Gemini model output is evidence of an experiment result. |
| Papiers | https://papiers.ai/docs and https://wiki.papiers.ai/docs/agents | Authorized reading history/notes/highlights to condition human scientific judgment and build evidence packets | Treat CLI as read-only unless exact installed supported write API documented; request consent and persist output separately. |
| Tiger Data | https://www.tigerdata.com/docs/reference/timescaledb/hypertables and https://www.tigerdata.com/docs/reference/timescaledb/continuous-aggregates | Hosted PostgreSQL relational + Timescale hypertable events/metrics, live aggregate analytics | Current Tiger versions differ in hypertable CREATE syntax; pin/test against actual deployment. Materialized continuous aggregates may not include newest rows automatically. |
| cosmos.gl | https://github.com/cosmosgl/graph and https://cosmograph.app/docs-lib/ | MIT-licensed GPU graph layout/interaction; import into Three.js scene where feasible | Prefer positions + Three.js rendering to duplicated expensive canvases. Preserve dependency license notices. |
| Cosmograph sample | https://run.cosmograph.app/public/ca9fd1ad-fe83-4238-8b69-b707c633aef0 | Interaction/cluster density benchmark | Treat as visual behavior inspiration, not blanket permission to copy restricted application source. |
| Paperscape | https://paperscape.org/ | One paper = one semantic point, scientific cluster semantics | Avoid assuming its hosted corpus/data is freely redistributable; ingest own permitted arXiv/OpenAlex subset. |
| Three.js | https://threejs.org/docs/ | Custom point sprites, depth, controls, glow and rendering | Shader, picking and WebGL fallback implemented, not static visualization image. |
| arXiv | https://info.arxiv.org/help/api/user-manual.html | Literature source, canonical arXiv paper IDs | Respect API rate limits, identifiers and source provenance. |
| OpenAlex | https://docs.openalex.org/ | Paper metadata, citations, topic/concept graph | Respect current API/registration/rate limits, source terms, staleness and data quality. |
| Karpathy autoresearch | https://github.com/karpathy/autoresearch | Inspiration for disciplined hypothesis → code/eval → metric → keep/discard loop | Do not imply originality of basic autoresearch loop. Preserve notices for any incorporated licensed code. |
| Saeejith workshop | https://github.com/saeejithnair/hack-the-valley-autoresearch | CPU-sized experiment budget, hypotheses, human question baseline | Not an APORIA monorepo scaffold; check license before any copy. |
| Shopify River | https://shopify.engineering/under-the-river | Shared sessions, durable harness/sandbox/skills and team-learning design | Conceptual inspiration, not an API or product dependency. |

## 2. Architectural decision records

**ADR-001: New APORIA repo, don't fork workshop as application.** Workshop's CPU language model is narrowly focused; adapt *experimental discipline*, not structure. Private project with third-party notices and appropriate team ownership agreement.

**ADR-002: Gemini as replaceable first-choice provider.** Use provider interface and enabled Gemini live in judged demo; if unavailable, show error/fixture explicitly. Does not hardwire public Gemini provider into business logic.

**ADR-003: Tiger Data as production-demo store.** Postgres semantics for relational research graph, Timescale hypertables for append-only events and metric samples; local fallback for dev, labeled. Implement migration tests on actual version.

**ADR-004: Papiers as first-class, optional AUTHENTICATION but mandatory product capability.** If no user's Papiers content connected, agent can take direct feedback; must not claim a Papiers-backed result. No unsupported writing to their service.

**ADR-005: FRONTIER research nodes distinct from paper and decorative particles.** Semantic paper points map 1:1 to source; research problems actions have provenance; cosmetic dust has no semantic ID.

**ADR-006: CFG policy implemented as per-candidate extrapolated two-score action selection.** Normative exact equation in 02; score calibration and scientific hard constraints; no automatic personality belief as truth.

**ADR-007: Full SRS, incremental milestones.** All 16 modules required; G0–G6 are staged release gates, not permission to omit G4/G5. Avoid claiming ability to ingest all of arXiv or conduct all domains of science from one hackathon sprint.

**ADR-008: Human owns integration cadence.** Two agents commit locally and deliver checkpoint proof; user periodically pushes to remote after review, merges via integration branch, can reject changes. No simultaneous agent code writing to shared checkout.

## 3. What was wrong with earlier PRDs / updated resolution

- **Earlier flaw:** 13 KB v2 PRD was high-level, agents had to invent behavior. **Change:** FR-ID software requirements, UX per page, DB schema, 74 API operations, CFG equations, acceptance matrix.
- **Earlier flaw:** 'P1 stretch'/'P2 defer' omitted defining original vision (River, meta, truth maintenance). **Change:** all retained as required bounded functional modules G0–G6.
- **Earlier flaw:** weighted average guidance only w∈[0,1] and no dual-planner score records. **Change:** discrete CFG-style extrapolation `s_u + w(s_c-s_u)`, w>1 and complete audit/tests.
- **Earlier flaw:** user assigned to code backend. **Change:** two coding agents; human handles product decisions, API/branch review and periodic pushes.
- **Earlier flaw:** FORKLINE and APORIA documents might conflict. **Change:** APORIA v3 authoritative; legacy original copied with new name only as reference.
- **Earlier flaw:** geometry experiment could be interpreted as full 3DGS SOTA. **Change:** real bounded coverage proxy + correct metric labeling, pluggable secondary real evaluator, no invented PSNR/3DGS claims.
- **Earlier flaw:** sponsor tech merely named. **Change:** provider interfaces + explicit test evidence of real Gemini/Tiger/Papiers usage.
- **Earlier flaw:** black-box proprietary concerns. **Change:** private APORIA repo, no APORIA MIT by default, scoped source access and team rights documented. Idea alone remains separately subject to IP law; do not make claims of exclusive monopoly over the concept.

## 4. Product change control

A modification that reduces scope must be a HUMAN-signed `SCOPE_CHANGE.md` describing omitted FR IDs, user-facing impact, remaining acceptance failures and demo truthfulness. Agent discretion to silently skip scope is prohibited. Technical simplifications that preserve FR acceptance are allowed and encouraged; avoid unnecessary swarm orchestration, but no functionality can be faked. For unreached external credentials, status is `blocked-on-owner` not `complete`.


---

# APPENDIX IN ZIP
See reference/LEGACY_VISION_EXPANDED.md, reference/LEGACY_FRONTEND_EXPANDED.md, reference/*.png, contracts/openapi.yaml, contracts/fixtures, checklists/requirement_traceability.csv.
