# LEGACY PRODUCT VISION REFERENCE (ADAPTED NAME)

This is an APORIA-renamed snapshot of the older FORKLINE v1.1 product/engineering vision. It preserves detailed design ideas. The v3 SRS, OpenAPI contracts, and CFG algorithm **override any conflicting requirements or deferrals in this reference**.

# APORIA — Master Product + Engineering + Visual Specification

**Version:** 1.1 (conversation audit + Papiers integration) · 17 October 2026  
**Audience:** Claude Code, Cursor, Codex, developers, hackathon judges  
**Status:** Implementation specification. The visuals are targets, not completed functionality. Papiers integration is REQUIRED in the intended submission, but is not connected until a real account token and source library are supplied.  
**Primary goal:** Build a genuinely functional **multiplayer, human-guided autoresearch system** whose central interface is a **real scientific paper universe rendered as an interactive, neon point cloud**.

> **Read this entire document before implementation.** This supersedes earlier FRONTIER wireframes with spirals, simple SVG dots, ordinary force graphs, and oversized dashboard panels. Do not recreate the old wireframe. Start with the existing codebase, preserve functional APIs, and implement the sections below in order.

---

## 0. One sentence, one minute

**APORIA is a collective research operating system where AI agents run real experiments, discover new problems while solving old ones, learn from human researchers, share validated knowledge across a team, and reveal exactly how human intervention changed the research trajectory.**

A researcher asks for a method to find the best camera angle. An agent starts experimenting with novel views and discovers that unobserved scene regions block progress. It creates a **new, linked research question**, retrieves relevant papers and prior team work, asks which objective matters (geometric consistency or photorealism), runs experiments in response, and resumes the original research once an approach is evaluated. Everyone on the team can inspect the complete evidence trail and reuse the findings.

**Product identity:** Karpathy-style autoresearch + Shopify River-style shared learning + Papiers-grounded personal research context + an executable FRONTIER research graph + human-judgment adaptation + counterfactual forks.

**Actual research use case:** diffusion/novel-view consistency/3D scene completion, as an **illustration of the platform**, not the platform's hard-coded domain. Don't make market trading the demo.

---

## 1. Signature differentiators (not just UI features)

1. **Executable FRONTIER** — nodes represent papers, hypotheses, experiments, claims, blockers, and projects; typed relationships express actual prerequisites and evidence, not just semantic proximity. **Why:** the map can drive research decisions.
2. **Recursive problem discovery** — experiments can create newly scoped research projects with a clear `blocked_by` relationship to the original goal. **Why:** agents identify the questions that stand between a researcher and their objective.
3. **Autonomous experiment loop** — propose → execute → evaluate → critique → choose the next step, with runnable code and persisted results. **Why:** this satisfies autoresearch rather than a proposal-only chatbot.
4. **Researcher intuition profiles** — learn scoped, revisable preferences and methodological lessons from human corrections, notes, annotations, and prior decisions. **Why:** the agent can use human expertise again later without endless re-prompting.
5. **CFG-inspired guidance** — independent and researcher-aligned planners score the same actions, with adjustable weighting. **Why:** selective alignment without treating preferences as scientific facts; **not actual diffusion classifier-free guidance**.
6. **PARALLAX scientific critic** — skeptical and methodological review proposes discriminating experiments; doesn't merely vote between chatbots. **Why:** evidence must decide disagreements.
7. **Human expertise routing** — agent asks the right researcher a narrow question, attaches an evidence packet, and continues independent work while waiting. **Why:** human judgment enters exactly where useful.
8. **Fork View / Scientific Time Machine** — run a comparable no-feedback branch and feedback branch from the same checkpoint. **Why:** demonstrate consequences of human input; do not label simulated future outcomes as verified.
9. **River-inspired collective learning** — authorized team-visible sessions; extracted lessons become proposed shared skills with provenance and review. **Why:** seven researchers compound each other's work rather than running seven isolated chats.
10. **Research portfolio scheduler** — prioritize questions by expected information gained, cost, and downstream projects unblocked. **Why:** research coordination across dependent investigations.
11. **Cross-project transfer** — surface techniques potentially useful to another project, then test that transfer. **Why:** findings don't die with their original experiment.
12. **Truth maintenance** — invalidating a result marks downstream conclusions for reassessment. **Why:** shared memory stays scientifically accountable.
13. **Meta-autoresearch** — evaluate different planning/review/collaboration strategies with comparable budgets. **Why:** learn better ways to conduct research rather than simply accumulating prompts.
14. **Papiers-grounded human research memory** — retrieve a scientist's personally engaged highlights, annotations, notes, questions and reading context before hypothesizing. **Why:** the human contribution exists before they type a new prompt; the agent can cite what influenced it.
15. **Evidence-linked research agenda** — every discovered blocker becomes an inspectable, deduplicated, prioritized, executable task with a completion contract, owner and return path to its parent. **Why:** a new particle is an actual research project, not a pretty animation.
16. **Collective intelligence measurement** — compare an isolated agent with the same agent using an authorized team's evidence and reviewed research skills. **Why:** show whether seven collaborators genuinely compound progress rather than merely sharing messages.

**Do not pitch knowledge graphs, agent swarms, or prettier points as proprietary inventions.** The distinct behavior is the full experimentally verifiable sequence: **experiment → autonomously discovered blocker → scoped subproject → informed human interaction → executed new experiment → validated return to parent → collective reusable lesson**.

---

## 2. End-to-end product experience

### 2.1 Core user journeys

**Journey A: Browse science.** Open FRONTIER. Each logical point represents a **real paper with persistent source ID**. Clouds/continents represent semantic communities. Search 'Gaussian splatting', zoom to a result, inspect authors/abstract/citations, open arXiv/OpenAlex. Selecting a paper shows nearby papers and linked research problems.

**Journey B: Start an investigation.** Enter a goal. Scientific Compiler asks for metrics/constraints or proposes defaults. Agent generates testable hypotheses, runs a baseline in sandbox, records metrics, chooses next experiment.

**Journey C: Discover a new problem.** Agent detects a blocker, writes an explanation grounded in experiment evidence, searches prior art, creates a `research_problem` node with parent dependencies, adds it to Research Agenda. FRONTIER blooms a new **distinct problem marker** connected to the paper cloud.

**Journey D: Human steers science.** Agent requests precise input. Human prioritizes multiview consistency over single-image attractiveness. Agent extracts a scoped principle, executes a revised experiment, and exposes differences against unaltered branch.

**Journey E: Team River.** A teammate sees the blocker and links earlier geometry-aware conditioning work. The system attaches supporting paper/experiment sources, proposes a transfer test, assigns a contributor. Other teammates can reproduce and dispute the result.

**Journey F: Correct a false conclusion.** A later replicated test fails; knowledge node becomes disputed, impacted downstream nodes are flagged, agent proposes revalidation rather than silently retaining false certainty.

**Journey G: Read the researcher's actual thinking with Papiers.** Researcher connects Papiers via read-only token; agent searches their engaged literature, sees a highlight on geometry-aware inpainting and a note questioning single-view evaluation, cites those sources and chooses a different first experiment. The same test with Papiers disabled produces a recorded different decision. Papiers does not receive writes from APORIA through the documented CLI.

**Journey H: A new dot becomes a research work item.** Click the glowing problem node that emerged from an experiment. The inspector reveals its exact originating experiment, parent objective, supporting evidence, literature scan, duplicates checked, priority, current assignee, success metric, and next runnable test. Selecting **Investigate** starts/queues that subproject; satisfying its completion contract prompts a parent-project integration test.

