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
