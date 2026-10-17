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