**Journey I: A team lesson is applied elsewhere.** A researcher corrects an evaluation mistake; it enters the team review queue as a versioned skill with a source and applicable scope. A second agent retrieves that approved skill, changes its proposed experiment, and cites the skill. The system contrasts with the same plan absent shared memory.

### 2.2 Navigation

`/frontier` galaxy · `/projects` portfolios · `/agenda` new problems and blockers · `/research/:id` lab · `/forks/:id` branch comparison · `/team` shared research feed · `/library` paper/evidence retrieval and Papiers · `/researchers/:id` intuition profiles · `/settings` models/connectors/permissions.

### 2.3 Demo story (4 minutes)

1. Show the dense 3D arXiv universe; search and click an actual 3DGS/diffusion paper (30 s).
2. Show a real completed experiment with stored code version, numeric metric, logs, and next-step hypothesis (40 s).
3. Agent identifies missing-view inconsistency, opens **a new subresearch node** on the constellation and links relevant prior art (40 s).
4. Agent requests expert direction; user changes priority, agent runs a distinct experiment (60 s).
5. Fork Explorer shows **actual** branch decisions and measured results; agent writes learned principle to team-review queue (40 s).
6. Team River shows a colleague's existing method connected to the blocker; FRONTIER updates (30 s).

If time is tight, prioritize verified interaction over a rendered fake scientific achievement.

---

## 3. Frontend art direction — NONNEGOTIABLE

### 3.1 The reference images

- **Primary visual target:** `aporia_frontier_research_galaxy.png` — UI mockup where the central region is a luminous tangle of irregular mint/cyan/icy white/violet particle fields. This image is **concept art, not a screenshot of implemented software**.
- **Aesthetic source:** the user-shared first glowing particle-sculpture image (`image(7).png`) — densely packed tiny emissive points flowing into organic, volumetric ribbons and masses; black negative space.
- **Separate physical scene reference:** user-shared rainbow depth/3DGS point-cloud (`image(5).png`) — only for the experiment scene viewer, NOT the abstract paper universe.
- **Graph interaction reference:** user's shared Cosmograph public project: `https://run.cosmograph.app/public/ca9fd1ad-fe83-4238-8b69-b707c633aef0`.
- **Structural inspiration:** `https://paperscape.org/` — scientific paper maps.

**Visual target:** Imagine zooming through a dense, sculptural, glowing star cluster. You can tell there are millions of tiny elements, but their collective shape feels alive and organic. Less flat infographic, more scientific nebula.

### 3.2 Absolutely forbidden

- Spiral arrangements of a few hundred clean dots.
- SVG circles for the galaxy.
- Equidistant bubbles with large text inside them.
- Always-on spiderweb edges.
- Bright flat orange “new problem” circles in the middle of the artwork.
- Rounded cards occupying most of the hero canvas.
- Static screenshot pretending to be the visualization.
- Random scatter that does not correspond to real paper positions.
- Randomly invented paper counts, paper titles, live agent progress, or evaluation results.

### 3.3 Desktop shell — 1440 × 900 reference layout

| Element | Dimensions | Behavior |
|---|---|---|
| App background | `#050810` | Entire viewport, no scrolling outer page |
| Left rail | 208–224 px | Logo, navigation, project list, team avatars; collapsible |
| Right insight rail | 290–330 px | Live agent cards, blockers, feedback, research details; collapsible |
| Header | 52–60 px | Search, current workspace, filters, user/profile |
| FRONTIER hero | All remaining width, ~70–78% usable height | **Full-bleed WebGL canvas**, overlays floating on top |
| Bottom timeline | 76–100 px | Experiments, branching history, stage markers |
| Detail drawer | 400–520 px overlay | Opens when clicking node or experiment, without redrawing galaxy |

On 1672×941 (generated mockup size), the galaxy should still visually occupy the dominant region. For screenshot-quality display, allow `Presentation / Immersive` mode to collapse both rails and timeline.

### 3.4 Color tokens

```css
:root {
  --bg: #050810;
  --panel: #0B1220;
  --panel-hover: #111D30;
  --border: #223348;
  --text: #EDF5FF;
  --muted: #90A2B7;
  --ice: #C5FFFF;
  --cyan: #67EFFF;
  --mint: #82FFD6;
  --green: #B4FFAF;
  --lavender: #CCA7FF;
  --violet: #8C78FF;
  --pink: #FFC0F0;
  --amber: #FFC471;
  --warn: #FF9C72;
}
```

**Coloring principle:** A paper's **research domain/cluster** primarily controls its hue. A research problem/hypothesis's **status** is shown through its glyph, surrounding ring, inspector, or selective highlight. Don't encode both into the same color channel ambiguously. Research-graph nodes are distinguishable from millions of paper points by glyph or halo, not by fictitious paper data.

### 3.5 Scene appearance

