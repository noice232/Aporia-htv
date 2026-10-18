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

## Hackathon research prototype

Run `npm install` and `npm run dev`, then open `/demo`. The ten-stage workspace shows the intended goal → corpus → plan → experiment → FRONTIER blocker → human CFG guidance → FORK → PARALLAX → shared skill → meta-research journey. Entering another goal creates a general research session; domain-specific plans and experiments remain pending until connected. The expandable system map shows all 16 SRS modules.

`/poc` is the physical 3DGS lab. Its default public model is **Black Jacket** by geofront e.U., [CC BY 4.0](https://geofront.eu/splatting_guide/models.html); attribution is in `public/public-scene/ATTRIBUTION.txt`. It loads real Gaussian data, supports orbit and camera presets, downloads captured PNGs, and measures nontransparent image occupancy for each capture. That 2D framing proxy is distinct from 3D scene coverage. Paint a missing region to download a matching black/white inpainting mask (white = replace). A user-supplied GPU result can be attached for visual comparison; true coverage, inpainting, and best-angle evaluation are explicitly pending.

The private scene is kept in ignored `.local-scenes/` and served only by the development server at `/demo-scene/scene-sample.ply`. It is never copied into a production build. Run `node scripts/sample-ply.mjs` to recreate its deterministic 1-in-8 sample from `.local-scenes/scene.ply`. The local lab shows a **Private local sample** button when that file exists. Check the production bundle before publishing:

```sh
npm run build
rg --files dist | rg 'ply|ATTRIBUTION'
```

Only `public-scene/blackjacket.ply` and its attribution should appear. `npm run smoke:demo` checks stage navigation and CFG example behavior. `npm run smoke:poc` uses a local Chrome installation to verify a real splat render, distinct camera captures, human guidance, and private scene replacement; the latter needs `.local-scenes/scene-sample.ply`.

With the backend running on port 8000, `/demo` saves a research goal and human checkpoint through `/api/v1/research-sessions`; without it, the page clearly reports browser preview mode. Papiers status is read from `/api/v1/papiers/status`. Private Papiers search/read require server configuration described in the backend's `docs/PAPIERS_CONNECTOR.md` and are not exposed as public browser calls. The illustrative CFG values and workflow cards are labeled; they are not GPU measurements.

```sh
npm install
npm run types:generate
npm run dev
```

Open the local URL printed by Vite. The development server proxies `/api` to `http://localhost:8000`. Set `VITE_API_BASE_URL` only if the backend is served elsewhere. `npm run build` checks types and creates the production bundle. `npm run smoke` runs a browser flow against test-only contract-shaped responses and writes screenshots to the ignored `artifacts/` directory. The app itself has no fabricated API data.

The policy slider sends `POST /api/v1/projects/{project_id}/policy/score` with only `{ "w": number }`. The backend supplies all candidate scores and the selected candidate.

The frozen `PolicyRunOut`, `GoalResult`, and `ForkOut` schemas do not expose `data_mode`; only `EventOut` does. Result cards show a data-mode badge only when a loaded event has an exact matching policy-run or experiment-run `entity_id`. `PolicyRunOut` also does not expose `conditioned_context_status`; the guidance-inert banner is driven by the contracted `fallback_reason: "no_human_context"`.

### Contract gap: cosmograph

The frozen contract has no corpus or graph endpoint supplying semantic paper IDs, positions, neighborhoods, or relationships. The requested interactive cosmograph cannot be built from the available project, policy, profile, fork, and event responses without fabricating research nodes. Its implementation is held until a graph/corpus read contract is added.
