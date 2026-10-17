## Intellectual Property

Copyright © 2026 APORIA contributors.
All rights reserved.

APORIA is an independently developed research software project.

No license is granted to reproduce, modify, distribute,
or commercially exploit APORIA's original source code
without prior written permission from the copyright holders.

Third-party dependencies remain subject to their
respective licenses.

## Frontend

The frontend is a React, TypeScript, and Vite app. Its API types are generated from the frozen `contracts/openapi.yaml`.

```sh
npm install
npm run types:generate
npm run dev
```

Open the local URL printed by Vite. The development server proxies `/api` to `http://localhost:8000`. Set `VITE_API_BASE_URL` only if the backend is served elsewhere. `npm run build` checks types and creates the production bundle. `npm run smoke` runs a browser flow against test-only contract-shaped responses and writes screenshots to the ignored `artifacts/` directory. The app itself has no fabricated API data.

The policy slider sends `POST /api/v1/projects/{project_id}/policy/score` with only `{ "w": number }`. The backend supplies all candidate scores and the selected candidate.

### Contract gap: cosmograph

The frozen contract has no corpus or graph endpoint supplying semantic paper IDs, positions, neighborhoods, or relationships. The requested interactive cosmograph cannot be built from the available project, policy, profile, fork, and event responses without fabricating research nodes. Its implementation is held until a graph/corpus read contract is added.