- Near-black background with subtle dark navy/violet regions, **not a visible starfield wallpaper**.
- Fine individual paper points: **1–2.5 px on screen** typically, soft bright center, outer alpha halo.
- Millions-of-papers impression comes from **true dataset counts + level-of-detail rendering**, not claiming decorative points are papers.
- Regional cluster shapes: irregular volume with filaments, holes, tendrils, subcluster bridges, dense bright centers, rare bright white anchors. Reject spheres/spirals.
- Restrained additive glow, screen-space bloom, subtle depth fade and peripheral vignette; keep individual paper dots visible rather than blowing out white.
- Edges only appear for hover-neighborhood, selected paper citations, or research dependencies. Keep the default view 90% cloud, 10% or less explicit linkwork.
- Minimal labels: cluster headings as subtle callouts outside luminous masses. Individual paper labels only on hover/selection or sufficient zoom level.
- Meaningful motion: camera easing, gentle **shader-level** shimmer (doesn't change paper identity), brief emergence when a new problem is created. Do **not** constantly re-layout papers for decoration.
- Ambient particles may be added in a separate effect layer, but must not be selectable, counted as papers, included in search, or described as retrieved literature.

### 3.6 UI typography and chrome

Use Geist/Inter or existing project font. 12–14 px supporting text, 14–17 px controls, 24–30 px primary title. Semi-transparent dark chrome, fine hairline borders, restrained glow on selection. No glassmorphic blur strong enough to obscure particle art. Tooltips must contrast against bright points. Hover labels and the main scene should never compete for attention.

### 3.7 Motion timings

- Hover reveal: ~120–180 ms.
- Camera focus: ~600–1000 ms easing; cancel on manual drag.
- Research-node birth: ~650–1100 ms point condensation and halo + one visible dependency tendril.
- Panel transition: ~180–260 ms.
- User reduced-motion setting: disable background shimmer and auto-fly; keep interactions functional.

---

## 4. Rendering architecture: reuse real `cosmos.gl` + enhance with Three.js

### 4.1 Why two rendering layers?

**Use `@cosmos.gl/graph` for actual graph compute and interactive exploration.** It already provides GPU layout, 2D/3D modes, point data via typed arrays, clustering, camera controls, selection callbacks, neighborhood queries and animation. Don't rewrite force-layout math. In particular, use 3D `spaceDimensions` and `setPointPositions(..., { dimensions: 3 })` where appropriate.

**Use Three.js / React Three Fiber for a bespoke cinematic particle rendering mode and the separate 3DGS experiment viewer.** Three.js gives full control over shader-based soft point sprites, blending, custom bloom and cinematic composition.

**Critical technical caveat:** cosmos.gl and Three.js do not automatically share render textures, position buffers, GL contexts or cameras. Don't silently promise to share live GPU coordinates every frame. Choose one of the two supported strategies below.

### 4.2 Implementation strategy: two modes with one source of truth (recommended)

**Mode A — `Explore` (`cosmos.gl`):** full interactive paper network, native layout/navigation/selection/LOD, fine point styling, performant search and filters; default mode in the hackathon if custom mode underperforms.

**Mode B — `Cinematic` (Three.js):** fully custom GPU point sprites and bloom, using a **precomputed or periodically synchronized frozen 3D layout**. Shared paper IDs, positions, and selection state. Transitions between modes keep selected node and approximate camera target. Use Three.js for visually polished camera flythroughs and featured domain clusters. For live dynamic layout, synchronize at discrete events or before entering Cinematic mode, not every animation frame.

For the first implementation, do **not** run the same full graph twice every frame. It will waste GPU memory and produce camera desynchronization. A secondary WebGL layer can provide sparse decorative dust without duplicating the semantic graph.

### 4.3 Legitimate option if one renderer can do it all

If cosmos.gl node shader appearance proves sufficient, keep a **single cosmos.gl canvas** and apply bloom via a tested compatible postprocess or visually tuned overdraw. Don't hack undocumented internal GPU buffers. The requirement is a convincing, reliable result, not using two engines on every frame.

### 4.4 Verified cosmos.gl API excerpt (adapted from public MIT-licensed quick start)

Install:

```bash
npm install @cosmos.gl/graph
# Use the v3-compatible luma.gl ~9.3.x peer dependency family when needed.
```

Build a minimal adapter (TypeScript sketch — validate exact version against installed typings):

```ts
import { Graph } from '@cosmos.gl/graph';

type PreparedGraph = {
  ids: string[];              // stable ID at each GPU index
  xyz: Float32Array;          // [x0,y0,z0,x1,y1,z1,...]
  links: Float32Array;        // [sourceIndex,targetIndex,...]
  rgba: Float32Array;         // normalized 0..1, 4 channels each
  sizes: Float32Array;
};

export async function createExplorer(
  host: HTMLDivElement,
  data: PreparedGraph,
  onSelect: (paperId: string) => void
) {
  const graph = new Graph(host, {
    spaceDimensions: 3,
    fitViewOnInit: true,
    enableDrag: false,
    curvedLinks: true,
    simulationGravity: 0.05,
    simulationRepulsion: 0.35,
    onClick: (index) => {
      if (index !== undefined && index !== null && index >= 0) {
        const id = data.ids[index];
        if (id) onSelect(id);
      }
    },
  });
  await graph.ready;
  graph.setPointPositions(data.xyz, { dimensions: 3 });
  graph.setPointColors(data.rgba);
  graph.setPointSizes(data.sizes);
  graph.setLinks(data.links);
  graph.render();
  return graph;
}
```

The official engine also exposes `setPointClusters`, `setClusterPositions`, `setPointClusterStrength`, `setConfigPartial`, tracked-point positions, neighborhood queries, and `getPointPositions({dimensions:3})`. **Inspect installed API typings to decide which of these to use.** `getPointPositions` can cause a costly GPU readback: snapshot on save/mode transition, never poll it in a 60 fps render loop.

Use a fixed layout (`enableSimulation: false`) when showing semantically precomputed coordinates to avoid rearranging a meaningful map with arbitrary forces. To improve organic clump placement, configure low-strength cluster attraction when simulation is enabled and save the settled layout.

### 4.5 Three.js neon point-sprite implementation template

Use `THREE.BufferGeometry` with typed position, color and size attributes, and a custom `ShaderMaterial`. Set `transparent: true`, `depthWrite: false`, optionally `AdditiveBlending`, and render soft circular `gl_PointCoord` falloffs. Below is *new example code*, not Cosmograph code:

```ts
import * as THREE from 'three';

export function createNeonPaperCloud(
  positions: Float32Array,
  colors: Float32Array,
  sizes: Float32Array
) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      uniform float uPixelRatio;
      void main(){
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * uPixelRatio * 120.0 /
                             max(1.0, -mv.z), 1.0, 12.0);
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main(){
        float r = length(gl_PointCoord - vec2(0.5));
        float core = exp(-90.0 * r*r);
        float halo = exp(-16.0 * r*r);
        float alpha = 0.95*core + 0.20*halo;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor * (1.2*core + 0.25*halo), alpha);
      }`,
    vertexColors: true,
  });
  return new THREE.Points(geometry, material);
}
```

**Important implementation note:** `vertexColors: true` with the custom shader must be tested to ensure the shader attribute is bound; explicitly declare `attribute vec3 color;` if the compiled material does not inject it. `devicePixelRatio` is browser-only; in SSR code pass pixel ratio as a function argument or read it only client-side. This is a **starting point**, not a production-tested renderer.

For the final scene use `EffectComposer` / `RenderPass` / `UnrealBloomPass` / `OutputPass` (or `@react-three/postprocessing`). Tune bloom by eye against the reference: visible fine points with soft halos, not uniform overexposure. Use ACES or compatible tone mapping, linear-to-sRGB output, and deliberately test both additive and normal alpha blend variants. Generate natural filaments from **actual graph positions and edges**; never substitute a stock nebula image for the interactive graph.

### 4.6 Organic but meaningful shapes

The 3D coordinates must not be random arbitrary nebula shapes. Build meaningful embeddings and neighbors, then use these for cluster organization:

1. Embed title+abstract (model/version recorded).
2. Compute neighborhood similarities; distinguish embedding-similarity edges from citation edges.
3. Project high-dimensional embedding to 3D using UMAP or similar; fix seed and version.
4. Group by domain/topic, apply bounded jitter or cluster forces only to improve depth separation without destroying nearest-neighbor topology.
5. Represent distant outliers and ambiguous membership; do not force all papers into fictional domain blobs.
6. Precompute stable positions and cache as binary typed arrays; do not recalculate entire galaxy on every page load.
7. New papers should incrementally appear near related papers (without rearranging everything). Research-problem nodes are a separate overlay linked to supporting paper neighborhoods.

Organic aesthetics can come from *density variation, small local offsets, view-dependent glows and edge filaments*, not from making up scientific relationships.

### 4.7 Picking and labels

- In Explore mode use cosmos.gl's native point hit-testing, `onClick`, hover callbacks and neighborhood methods.
- In Cinematic mode implement GPU color-ID picking with a small offscreen target or spatial index + projected nearest-neighbor hit testing. Only real data points have IDs.
- Cluster labels follow group centroids but remain readable, with no duplicates or overlapping labels.
- Hover tooltip contains `title`, `authors`, `year`, `source`, `domain`, plus one-click source URL and neighborhood action.
- Click freezes focus; show paper inspector. Double-click or `F` flies camera to neighborhood; `Esc` clears.

### 4.8 Scale and level of detail (LOD)

**Do not attempt to draw a million full relationship lines.** Start with 5k–30k verified paper records to test appearance; increase based on GPU benchmarks. At overview distances render representative points or aggregated tiles with a visible “sampled/aggregated” label. At domain zoom fetch progressively more real papers. At paper zoom render full local neighborhood and actual citation edges.

Metric displayed in header = count of *indexed* works, not decorative particle count or loaded GPU vertices. Document how filters and sampling affect the number on screen.

Use Web Workers for embedding preprocessing/index/aggregation, typed arrays for GPU uploads, binary caching for layouts, WebGL feature detection, reduced-quality fallback for weak hardware, responsive resize handling, GPU cleanup on unmount, and frame-time telemetry. Prefer stable 30–60 fps on the demo laptop over blindly increasing particles.

---

## 5. Frontend features and exact interactions

### 5.1 FRONTIER overview

- Top-left floating label: `F R O N T I E R`, indexed paper count, visible paper count, current domains.
- Top-right within hero: `Explore` / `Cinematic` toggle, `Focus` (selected paper or cluster), domain filters, `Fullscreen`.
- `Search papers, ideas, people…` opens a command palette showing top sourced results.
- 3D orbit, pan, smooth wheel zoom, Home to fit; clicking empty background clears selection.
- Hover domain: softly brighten related cluster and show compact callout; surrounding particles dim slightly.
- Hover paper: outline one paper and a few nearest neighbors. On click inspector opens with exact arXiv / OpenAlex link and citation direction.
- Toggle overlays: `Papers`, `Citations`, `Research problems`, `Uncertainty`, `Team activity` (one at a time or composable).
- New problem event: spawn a uniquely shaped research marker near its related paper region; short glow pulse and connection to blocking parent; event card in right rail.
- Highlight researched/engaged papers distinctly from unread saved library papers; keep color legend clear.

### 5.1A Research Agenda `/agenda` — every discovered problem is actionable

- Views: **New**, **Prior art located**, **Needs expert**, **Ready to test**, **Running**, **Blocked**, **Validated**, **Integrated**, **Rejected**. Filter by original project, team member, expected unlock value, domain and evidence status.
- Every agenda item is a **research problem**, not an ordinary paper; it has its own ID, parent blocker relation, title, falsifiable question, test metric, completion criterion, source experiment, uncertainty, literature dedup result, candidate approaches, resource estimate and owner/agent.
- `Investigate` starts or queues a durable session; `Request expertise` sends a source-linked evidence packet; `View parent` flies back to the original research node.
- Completing a child marks its own result **candidate solution**; parent stays blocked until an **integration experiment** validates the result in the original context. Failures remain useful research evidence.
- Visual: a newly created problem glows near its supporting paper cluster; hovering shows its short question. Clicking opens the full work item and research options, not an unrelated paper card.

### 5.2 Right rail — LIVE RESEARCH

Cards: blocker discovered, alternate explanation, human review requested, experiment finished, shared method found, invalidated conclusion. Every card links to source event + real evidence. Active agents show actual backend state (`idle/running/waiting/review/failed/completed`); **no simulated percent progress unless labeled demo fixture**. Clicking a card highlights corresponding research nodes in scene.

### 5.3 Research Lab `/research/:id`

Header: research goal + status + owner/team + metric. Tabs: `Overview`, `Hypotheses`, `Experiments`, `Evidence`, `Questions`, `Scene`. Main layout left experiment lineage, middle detail/result, right agent decisions and threaded human input. Each experiment: hypothesis, independent/dependent variables, baseline, config, duration, metrics, stdout/stderr, git revision, artifact links, evaluator version, decision next.

**3DGS/point-cloud mode** is a dedicated `Scene` tab with actual render assets (.ply/.splat/.ksplat/etc where viewer supports). It is separate from FRONTIER. Let user orbit a scene, switch `RGB / depth / uncertainty / novel view`, click unsupported region to propose a scoped research question. Do not claim missing regions can be reconstructed as fact; show distinction between observed geometry and generated plausible completion.

### 5.4 Fork Explorer `/forks/:id`

Two comparable timelines with shared branch checkpoint: `Without human feedback` and `With feedback`. Compare action taken, hypothesis, metric, cost, next problem generated, and reviewer notes. Branch results are only shown as measured if actually executed. Both have provenance metadata, dataset/hash/seed/evaluator version. Human intervention can help, hurt, or fail to change outcomes. Diff mode highlights what changed.

### 5.5 Team River `/team`

Shared session feed: human statements, agent plans, tool invocations, experiments, blockers, expert requests, validated findings, and proposed skills. Filter by project, researcher, agent, or decision type. Shareable deep links to messages/evidence. Users can intervene on an active session, ask targeted questions, and attach method/paper references. Public *within authorized workspace*, not publicly on the internet. Personal notes remain private unless explicitly shared.

### 5.6 Researcher intelligence `/researchers/:id`

Editable scoped `research principles`, preferences, domain expertise, confidence, evidence of where principle came from, applicable domains, and approval status. CFG-inspired slider controls preference weight in **candidate action reranking**; explain that it is an analogy, not diffusion guidance applied to LLM weights. Record when human-aligned and independent plans differ. Never learn scientific truth solely from repeated opinions.

### 5.6A Papiers grounding visible in the product

- `/library` includes **My Papiers**, **Research library**, and **Public paper universe** as distinct sources; do not confuse papers indexed from OpenAlex/arXiv with papers actually saved by the researcher.
- A source can be marked `engaged_highlight`, `annotation`, `note`, `conversation`, or `saved_unread`. Only the former provide direct evidence of active judgment; always cite the specific source ID and quote/page reference where available.
- Display a `Papiers connected` state, last successful retrieval, signed-in account identifier if available, and a `Source unavailable` state when unauthenticated; do not show fake synced reading history.
- In the research decision inspector, include **Why this paper/approach?**, showing retrieved user notes, the generated principle and how it influenced the selected hypothesis.
- For shared research, sources stay private unless their owner explicitly shares them or a safe, reviewed derived principle. Team members without permissions should see a redacted evidence marker rather than protected text.

### 5.7 Settings

Connect: Papiers, GitHub repo, experiment container, model provider, paper metadata, project permissions. Show actual connection status and last sync time. Provide CPU/GPU capabilities and safe demo-mode toggle. No dead buttons.

---

## 6. Scientific paper corpus and FRONTIER data semantics

### 6.1 Real data sources

**OpenAlex**: `/works` search and filter, topic classifications, referenced works and related works, optional citation neighborhoods. Recommended for graph enrichment. **arXiv**: canonical preprint IDs and paper pages, abstracts, versions, categories. Link raw public records to durable IDs. **Papiers**: user's saved reading and judgment context (read-only CLI, see section 10). **Paperscape**: reference for paper-map visualization and possible precomputed research layouts, subject to checking actual data redistribution terms.

Initial domain scope: 3D reconstruction, neural rendering, 3DGS, diffusion, video generation, scene completion, novel-view synthesis. Expansion beyond ML comes later.

All record titles, author lists, publication dates, graph counts and citation relationships must come from actual sources or be labeled sample data. Avoid invented `1,842,739 papers` counts just because the mockup shows them.

### 6.2 ID and normalization policy

Use internal stable UUID + external IDs (`arxiv:XXXX.XXXXX`, OpenAlex `W…`, DOI). Deduplicate using normalized DOI/arXiv ID and verified mappings. Keep source timestamps and version. **Do not** equate title similarity with identical papers without verification.

### 6.3 Typed knowledge graph

Paper-presentation graph and executable research graph are related, not identical:

- Paper graph: `paper`, `topic`, `author` (optional), edges `CITES`, `RELATED_TO` (measured similarity), `IN_TOPIC`.
- Research graph: `research_project`, `research_problem`, `hypothesis`, `experiment`, `claim`, `finding`, `artifact`, `human_feedback`, `research_principle`, `researcher`, `agent_session`.
- Research edges: `BLOCKS`, `DERIVED_FROM`, `TESTS`, `SUPPORTS`, `CONTRADICTS`, `VALIDATES`, `USES_METHOD`, `CONTRIBUTED_BY`, `REQUIRES_EXPERT`, `PROPOSES_NEXT`, `UNLOCKS`, `INVALIDATES`.

`BLOCKS` has a machine-readable completion condition. Citation/semantic similarity is not a blocking dependency and must not be displayed as such.

### 6.3A Critical difference: a corpus point, a research node, and an ambient photon

- `paper`: a real arXiv/OpenAlex record with stable bibliographic identity and metadata. It can be rendered as **one logically selectable point** at fine zoom.
- `research_problem`: a created, evidenced research task, not a scientific paper. It has its own marker and `BLOCKS` link to its parent research objective.
- `ambient_particle`: shader-only light/dust from a density field; it has no title, counts, search result, click target or source identifier. Never count one as a paper.
- `research_principle`: scoped piece of learned judgment; distinct from either claim or evidence and never treated as truth without corroboration.
- Corpus statistics, source coverage, visual LOD and sampling must be explicit. Avoid claiming that a GPU sampled display literally shows every indexed paper simultaneously.

### 6.4 Core TypeScript models (illustrative)

```ts
type ID = string;
type EvidenceStatus = 'hypothesis'|'preliminary'|'supported'|'replicated'|'disputed'|'rejected';
type Visibility = 'private'|'workspace'|'opt-in-public';
type SessionStatus = 'queued'|'running'|'waiting_human'|'completed'|'failed'|'cancelled';

