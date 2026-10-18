# Backend breadth audit (2026-10-17)

## Verified at `8004bc2` on `feat/backend`

- `.venv\Scripts\python.exe -m pytest -q`: **273 passed**. The two warnings concern Starlette's test client and pytest's inability to update its local cache.
- `app/main.py` registers **30 routers**. The app exposes **133** method/path operations; **71 of the 74** operations in `docs/srs/contracts/openapi.yaml` match exactly.
- The three missing contract operations are `GET /api/v1/projects`, `POST /api/v1/projects/{project_id}/agenda/{agenda_id}/action`, and `POST /api/v1/projects/{project_id}/plan`.
- PARALLAX now requires at least one evidence row on each disputed claim before resolution. Claim invalidation marks connected FRONTIER nodes `needs_revalidation`.
- The C9 journey test exercises the implemented research workflow with FastAPI `TestClient` and SQLite fixtures. It does not exercise live Papiers retrieval, Gemini, a GPU scene job, or a deployed multiuser system.

## Gaps that remain

1. **Public access is unsafe for private research.** `app/auth.py` treats `Bearer <user_id>` as authentication, and no route currently uses its `get_current_user` dependency. `GET /me` also accepts `user_id` in a query parameter. Workspace membership and other data routes lack a consistent authenticated authorization check. A known user ID can be used to impersonate that user. Do not publicly deploy this API with private or NDA data in its current form.
2. **Papiers attribution is still unverified by default.** `POST /projects/{project_id}/judgments` sets `source="papiers"` when a source ID passes a format check. The Papiers read runs only when `APORIA_PAPIERS_ACCESS_KEY` is set; when absent, an `unverified` local variable is never saved or returned. The adapter separately requires `PAPIERS_TOKEN` and accepts typed IDs such as `doc_...`, whereas this judgment route's accepted DOI/UUID/`papiers:` formats do not match the adapter's read validation. An arbitrary accepted locator can therefore appear Papiers-grounded.
3. **Corpus sync and run start are API shells.** `/corpus/sync` explicitly creates synthetic `demo_sync` paper rows. `POST /projects/{project_id}/runs` records a run as `running` but does not dispatch an evaluator or worker. The existing bounded goal evaluator uses a synthetic unit cube and fixed cameras, not a supplied 3DGS `.ply` scene or the H200 inpainting workflow. The plan compiler produces a generic template.
4. **Strategy outcome comparison is disconnected from the run API.** `ExperimentRun.strategy_id` exists, but `start_run` does not populate it and `_get_strategy_runs` ignores the column. Comparison only finds runs whose `parameters_json` already contains `strategy_id`; tests construct those records directly. The HTTP research journey therefore cannot yet produce the measured strategy comparison claimed in the handoff.
5. **The dispute evidence gate checks presence, not provenance.** Evidence creation defaults to caller-selected `data_mode="measured"` and does not require a verified run or artifact. The new resolution guard prevents empty disputes, but does not establish empirical support.

## Readiness verdict

This is a broad, passing **prototype API** suitable for a controlled demo with synthetic data. It is not a complete autonomous research backend or safe public research service. Before a live deployment, implement real identity and project authorization, fix Papiers provenance, connect corpus and experiment execution to actual providers and workers, then demonstrate a real scene run. Keep demo records visibly labeled as demo data.
