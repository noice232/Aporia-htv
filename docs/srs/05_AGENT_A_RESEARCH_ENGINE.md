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