type Paper = {
  id: ID; arxivId?: string; openalexId?: string; doi?: string;
  title: string; authors: string[]; publishedAt?: string;
  abstract?: string; topics: string[]; sourceUrls: string[];
  embeddingVersion?: string; embedding?: number[]; clusterId?: ID;
  position3d?: [number,number,number]; sourceUpdatedAt?: string;
};

type ResearchNode = {
  id: ID; type: 'project'|'problem'|'hypothesis'|'experiment'|'claim'|'finding'|'principle';
  title: string; description: string; projectId: ID;
  status: EvidenceStatus | SessionStatus;
  ownerIds: ID[]; sourceIds: ID[]; createdAt: string;
  confidence?: number; humanReviewRequired?: boolean;
};

type ResearchEdge = {
  id: ID; from: ID; to: ID;
  type: 'BLOCKS'|'TESTS'|'SUPPORTS'|'CONTRADICTS'|'DERIVED_FROM'|
        'PROPOSES_NEXT'|'UNLOCKS'|'USES_METHOD'|'INVALIDATES'|'REQUIRES_EXPERT';
  explanation?: string; evidenceIds: ID[];
};

type ExperimentRun = {
  id: ID; projectId: ID; hypothesisId: ID; branchId: ID;
  codeRevision: string; environmentHash: string; datasetVersion: string;
  evaluatorVersion: string; params: Record<string,unknown>;
  metrics: Record<string,number>; seed?: number; status: SessionStatus;
  logArtifactIds: ID[]; outputArtifactIds: ID[];
  startedAt?: string; endedAt?: string; nextStepId?: ID;
};

