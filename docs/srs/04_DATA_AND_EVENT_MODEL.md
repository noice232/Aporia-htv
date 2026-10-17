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
