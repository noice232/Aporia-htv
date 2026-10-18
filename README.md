# APORIA — Backend

## Quick start

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Server starts at **http://localhost:8000**.

Health check: `GET http://localhost:8000/api/v1/health`

Run tests:

```bash
python -m pytest tests/ -v
```

## Hackathon research demo

Create a populated 3D reconstruction project:

```bash
curl -X POST http://localhost:8000/api/v1/demo/seed
```

The response contains `project_id`. Use it with:

- `GET /api/v1/projects/{project_id}/graph` — paper graph and citations
- `GET /api/v1/projects/{project_id}/research/steps` — agent steps and human influence
- `GET /api/v1/projects/{project_id}/policy/comparison` — guided versus autonomous ranking
- `GET /api/v1/projects/{project_id}/timeline` — combined workflow history
- `GET /api/v1/projects/{project_id}/stream?after=0` — SSE event replay

For a fresh project, `POST /api/v1/projects/{project_id}/research/start` runs the
five-phase demo loop. Submit `{ "text": "Try Gaussian splatting", "action": "redirect" }`
to `POST /api/v1/projects/{project_id}/research/steps/{step_id}/feedback` to see
the agent change direction. The demo loop, paper retrieval, CFG comparison, and
experiment metrics are deterministic mock data. They do not call a live paper
provider or run a measured 3D reconstruction benchmark.

---

## Intellectual Property

Copyright © 2026 APORIA contributors.
All rights reserved.

APORIA is an independently developed research software project.

No license is granted to reproduce, modify, distribute,
or commercially exploit APORIA's original source code
without prior written permission from the copyright holders.

Third-party dependencies remain subject to their
respective licenses.