type HumanIntervention = {
  id: ID; sessionId: ID; userId: ID; timestamp: string;
  question?: string; response: string;
  affectedDecisionId: ID; principleCandidateId?: ID;
  forkId?: ID; visibility: Visibility;
};

type AgentEvent = {
  id: ID; sessionId: ID; projectId: ID; timestamp: string;
  type: 'hypothesis'|'experiment_started'|'experiment_finished'|'blocker_found'|
        'human_question'|'human_reply'|'finding'|'fork_created'|
        'principle_proposed'|'status_changed';
  actorId: ID; objectId?: ID; payload: Record<string,unknown>;
};
```

For production, define JSON Schema/Zod validators and database constraints. Do not accept arbitrary LLM JSON into tables without validation.

---

## 7. Autoresearch agent and orchestration

### 7.1 The durable loop

`Goal → objective clarification → prior art search → hypothesis → experimental design → isolated execution → metrics → methodological criticism → next action → update FRONTIER`. A test can fail; failed findings still update research state. The next action must cite the prior experiment result.

### 7.2 Agent roles

- **Research planner:** expands goal, schedules questions across dependencies.
- **Literature agent:** searches OpenAlex/arXiv/Papiers, generates supported related-method summaries.
- **Experiment designer:** defines variable, fixed controls, metric, baseline, runnable protocol.
- **Executor:** launches sandboxed test and captures code/artifact hashes.
- **Scientific critic / PARALLAX:** challenges confounders and whether evidence really supports claim.
- **Human-judgment router:** decides whether/whom to ask and composes evidence packet.
- **Graph curator:** extracts candidate nodes/edges and principles; de-duplicates, validates provenance.
- **Portfolio scheduler:** picks next project/experiment across graph.

Roles may be **agent profiles using the same core harness**, not eight separate mandatory LLM processes. Avoid needless agent debates. Require discriminating experiments when claims conflict.

### 7.3 Reliable harness structure (River inspiration)

**Durable session event log** is canonical; **harness** is disposable code orchestrating turns and tool calls; **sandbox** is disposable environment for code/experiments. Append events before/after tool execution; idempotency keys prevent double-running retries. Research state is reconstructed from events and database snapshots. Authz checked on every tool/data access. Worker queue handles long jobs, retries, cancellation and timeouts. Human messages are first-class event types in the session.

### 7.4 Scientific Compiler

Input: vague objective. Output: `objective`, `metric`, `constraint`, `baseline`, `hypotheses`, `experiment_protocols`, `success_criteria`, `known_unknowns`, `dependency_edges`, `human_clarifications`. If a metric cannot be objectively defined, ask for human criteria rather than quietly assuming accuracy or beauty.

### 7.5 Recursive blockers

Whenever experiment observation contradicts an assumption or exposes unavailable required information:

1. Create `blocker_candidate` with logs/metrics.
2. Search existing tasks, team memory and literature for duplicate or solved problem.
3. Define testable subproblem and its completion criteria.
4. Establish `BLOCKS(parent, child)` (defined direction; document consistently).
5. Prioritize by expected downstream unlock and cost.
6. Assign autonomous agent or request expert.
7. When solved/tested, verify integration at parent; only then mark parent unblocked.

### 7.6 Research policy with human guidance

For candidate next experiments `a`, compute conceptual scores (scale/weights calibrated on actual outcomes):

`score(a) = (1-w) * independentEvidenceValue(a) + w * researcherPreferenceValue(a) - constraintViolations(a)`.

`w` is configurable and context dependent; scientific/ethical constraints cannot be bypassed by weighting. Independent policy and aligned policy each produce explanations and measurable recommendations. Comparisons are a **CFG analogy only**, not classifier-free guidance on a model's hidden states. Meta-research can later evaluate whether any weighting strategy actually improves results.

### 7.7 Human question trigger

Ask when external expertise can change experiment design, objective, interpretation, or safety. Include specific choice, evidence, uncertainty, relevant alternatives, and consequence of each option. Continue unrelated branches while waiting. For expert routing, use demonstrated work and explicit opt-in, not guessed personal attributes.

### 7.8 Counterfactual protocol

Fork at same experiment/checkpoint with controlled dataset, evaluator, seed when possible, time budget, and baseline. Record human feedback difference. Run both branches if feasible. Compare actions and metrics; where different objectives are being optimized, show Pareto/trade-off rather than declaring one universally better. Never invent the no-human outcome if unexecuted. Preserve the fully qualified branch history and exact `humanInterventionId`.

### 7.9 Collective River learning

Research sessions are visible within authorized workspace; user feedback proposes **candidate generalizable principle**. Store source, scope, reviewer, validation status, implementation as versioned skill, and known counterexamples. Approved skills become retrievable by other agents. Private judgment stays personal by default. Shared memory is not model fine-tuning, and publication outside workspace is opt-in.

### 7.9A Evidence-to-skill promotion — from one human correction to team improvement

1. Record human feedback as an immutable event citing the specific experiment or claim it addresses.
2. Extract a **candidate** methodological lesson: textual rule, domains/scope, constraints, triggering context, evidence references and counterexamples.
3. Run conflict/dedup checks against existing researcher and team principles; label personal preferences separately from externally supported science.
4. Researcher approves, edits, scopes or rejects the candidate; only approved and authorized lessons can be published to team retrieval.
5. Store a versioned `skill` with source, reviewer, privacy, evaluation status and last-tested timestamp. Do not fine-tune the base model merely by storing a skill.
6. On a later, genuinely different research task, retrieval finds the skill and changes the proposed experiment, **before a human repeats the instruction**. Log the affected decision.
7. Measure outcomes against a version with this skill disabled; deprecate or revise skills that fail across contexts.

### 7.9B Research-team collaboration and expert directory (River + scientist CRM analogue)

A research workspace includes seven (or more) member profiles with user-controlled expertise tags, active experiments, shared research domains and opt-in consulting capacity. A routing rule can request a particular expert when a blocker overlaps their demonstrated previous work. Requests include a narrow question and source-linked evidence. No agent has automatic access to another researcher's private notes or credentials. A workspace feed publishes **approved and permitted** session events; permanent records have authorship attribution and a permission/audit trail. Cross-team/global publication requires explicit opt-in and source review.

### 7.10 Truth maintenance, transfer, meta-research

Evidence updates impact downstream links. A disputed source results in `needs_revalidation` for dependent claims/projects and creates replication tasks. Related methods from other projects generate **transfer hypotheses** before reuse. Later, evaluate planning policies under controlled compute and question sets, not self-reported confidence.

---

## 8. Reference experiment: diffusion + scene completion (not the core product)

**Parent:** camera-angle recommendation from limited scene images / novel-view rendering.

**Initial method:** evaluate candidate views using an existing or supplied reconstruction/novel-view pipeline. Need clear metrics such as perceptual image quality, geometric/multiview consistency, supported-view coverage, camera trajectory or frame stability. Human can choose priority or trade-off.

**Observed blocker:** moving camera reveals previously unobserved surfaces; generating plausible pixels differs from recovering ground-truth geometry.

**Autogenerated child:** compare baseline 2D image completion versus geometry-aware/conditioned completion for missing viewpoints. Search relevant arXiv/OpenAlex/Papiers and proposed experimental configurations. FLUX-based editing, TurboDiffusion-style acceleration, or temporal frame fixing can be **candidate techniques**, not required dependencies. Do not turn the entire hackathon into training a frontier model.

**Human feedback:** prioritize multi-view consistency above single-frame aesthetics. Agent changes criteria and experiment selection; store principle scoped to reconstruction and video frames.

**Measurements:** compare at least one repeatable numerical metric. For reproducible hackathon loop use pre-existing images/video and lightweight transformations/models or a deterministic baseline experiment. For heavy GPU experiment, precompute results and **clearly identify archived run vs live execution**. Never claim AI has proven genuine unseen geometry without ground truth.

**Demonstration exit:** new research node, actual tested result, human-guided fork, reusable team lesson, parent resumption. This is much stronger than a visually spectacular but non-executable 3D demo.

---

## 9. Backend, API, and database

### 9.1 Stack

- **Frontend:** Vite + React + TypeScript, Three.js or React Three Fiber, cosmos.gl, Tailwind or existing style system, Zustand or TanStack Query for state, React Router.
- **Backend:** Python FastAPI or existing service (do not migrate for style). Worker queue (Redis/RQ/Celery or equivalent), Postgres + optional pgvector, object storage/local artifacts. For hackathon SQLite/local files is allowed if consistent.
- **Graph storage:** Postgres nodes+edges for MVP. Neo4j optional, not a prerequisite. Similarity index in pgvector/FAISS. Embedding pipelines run offline/cache.
- **Agent orchestration:** explicit state machine and durable event records, tool calls with validation; LLM provider interchangeable. MCP gateway optional connector surface.
- **Sandbox:** container/subprocess with resource limits and no implicit secrets/network access; code version + dependencies pinned. Never execute arbitrary user/agent code as trusted web backend.
- **Live updates:** SSE or WebSockets with catch-up on reconnect. Canonical events persisted to DB before push.

### 9.1A Domain contracts that drive the graph (must not be frontend-only)

```ts
type ResearchAgendaItem = {
  id: string; parentProjectId: string; createdFromExperimentId: string;
  problemNodeId: string; hypothesis: string; successMetric: string;
  completionCondition: string; evidenceIds: string[];
  priorArtCheckedAt?: string; candidateDuplicateIds: string[];
  estimatedCost?: number; downstreamUnlockIds: string[];
  priorityReason: string; ownerId?: string;
  status: 'new'|'prior_art'|'ready'|'running'|'blocked'|'validated'|'integrated'|'rejected';
};

