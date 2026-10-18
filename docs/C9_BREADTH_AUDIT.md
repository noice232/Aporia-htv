# C9 backend breadth audit (2026-10-17)

## Verified

- `feat/backend` contains the stated C1-C8 commits through `2e0bae0`.
- `python -m pytest -q` passes: 174 tests after `tests/test_breadth_e2e.py` was added (173 before C9).
- C9 exercises one deterministic HTTP journey across research sessions, plan compilation and approval, experiment specs, FRONTIER blocker discovery, a bounded evaluator run, artifact hashing, a human checkpoint, manual judgment, guided policy, FORK replay, PARALLAX dispute proposal, reviewed skill promotion and retrieval, and a guarded portfolio suggestion.
- The Papiers route reports connection status and denies private search when its separate access key is absent.
- `node scripts/demo-smoke.mjs --backend` passes against a locally running Uvicorn process: the frontend creates/reloads sessions and human checkpoints through HTTP.

## Scope of this result

C9 uses FastAPI `TestClient`, an in-memory SQLite test database, and the deterministic unit-cube evaluator. It does not run a live Papiers library retrieval, Gemini request, H200 3DGS job, Tiger Data query, browser, or server-restart test. Passing C9 proves these currently implemented API slices can run in sequence; it is not full SRS or deployment acceptance.

## Gaps to fix before claiming the backend complete

1. **Frozen API contract drift.** `docs/srs/contracts/openapi.yaml` specifies 74 method/path operations. The app exposes 73, but only 14 exact method/path pairs match; 60 contract operations are absent. Important missing surfaces include workspaces/members, paper/corpus search and sync, source access, run creation/control, research status/control, questions, team sessions, and integration status. The app includes 13 routers, not the reported 15. Some implemented capabilities use alternate paths, but that does not make the frozen contract callable by the generated frontend client.
2. **Unverified Papiers attribution.** `POST /projects/{id}/judgments` accepts a syntactically valid `source_id` and sets `source="papiers"` without calling Papiers or checking that the item exists or is authorized. A DOI or arbitrary `papiers:` string can therefore appear Papiers-grounded. Require a successful authorized read and persist the exact typed source locator before using that label.
3. **Synthetic experiment domain.** `run_goal` creates a unit-cube point cloud and fixed axis cameras; it does not load a supplied 3DGS `.ply` scene or run the user's H200 inpainting workflow. `compile_plan` emits hard-coded variables, a coverage metric and a generic hypothesis for every goal. Present these as bounded fixtures/proposals, not the general autonomous research engine.
4. **Evidence and access controls.** PARALLAX can resolve a dispute without evidence and accepts a caller-selected `data_mode="measured"` without verifying a run. Skill extraction accepts source IDs without checking project ownership, and `GET /api/v1/skills` exposes cross-project skills without identity or consent checks. Project/session routes have no user authentication. Do not expose this backend publicly with private research data.
5. **Portfolio outcomes are disconnected from HTTP runs.** Strategy comparison finds runs only when `ExperimentRun.parameters_json` contains a matching `strategy_id`; the current goal/fork APIs do not tag runs this way. C9 correctly receives `insufficient_data`. A measured meta-evaluation currently requires direct database setup, as the isolated tests do.

## Immediate handoff

For the hackathon, keep `/demo` and `/poc` labels honest. Prioritize fixing Papiers source attribution and private-data access before any public backend deployment. Then align a small documented API contract slice with the frontend and add one real Papiers read plus one real scene/H200 result if credentials and artifacts are available. Keep the full SRS contract gaps visible as follow-up work.
