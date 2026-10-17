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