type ResearcherContextPacket = {
  researcherId: string; retrievedAt: string;
  sources: Array<{
    papiersId: string; kind: 'document'|'passage'|'highlight'|'note'|'equation'|'conversation';
    sourceId?: string; citation?: string; engagement: 'engaged'|'curated';
    visibleTo: string[]; textExcerpt?: string;
  }>;
};

type ReviewedSkill = {
  id: string; version: string; rule: string; applicableDomains: string[];
  evidenceIds: string[]; reviewerId: string; approvedAt?: string;
  visibility: 'personal'|'team'|'opt-in-public';
  validation: 'candidate'|'reviewed'|'tested'|'deprecated';
  knownCounterexamples: string[];
};
```

### 9.2 Recommended REST+event endpoints

```
GET    /api/frontier/manifest             # total count, cluster summary, layout version
GET    /api/agenda                        # current scoped research agenda and blockers
GET    /api/agenda/:id                    # linked blocker, evidence, completion contract
POST   /api/agenda/:id/investigate        # start/queue child investigation
GET    /api/frontier/tiles?level=&bounds= # binary data or JSON references for visible LOD
GET    /api/papers/search?q=&limit=
GET    /api/papers/:id
GET    /api/papers/:id/neighbors?type=&limit=
GET    /api/research/projects
POST   /api/research/projects             # create objective
GET    /api/research/projects/:id
GET    /api/research/projects/:id/graph
POST   /api/research/projects/:id/run     # start/resume validated loop
GET    /api/experiments/:id
GET    /api/experiments/:id/artifacts
POST   /api/sessions/:id/feedback
POST   /api/sessions/:id/fork
GET    /api/forks/:id/compare
GET    /api/team/events?cursor=
GET    /api/team/skills?status=           # scoped reviewed reusable skills
POST   /api/team/skills/:id/review        # promote or reject candidate skills
GET    /api/papiers/status                # real auth/sync status, never exposed token
POST   /api/papiers/search                # server-scoped source retrieval
GET    /api/researchers/:id/principles
POST   /api/principles/:id/review
GET    /api/events/stream                 # SSE with last-event resume
```

For every mutable endpoint: auth, permissions, request schema, idempotency key where appropriate, explicit status, trace ID. Don't design the frontend with undocumented fake endpoints and then hope they exist.

### 9.3 Event flow example

`experiment.finished` → `critic.reviewed` → `blocker.detected` → `frontier.node_created` → `human.question_asked` → `human.responded` → `research.fork_created` → `experiment.started` → `experiment.finished` → `finding.reviewed` → `research.unblocked` → `principle.proposed`. Each has stable ID, timestamp, actor, project, payload, evidence IDs and visibility.

---

## 10. Papiers + MCP integration — FIRST-CLASS PRODUCT FEATURE

**Decision: YES, APORIA uses Papiers as a core user-grounding integration.** It is not the graph database, the public paper index, or the experiment runner. It is the **read-only source of what this researcher actually read and thought**. It is a meaningful Papiers sponsor-challenge integration and belongs inside the main hypothesis workflow, not merely the settings menu.

**Official capabilities verified 17 October 2026:** The Papiers CLI exposes `search`, `list`, `read`, `browse` for a person's saved documents, passages, highlights, notes, equations and past conversations. Requires Node.js 22+. Token comes from Papiers Settings → API tokens and can be supplied to a CLI process via `PAPIERS_TOKEN`; see https://wiki.papiers.ai/docs/agents. The CLI is explicitly **read-only**: cannot import, edit, highlight, tag, publish, or write APORIA findings back. Treat future writing capability as unverified until an official supported API exists.

### 10.1 Minimum working integration (required for intended sponsor submission)

```bash
# In developer environment with Node.js >=22
npm install -g papiers
papiers version
papiers auth login       # secure token input; never hardcode token in repo
papiers auth status
papiers doctor
papiers search "3D gaussian splatting inpainting" --limit 10 --json
papiers list --kind highlight --since 30d --json
papiers list --kind note --json
papiers read doc_... --pages 1,3-5 --json
```

On the backend, create a `PapiersAdapter` executing **allowlisted arguments** or an equivalent safe connector. Never accept arbitrary CLI arguments from user-generated prompts. Send only authenticated server-side requests with a user-scoped token. Do not bundle tokens into client JavaScript, logs, event streams, agent prompts, model responses, or GitHub.

### 10.2 Exact research-flow integration

1. Before generating first hypotheses, planner calls Papiers search for user's topic and optionally surveys their recent notes/highlights.
2. Rank content by engagement: annotated/highlighted/asked-about material is a stronger indication of **previous attention** than saved-but-unread material; do **not** convert highlights into unquestioned scientific truths.
3. Read only the most relevant cited items and construct a `ResearcherContextPacket` containing typed Papiers IDs (`doc_`, `pas_`, `hl_`, `nte_`, `eq_`, `cnv_`), citation locations, user contributions, provenance, permissions and retrieval timestamp.
4. Feed packet into hypothesis generation **and** researcher-aligned candidate-action scoring. The independent scientific critic remains capable of disagreeing.
5. In the UI let the human inspect the exact Papiers context behind the decision and correct inaccurate assumptions about their preferences.
6. After a real experiment, store experiment artifacts/findings in APORIA's own database (content hashes, evidence, URLs, personal/team visibility). Optionally construct copyable notes with links to open in Papiers manually; **do not pretend these were automatically written into Papiers**.
7. On next investigation, retrieve prior APORIA evidence + updated Papiers context, so the agent can apply human lessons autonomously.

### 10.3 Practical acceptance tests for Papiers

- With a valid researcher token and at least one engaged source: search returns real source IDs; clicking a hypothesis reveals a source-backed note/highlight that influenced it.
- With Papiers disconnected: investigate still works using OpenAlex/arXiv, but UI says `Papiers disconnected` and does not claim personalized reading history.
- Team member B cannot read member A's private Papiers source through FRONTIER or Team River merely because B is in the same project.
- A generated experiment result appears in APORIA's research graph, **not** automatically in Papiers (read-only CLI).
- The same research task can be run with and without Papiers-derived personal context and compares the next plan; do not fabricate a positive difference.

### 10.4 Distinguish graph retrieval from connector retrieval

- **OpenAlex/arXiv:** discover broad public prior art and public paper metadata. Paperscape/Cosmograph affect visualization, not scientific reasoning.
- **Papiers:** recover an individual researcher's real notes and engagement with sources (auth required).
- **FRONTIER GraphRAG:** traverse typed evidence, dependencies, research problems and validated transfer links across public, personal and team records with authorization checks.
- **MCP (Model Context Protocol):** standard wrapper for tool interfaces. Papiers can initially be accessed via its documented CLI; an MCP adapter is optional engineering convenience, not an additional scientific capability.
- **Research DB:** stores APORIA sessions, experimental artifacts, forks, approval records, research skills and knowledge graph, including write operations that Papiers CLI does not offer.

### 10.5 Completion state

This specification verifies the **publicly documented interface**, not that this user has connected a Papiers account or that live reading data has been imported. Build the integration, test it with a token supplied through secure configuration, and show actual connection status in demo.

## 11. Repository structure

```
aporia/
  apps/web/
    src/app/             # routes, shell, data fetching, state
    src/features/frontier/
      FrontierPage.tsx
      CosmosExplorer.tsx
      CinematicPointCloud.tsx
      ParticleShader.ts
      GraphDataAdapter.ts
      LevelOfDetail.ts
      PaperInspector.tsx
      ResearchOverlay.tsx
      layout-cache.ts
    src/features/research/  # experiment timeline, metric plots, console, 3DGS viewer
    src/features/forks/     # comparison and branch replay
    src/features/team/      # shared event feed and intervention
    src/features/library/   # paper search / source inspector
    src/components/         # AppShell, Panel, CommandPalette, Tooltip, etc.
    src/styles/tokens.css
  services/api/
    routes/
    models/
    services/paper_ingestion/
    services/knowledge_graph/
    services/experiment_runner/
    services/agent_harness/
    services/learning/
  workers/
  data/fixtures/           # clearly labeled seeded demo inputs, never claimed as live
  docs/
    APORIA_MASTER_SPEC.md
    SOURCES_AND_LICENSES.md
    API_CONTRACTS.md
  scripts/
    ingest_papers.py
    embed_and_project.py
    prepare_gpu_buffers.py
    seed_demo.py
```

`GraphDataAdapter` must be pure: typed records in → stable `ids[]`, `Float32Array xyz`, `Float32Array links`, colors, sizes, cluster labels, and normalized source URLs out. Unit test index alignment and deduplication.

---

## 12. Build order (strict)

### P0 — Real, impressive, functional FRONTIER

1. Stand up repo and app shell.
2. Import a curated real subset of arXiv/OpenAlex paper metadata (source links preserved).
3. Generate embeddings/clusters and deterministic stable 3D coordinates. Cache them.
4. Integrate **actual `@cosmos.gl/graph`** interactive graph. Search, zoom, select, inspect paper and real related/citation links.
5. Apply neon palette and density treatment; compare to reference at identical viewport. Fix camera and cluster composition before adding complex chrome.
6. Add Three.js `Cinematic` point-cloud view using same frozen coordinates with custom shaders/bloom. Toggle without losing selected paper.

### P1 — Actual autoresearch

7. Connect **Papiers CLI (read-only)** early: show authenticated search of real highlight/note context influencing a hypothesis, plus a visibly disconnected fallback. OpenAlex/arXiv remain public source index.
8. Implement minimum experiment executor with reproducible baseline, metrics and stored logs.
9. Add research node / relationship schema, FRONTIER overlay of research project and blocker **plus /agenda work item with completion contract**.
10. Agent generates next experiment based on measured result, creates a blocker when relevant.
11. Human question/feedback route changes next experiment and persists principle candidate.
12. Branch from shared checkpoint and run comparable alternative outcome.

### P2 — River-style team + polish

13. Shared event feed, evidence links, second researcher contribution.
14. Reuse a learned method from team memory in another investigation; explicitly test it.
15. Add Papiers engagement-signal ranking, precise citation display and before/after grounding replay; do not defer the initial CLI integration until here.
16. Add scientific critic, truth-maintenance and advanced task scheduler as capacity allows.
17. Refine lighting, labels, transitions, screen capture, demo and Devpost documentation.

### P3 — Six-month extensions

Portfolio optimization across dozens of goals, controlled evaluation of guidance weights, selective expert routing with proven expertise, reproducibility scorecards, deep proof/counterexample tracking, full artifact DAG, intelligent team skill promotion, live code revision/PR generation, cross-field knowledge transfer, GPU pool scheduler, access-controlled multi-organization learning.

---

## 13. Acceptance tests — the judge should be able to try these

**Visual:** At 1440×900, FRONTIER is unmistakably a dense organic glowing particle field. Zoom/rotate works. No flat spiral dot chart. Individual paper points remain legible near camera; cloud masses look sculptural at distance. Neon treatment remains performant, not a baked image.

**Papiers grounding:** With actual connected reading history, a note/highlight/engaged source influences a decision and is directly inspectable with a source ID. A disconnected account produces a truthful UI state and public-literature fallback. Source privacy and read-only limitation are enforced.

**Research agenda:** An experiment-created blocker becomes a deduplicated subresearch work item with completion condition and evidence; integrating a child result into the parent requires a measured parent-side verification run.

**Skill transfer:** One human correction creates a candidate research principle, review promotes it to a reusable skill, and a different team agent demonstrably retrieves and applies it on a new decision.

**Paper truth:** Search for a paper; click returns title/authors/real source ID; opening source URL goes to the right record. A citation edge differs from embedding-similarity edge. Visible vs indexed counts are not conflated.

**Research truth:** At least one completed baseline experiment includes configuration, actual code artifact/log, metric, evaluation, and an agent-generated next step derived from those metrics. Another experiment tests a changed hypothesis.

**Autonomous new research question:** Agent identifies a specific blocker from evidence; it creates a new linked research problem node and a targeted agenda entry without the user manually authoring the node.

**Human collaboration:** A human correction changes the next agent decision. Shared reviewer evidence is visible. In a replay, learned principle is applied independently to a related question.

**Fork:** Both compared branches are genuinely run, or unexecuted branch clearly says 'not evaluated'. Same initial experiment, controlled baseline, traceable metrics.

**Team:** Second member can join an existing session, inspect evidence, link prior finding, or correct a method. An approved reusable skill can be retrieved by another agent. Access controls respected.

**Honesty:** Synthetic/demo data is labeled. No fabricated live agent progress, published discoveries, global paper counts, or clinical/scientific validation.

**Resilience:** Reload retains research sessions, selected project, experiment history and human feedback. WebGL unsupported shows usable 2D/list fallback. No console errors and no dead primary controls.

---

## 14. Smoke-test / development commands

```bash
# Frontend example (adapt to existing monorepo)
npm install
npm install three @react-three/fiber @react-three/drei \
  @react-three/postprocessing @cosmos.gl/graph
npm run dev
npm run build
npm run lint
npm run test

# Papiers integration is optional and should be authenticated securely
npm install -g papiers
papiers doctor
```

Visual regression snapshots must compare against **target reference** at fixed viewport and seed, not against the older basic spiral wireframe. Use a deterministic sample dataset in tests; replace with real API data in normal mode.

---

## 15. Public implementations to study and reuse

| Asset | URL | What to reuse / learn |
|---|---|---|
| cosmos.gl GPU graph (MIT) | https://github.com/cosmosgl/graph | **Direct dependency**: layouts, 3D rendering, clustering, data buffers, interactions, APIs |
| cosmos.gl official API | https://cosmograph.app/docs-lib/api/internal/classes/Graph/ | Verified `spaceDimensions`, `setPointPositions`, `setLinks`, clustering/selection and camera methods |
| Cosmograph live reference | https://run.cosmograph.app/public/ca9fd1ad-fe83-4238-8b69-b707c633aef0 | User's preferred interactive feel/graph composition; study behavior and data presentation |
| Cosmograph docs | https://cosmograph.app/docs-lib/ | Search/filter/labels/timeline/graph interaction patterns |
| Paperscape | https://paperscape.org/ | Existing concept of one paper per visual item and scientific clusters |
| OpenAlex API | https://help.openalex.org/api/ | Real works, topics, referenced works and citation neighborhoods |
| arXiv | https://arxiv.org/ | Canonical source paper IDs and public paper pages |
| Shopify River | https://shopify.engineering/under-the-river | Durable session/harness/sandbox, multiplayer visibility, reusable lessons |
| Karpathy autoresearch | https://github.com/karpathy/autoresearch | Minimal reproducible loop, fixed metric and fixed-budget experiment, accept/reject |
| Papiers | https://wiki.papiers.ai/docs/agents | Read-only research context CLI, highlights and notes |
| Three.js | https://threejs.org/docs/ | Points, BufferGeometry, ShaderMaterial, additive particles, render pipeline |
| GaussianSplats3D | https://github.com/mkkellogg/GaussianSplats3D | Optional physical 3DGS viewer, distinct from paper-universe renderer |

**Credit/terms:** `cosmos.gl` is MIT-licensed; preserve attribution/license notices as appropriate. Cosmograph's Free application explicitly permits noncommercial exploration; avoid assuming all its proprietary app UI source is public. You may use its interface as a behavioral reference and integrate the MIT engine directly. Verify dependency/asset/data-specific terms when copying any non-MIT implementation or hosted data.

---

## 16. Agent handoff prompt (paste into Codex / Cursor / Claude Code)

> We are implementing APORIA. Read `docs/APORIA_MASTER_SPEC.md` completely before making changes. The previous flat spiral/SVG wireframe is rejected. Inspect the repository, identify existing functional endpoints and data schemas, and preserve existing work. **Directly integrate the MIT `@cosmos.gl/graph` engine** as the underlying paper graph. Verify its installed v3 API for 3D positions and selection. Use real arXiv/OpenAlex paper records, stable IDs, semantic clustering, and meaningful relationships. Create the exact cinematic, dense-neon point-cloud FRONTIER aesthetic in the specification, using Three.js custom shader/soft glow rendering where it improves the visual; keep semantic GPU points separate from ambient particles. Do not copy an image into the main canvas and pretend it is interactive. Implement search, camera orbit, paper inspection, source links, real research-problem nodes, experiment timeline and human input. Build the evidence-backed autoresearch loop, recursive blocker creation, human feedback and forks before polishing secondary features. Never display fabricated research metrics as live data. After each phase, run the app and compare a screenshot at 1440×900 to the supplied target image; report what actually works and what remains mocked. Favor working functionality and visual fidelity, not a mountain of inert controls.

### Source-of-truth and implementation-state rules

- `APORIA_MASTER_SPEC_v1.1.md` is the engineering source of truth; `APORIA_FRONTEND_SPEC.md` adds component-level visual detail; `APORIA_PRODUCT_VISION.md` preserves the fuller narrative design intent. Where statements conflict, newest master engineering requirements win.
- `APORIA_AUDIT_AND_DECISIONS.md` records which prior-chat requirements were already covered and which were strengthened. The bundled demo/browser prototype is not a substitute for the actual Three.js + cosmos.gl integration.
- No claim that Papiers, the user's team accounts, full arXiv ingestion, autonomous experiment runner or active agent jobs are already functional is justified solely by these specifications.

### Final quality bar

**Paperscape semantics. Cosmograph-grade interaction. Three.js neon point-cloud sculpture. River-style multiplayer learning. Genuine, evidence-backed autoresearch.**
