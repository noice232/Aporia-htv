# LEGACY FRONTEND VISUAL REFERENCE (ADAPTED NAME)

Visual reference only. The v3 Frontend Engineering Specification takes precedence.

# APORIA — Frontend Design and Implementation Specification

> **Purpose:** Hand this document to Claude Code, Cursor, or Codex alongside the existing backend/database schema. Implement the UI described here. This is a product specification, not merely a mood board.
>
> **Design reference:** The supplied image (`image(3).png`) shows a dense, colored volumetric point cloud: almost-black/deep-purple empty space, bright cyan/teal, electric lime, yellow, and hot orange particles that form legible three-dimensional structures. Reproduce its **visual language**, not its literal forest subject matter. The visualizations must encode real research state.

## 0. Product in one sentence

APORIA is a multiplayer autonomous research operating system: humans and agents share an executable FRONTIER research graph, run experiments, discover new questions, branch research decisions, and reuse evidence and learned research judgment across a team.

## 1. Product experience — what it should feel like

Not a typical SaaS dashboard, chatbot, or static knowledge graph. It should feel like **a scientific observatory, an IDE, and a multiplayer mission-control room merged together**.

- The **hero** is a living, explorable 3D *FRONTIER Universe*: colored point-cloud clusters connected by subtle dependency paths, growing as agents discover new research problems.
- Actual work happens in **research workspaces**: real experiment metrics, terminal logs, comparisons, artifacts, code references, citations, researcher feedback, and the timeline of decisions.
- A **shared team stream**, inspired by Shopify River, lets authorized collaborators see useful investigation events, corrections, learned skills, and requests for expertise.
- The **Fork Explorer** makes intervention visible: compare two research branches from the same checkpoint, one with human input and one without.
- Every flashy visual element has a meaningful semantic connection to project data. No fake moving nodes, misleading metrics, or randomly invented discoveries.

**Aesthetic keywords:** black-box research lab; fluorescent point cloud; dense yet navigable science; near-black aubergine space; glowing cyan/lime/yellow/orange structure; quiet slate panels; precise small typographic labels; restrained motion; strong evidence-first UI.

## 2. Design system (implement as named tokens)

### 2.1 Color tokens

The source image is predominantly black and deep purple, with a bright green-to-gold point-cloud surface. Use the following curated, accessible UI palette inspired by that image:

```css
:root {
  --bg: #07070D;
  --bg-raised: #10121C;
  --bg-panel: #111522;
  --bg-panel-hover: #1B2130;
  --bg-universe: #05040B;
  --border: #273044;
  --border-bright: #3B4A66;
  --text: #F3F5F8;
  --text-secondary: #A6B1C4;
  --text-muted: #68758D;
  --violet-depth: #351344;
  --violet-paper: #9C77ED;
  --blue-active: #547DFF;
  --cyan-hypothesis: #32CFF2;
  --teal-working: #22D8B5;
  --lime-verified: #BAF55A;
  --amber-unknown: #FFB34E;
  --orange-blocker: #FF7C41;
  --red-conflict: #FF6077;
  --ring: #7DBBFF;
}
```

**Semantic colors** (not decorative):

- Supported / independently verified result → lime `--lime-verified`.
- Current experiment / active agent → cyan or teal.
- Hypothesis or proposed research node → cyan, with dotted/dashed outline in conventional UI.
- Missing evidence / unresolved research question → amber.
- Blocking dependency → orange.
- Contradicted / invalidated claim → coral red.
- Literature/paper/archived document → muted violet.
- Human intervention → blue, visibly different from agent events.

**Note:** Different shapes/icons and explicit labels must reinforce status; don't rely on hue alone. Never label a finding “verified” just because a score is high.

### 2.2 Typography

- UI font: **Inter** or **Geist Sans**.
- Scientific IDs, timestamps, metrics, experiment identifiers: **JetBrains Mono**.
- Wordmark `APORIA`: bold uppercase with slight tracking; do not use excessive gradients.
- Headings ~18–24px in panels, screen titles 24–30px, body 13–15px, metadata 11–12px.
- Keep charts, evidence tables, and experiment outputs legible. The 3D visual may be cinematic, but tool UI must be functional.

### 2.3 Surfaces and motion

- 1px low-contrast borders, 10–14px radii, modest frosted transparency only for panels overlaying the 3D universe.
- A very subtle violet/cyan radial ambience behind the graph, never a brightly colored full-page gradient.
- Hover transitions 120–180ms, panel transitions 180–240ms, camera flights 600–900ms with ease-out.
- Ambient point drift should be almost imperceptible; do not constantly spin the research graph.
- Respect `prefers-reduced-motion` and provide a 2D graph/table fallback.

## 3. Desktop layout (baseline 1440×900, scales to 1920×1080)

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│  APORIA ◉   Workspace: CBG Vision Lab ▾   Frontier  Experiments  Forks  Team   Search  │ 64px
├───────────────────┬───────────────────────────────────────────┬───────────────────────────┤
│ PROJECTS          │                                           │ INSPECTOR                 │
│                   │        LIVING FRONTIER UNIVERSE           │                           │
│ ● Camera angles   │        colored 3D point-cloud graph       │ Selected: Missing Geometry│
│ ○ Scene completion│        zoom / orbit / select / explore    │ Status: BLOCKING          │
│ ○ Frame consistency                                           │ Evidence / next action    │
│                   │                                           │ Experts / dependencies    │
│ RESEARCH AGENDA   │                                           │                           │
│ 3 active          │                                           │                           │
│ 2 blocked         │                                           │                           │
│ 6 proposed        │                                           │                           │
│                   │                                           │                           │
│ TEAM              │                                           │                           │
│ 7 researchers     │                                           │                           │
│ 4 active agents   │                                           │                           │
├───────────────────┼───────────────────────────────────────────┼───────────────────────────┤
│                   │  EVENT TIMELINE / RESEARCH STREAM         │  HUMAN INPUT / CONTROLS   │
│                   │  experiment → blocker → new dot → expert │  Ask / challenge / fork   │ ~140–170px
└───────────────────┴───────────────────────────────────────────┴───────────────────────────┘
      ~250px                       flexible (≥650px)                     ~340px
```

**Fixed:** Global top bar 64px. **Collapsible:** left rail 250px, right inspector 340px. **Main:** flexible large viewport, preserving the 3D scene. **Bottom:** dock/timeline around 150px, collapsible to 40px. At narrow desktop widths hide one side panel on demand instead of crushing the visualization. Keep the 3D viewport large, approximately 60% of the main working area.

### Top bar

Left: wordmark + glowing concentric-orbit logo. Next: workspace picker and active project breadcrumb. Center tabs: **Frontier**, **Research Lab**, **Fork Explorer**, **Team River**, **Library**. Right: global search, notifications, running-agent counter, profile/avatar cluster.

Global search (keyboard `/` or Cmd/Ctrl+K) searches problems, projects, hypotheses, papers, people, experiments, and skills. Results are grouped by type with breadcrumbs and status.

### Left rail

1. **Research projects:** project tree, status dots, owner avatars, count of experiments, subtle indentation for subprojects.
2. **Research agenda:** filters `Active`, `Blocked`, `Proposed`, `Completed`; show priority and blocker/dependency counts.
3. **Team presence:** 7 people as initials/avatars, agent count, statuses `researching`, `awaiting input`, `idle`; click opens team or filters graph.

Avoid a long wall of cards. Use concise rows and a small group hierarchy.

### Main canvas

The canvas shows a graph of scientific work, not generic decorative stars. Place a compact mode selector and filters floating at top-left of canvas: `Research graph | Evidence | Dependency view`; filters for `Active`, `Unknown`, `Blocked`, `Verified`, and `My team`.

Lower-left canvas overlays a legend and mini compass. Lower-right shows `Fit graph`, `Reset camera`, `2D mode`, `Fullscreen`. Hovering graph nodes opens tiny, readable tooltips. Selecting a node opens/updates the right inspector.

### Right inspector

By default, show **Live research** (now running, latest discoveries, human questions). On selecting a node, replace with a **Node Inspector**:

- Title, type, status badge, short summary, owner/agent, last update.
- **Why this matters**: parent goal, what this node blocks/unlocks.
- **Evidence**: citations, metrics, linked experiment logs, confidence/uncertainty wording.
- **Dependencies**: related nodes with clickable jump actions.
- **People**: relevant researchers, mentions, expertise request.
- **Actions**: `Open investigation`, `Ask why`, `Challenge assumption`, `Suggest experiment`, `Create fork`.

No inert buttons. Every action opens an implemented drawer/modal or navigates to a working view.

### Bottom dock

Horizontal chronological **research event timeline** with timestamped events: hypothesis generated, experiment started/finished, discovery, contradiction, blocker, human correction, agent requested input, fork created, new frontier node. Events have type icons, concise labels, clickable artifact links. Switch between `Timeline` and `Live stream`; allow pause auto-scroll. Never auto-scroll a user away from what they're inspecting.

## 4. Signature visualization: the 3D FRONTIER point cloud

**This is the visual anchor. Build it carefully.**

### 4.1 What the image should look like

A three-dimensional galaxy/terrain of *densely packed small luminous particles*, like the supplied screenshot's glowing 3DGS/point-cloud surface, suspended in a huge dark volume. Not a collection of giant spheres joined by neon spaghetti lines.

- Dark aubergine-to-black depth, with sparse distant purple/blue particles.
- Main active research regions are densely composed of tiny cyan, teal and chartreuse specks.
- Verified/high-confidence structures get subtle lime highlights; unresolved edges and emerging questions glow warm yellow/orange.
- Some clusters feel like organic surfaces or hills of point-cloud data, with irregular contours and small empty gaps; avoid uniform balls.
- Key research objects (major project, blocker, selected hypothesis) get a crisp label and small interaction target overlay, separate from decorative particles.
- Show faint dependency filaments only for selected/important relations; default graph should be visually breathable.

### 4.2 Geometry and data mapping

**Research cluster:** Parent project or research domain. Has a centroid, irregular volumetric boundary, and thousands of fine particles representing its associated evidence/activity density. Particles themselves can be aggregated; do not imply every decorative particle corresponds to a unique paper if it does not.

**Primary research node:** An actual problem/hypothesis/result/experiment from the schema. Render it as a bright target point with a small halo and short label at medium zoom. Node radius/halo may encode downstream impact or connected work count, with a clearly documented mapping.

**Dependency edge:** A faint curved line connecting two actual nodes, directional markers shown only in dependency mode or on selection. `blocks` in amber, `supports` in green, `contradicts` in red, `derived from` in muted slate.

**Newly discovered problem:** Emit a short bright spark from the origin experiment to the generated question location; particles gather and a new amber target appears. Show a callout `New research problem discovered` containing the real problem title and evidence link. Animation should trigger only on a genuine new event.

**Blocked node:** Warm orange glow and intermittent slow pulse (not continuous flashing). On selection, highlight the exact problem that blocks it.

**Invalidated discovery:** Shift status to coral and visually dim descendants until their evidence is re-evaluated. Never delete history silently.

**Team contributions:** If a teammate's work connects to a selected problem, reveal a narrow luminous bridge between two research regions and label it `Relevant work by [researcher]`, with evidence attached.

### 4.3 Level of detail

- **Far zoom:** 4–12 named research regions, visual focus on relationships and active domains.
- **Medium zoom:** Main research questions, blockers, and edges emerge with readable labels.
- **Close zoom:** Experiments and claim/evidence nodes become selectable; selecting an experiment shows its actual artifacts.
- Never dump every source paper label onto the 3D canvas; show progressive disclosure and search.

### 4.4 Interaction

- Left drag: orbit.
- Wheel/pinch: zoom.
- Right drag / two-finger drag: pan.
- Hover a named node: tooltip, accent halo, highlight immediate dependencies.
- Single click: select node, update inspector and breadcrumb.
- Double click: camera flies to cluster/node and opens focused investigation context.
- `Esc`: clear selection / close topmost panel.
- `F`: fit visible graph.
- `/`: global search.
- Clicking a graph event in the bottom timeline focuses the corresponding node and shows what changed.
- Offer a `Reset view` control and `2D accessible mode` for keyboard and reduced-motion users.

### 4.5 Implementation strategy

Use **React Three Fiber + Three.js**. Render point fields with **`THREE.Points` + buffer geometries**, ideally shader-based per-point size, color, opacity, and focus state. Use deterministic seeded layouts so nodes don't randomly move on every render. Node labels are small HTML overlays (`@react-three/drei` `Html`) only for important nodes, or CSS overlay projected into screen space.

Potential stack: `@react-three/fiber`, `@react-three/drei`, `three`, `zustand`, `@tanstack/react-query`, `d3-force-3d` or a deterministic graph layout, `framer-motion`/Motion, `recharts`, `lucide-react`, shadcn/ui. Do not introduce libraries if the repo already has equivalents.

**Performance:** Start with about 5,000–15,000 total point sprites, cap visible labels, throttle raycasting, use level-of-detail, and reduce particle budget on low-power devices. `prefers-reduced-motion` freezes ambient drift. Do not use 10,000 independent React components or individual sphere meshes.

**Important distinction:** The **FRONTIER graph** is not itself a 3DGS scene reconstruction. Both can share a point-cloud aesthetic, but their underlying data is different.

## 5. Dedicated research scene viewer (where the supplied image fits literally)

When a research node has a scene reconstruction, open `Research Lab → Scene Viewer`:

- Main view: actual camera-controllable 3DGS/point-cloud scene, using a compatible scene/splat renderer if supported by existing assets. A generic particle graph is **not** a substitute for a genuine 3D reconstruction.
- Top-left toggles: `Photoreal render` (if supported), `Point cloud`, `Depth`, `Uncertainty`, `Observed coverage`.
- Camera toolbar: orbit, saved viewpoints, camera path preview, reset, screenshot/thumbnail.
- Bottom experiment strip: view candidates, measured quality scores, latency/consistency metrics, chosen baseline.
- Right panel: region-level evidence and provenance.
- **Signature interaction:** click a region with uncertain or missing evidence → see why it is uncertain → `Investigate this gap` opens a new proposed FRONTIER research node, linked as a dependency to the current experiment. Do not claim the user clicked actual uncertainty unless a real mask/coverage estimate exists.

For a camera-angle project, the user should visibly move between **physical uncertainty in a 3D scene** and **scientific uncertainty in the FRONTIER graph**.

## 6. Main screens / routes

### A. `/frontier` — Living research universe

Use the 3-column desktop + bottom dock layout above. Default selection is the active root project. Supports filters, node navigation, search, evidence, blocker discovery, and agent timeline.

### B. `/research/:id` — Research Lab

Header: question/title, status, parent problem breadcrumb, experiment count, owner, `Run next`, `Request expert`, `Fork`.

Two-column body:

**Left 65%:** tabbed `Overview`, `Hypotheses`, `Experiments`, `Artifacts`, `Code`, `Scene Viewer` (only if applicable). Overview shows objective, falsifiable questions, dependencies, and next proposed experiment. Experiment pages have actual metric graphs/tables and run logs, with side-by-side comparisons.

**Right 35%:** persistent investigation feed with agent decisions, human feedback, provenance, and explicit `Challenge`, `Suggest`, `Approve`, `Stop` actions if supported.

Never present an LLM interpretation without direct links to supporting experiment runs and materials.

### C. `/forks/:forkId` — Counterfactual Fork Explorer

Top: shared starting checkpoint, triggering human intervention, research question, experiment controls, and a clear `actual run` vs `replayed/simulated` provenance label.

Below: two equal side-by-side vertical lanes, **Autonomous (without intervention)** vs **Human-guided**. Each lane shows its sequence of hypotheses, experiments, metrics, decisions, and resulting research nodes. Connecting arcs emphasize decisions that diverged. A diff panel summarizes `Changed objective`, `Changed experiments`, `Outcome difference`, `Cost difference`, `Uncertainty`.

Timeline scrubber selects a common logical stage and synchronizes comparisons. Do not invent alternate outcomes: if a branch was not executed, show `not run` with a button to run it (if backed by an API).

### D. `/team` — Team River

Shared, searchable chronological stream inspired by Shopify River, visible to authorized team members **inside the workspace**, not publicly on the internet.

Every event card includes: author/agent, project, action, plain-language significance, evidence link, timestamp, and thread/replies. Highlight `Human corrected agent`, `Reusable skill extracted`, `Research blocked`, `Existing solution found`, `Expert needed`, `Experiment replicated`.

Users can reply or challenge, subscribe to an investigation, jump to source, and reuse a validated insight with provenance. Side rail shows teammates, areas of expertise, relevant open questions, and unresolved requests. Provide privacy/permission indicators; no silent promotion of private researcher preferences to global knowledge.

### E. `/library` — Knowledge / Papiers

Searchable sources (papers, annotations, claims, lessons, skills), grouped by ownership/permissions and evidence status. Every item links to research graph nodes that use it. Use read-only Papiers retrieval according to supported interfaces; APORIA experiment writes stay in the APORIA data store unless a working write integration exists.

### F. `/settings/researcher` — Scientific intuition / policy

Inspectable and editable researcher judgment profile: preferences, domains of expertise, extracted scientific rules, scopes, confidence, sources, and consent controls. The UI must let the user correct or disable an inferred principle. Provide a simple **Human Influence** control from `Independent` to `Human-aligned`, with the note that this reranks research decisions and is CFG-inspired, **not actual classifier-free guidance**. This never overrides hard safety/scientific validity constraints.

## 7. Demo narrative encoded into actual UI state

Use these illustrative titles and objects **only as demo seed data**, clearly labeled until the real backend provides them:

- Root project: **Optimal Camera Angle**.
- Experiment: **Novel View Quality Baseline**.
- Discovered blocker: **Unobserved Scene Regions**.
- New child research question: **Geometry-aware Scene Completion**.
- Related teammate work: **FLUX Conditioning Experiments**.
- Human intervention: **Prioritize multi-view consistency over one-frame realism**.
- Fork branches: **Original visual-quality optimization** vs **Geometry-consistency-first**.
- Parent result: rerun camera-angle comparison after implementing the chosen scene-completion technique.

### The desired 30-second visual sequence

1. User starts on the 3D FRONTIER universe, focused on Camera Angle Optimization.
2. A *real* experiment finishes and creates an event in the dock.
3. Its evidence reveals a missing/uncertain scene region.
4. FRONTIER emits a warm-orange **new research node** connected by a `blocks` edge to the original project. Right inspector opens to show the exact question and evidence.
5. System finds a relevant previous experiment contributed by another researcher; a new relationship bridge appears.
6. A targeted question appears: `Does this method preserve geometry across views?` The human answers / intervenes.
7. A fork event appears, user clicks it and sees the two actual trajectories compared.
8. New findings update the graph and unblock the parent project, only if the underlying data supports that state.

The animation is the *presentation of a real state transition*. It is not the evidence itself.

## 8. Component structure (suggested)

```text
src/
  app/ (or routes/)
    frontier/
    research/[id]/
    forks/[id]/
    team/
    library/
    settings/researcher/
  components/
    shell/
      AppShell, TopNav, ProjectRail, BottomResearchDock
    frontier/
      FrontierCanvas, ParticleField, ResearchNode,
      DependencyEdge, NodeTooltip, CameraControls,
      GraphFilters, GraphLegend, GraphSearch,
      NewResearchNodeAnimation, Frontier2DFallback
    inspector/
      NodeInspector, EvidenceSection, DependencyList,
      RelatedPeople, NodeActions, LiveAgentStatus
    research/
      ResearchHeader, HypothesisPanel, ExperimentRunCard,
      MetricComparison, RunLogs, ArtifactViewer,
      SceneViewer, UncertaintyOverlay, HumanFeedbackComposer
    forks/
      ForkHeader, BranchLane, BranchComparison,
      DecisionDiff, ForkTimeline
    team/
      RiverFeed, ActivityCard, ResearchThread,
      ExpertRequestCard, TeamPresence, ReusableSkillCard
    memory/
      ResearcherProfile, JudgmentPrinciple, HumanInfluenceControl
    common/
      StatusPill, EmptyState, LoadingSkeleton,
      CitationLink, CommandPalette, ErrorState
  hooks/
    useResearchGraph, useResearchEvents, useSelectedNode,
    useResearchRun, useFork, useTeamFeed
  adapters/
    schemaAdapter.ts
  lib/
    graphLayout.ts, colors.ts, graphSemantics.ts
```

Use the existing backend schema as source of truth. `schemaAdapter.ts` transforms actual API records into **view models**. Do not invent persistent database columns to match this document. If a required field is missing, display `Not available` or omit the feature; use separately flagged demo fixtures only for a demo mode.

Suggested **view-model** concepts (not database migrations):

```ts
type ViewNode = {
  id: string;
  title: string;
  kind: 'project'|'question'|'hypothesis'|'experiment'|'finding'|'paper'|'skill';
  status: 'proposed'|'active'|'blocked'|'supported'|'disputed'|'invalidated';
  summary?: string;
  parentId?: string;
  ownerIds?: string[];
  evidenceIds?: string[];
  x?: number; y?: number; z?: number;
};

type ViewEdge = {
  source: string;
  target: string;
  relation: 'blocks'|'depends_on'|'supports'|'contradicts'|'derived_from'|'reuses';
};

type ViewEvent = {
  id: string;
  timestamp: string;
  researchId: string;
  actorId: string;
  kind: 'experiment_started'|'experiment_completed'|'new_problem'|'human_feedback'|'fork_created'|'finding_invalidated'|'skill_shared';
  summary: string;
  linkedObjectIds: string[];
};
```

## 9. Data behavior and integrity

- First read the existing repository's schema, API routes, auth setup, styling stack, and mock fixtures. **Map to what exists; do not overwrite the architecture.**
- For a disconnected backend, ship a deterministic demo mode with the 7-person team and camera-angle case. Prominently label the mode `DEMO DATA`, and never pretend synthesized metrics are measured results.
- Poll or subscribe to backend events, normalize them to `ViewEvent`, and update graph, timeline, inspector, and feed from one source of truth.
- Preserve stable node positions between state changes; animate only new nodes and meaningful relationship changes.
- Show empty, loading, running, failed, completed, and permission-denied states on all major screens.
- Error boundaries around the WebGL scene; allow the rest of the app to work if WebGL fails.
- Source permission status governs cross-team visibility; private personal research memory is not automatically team-visible.
- Distinguish `proposed`, `experimentally tested`, `replicated`, and `human-approved` rather than equating “agent said it” with a discovery.

## 10. Responsive layout

- **≥1280px:** full top bar, left rail, large visualization, right inspector, bottom dock.
- **900–1279px:** rails can collapse; inspector becomes a drawer; dock collapses by default.
- **<900px:** hide 3D by default in favor of searchable 2D research graph/list, bottom nav, full-screen details drawer, and readable timeline. Provide optional 3D view only for capable devices.

Keyboard operability, focus-visible, good contrast for actual text, and accessible graph alternatives are non-negotiable.

## 11. Acceptance criteria — don't stop at a pretty screenshot

1. The app opens to a dark, fluid 3D FRONTIER point-cloud with the specified palette and visible project clusters.
2. Named nodes represent actual graph data; clicking one updates an inspector with its type, evidence, and dependencies.
3. Searching a node focuses it in the graph and opens its inspector.
4. A backend event (or explicitly flagged demo event) creates a new research node with a `blocks`/`depends_on` edge and an event in the timeline.
5. Clicking the event navigates to the correct node and experiment evidence.
6. The research lab displays genuine run state, metrics, code/artifact references, and a clear proposed next experiment if available.
7. Human feedback is visibly linked to a resulting research decision, or honestly shown as awaiting action.
8. Fork Explorer displays two separately sourced research branches and labels any unexecuted branch as `not run`.
9. Team River shares evidence-linked research events with authorized collaborators, with visible authorship and permissions.
10. The graph can be navigated via keyboard-accessible 2D alternative; reduced-motion and no-WebGL fallbacks function.
11. Layout works at 1440px, 1920px and tablet widths with no invisible actions or unreadable text.
12. There are no fake hard-coded statistics presented as live experimental results and no decorative buttons with no handlers.

## 12. Recommended implementation order

**Stage 1 — Visual system and shell**
Theme tokens, app shell, top navigation, sidebar, inspector, timeline, seed data adapters.

**Stage 2 — Signature point-cloud FRONTIER**
Build R3F canvas, deterministic clusters, meaningful nodes and edges, hover/select/focus, LOD, legend, search navigation.

**Stage 3 — Research Lab and evidence**
Experiment state cards, data charts, evidence inspector, artifact viewer, human input, actual backend connection.

**Stage 4 — Fork Explorer and Team River**
Two-lane actual branch comparison, shared team event stream, evidence-backed interventions and reusable-skills UI.

**Stage 5 — 3DGS scene view and flourish**
Actual reconstruction viewer only when real scene artifacts exist; uncertainty overlay, region-click-to-new-question interaction, camera flights and new-node particle formation.

At each stage, run the app, inspect the screen at desktop and tablet widths, click every action, fix console warnings, and confirm the selected node, timeline, and inspector remain synchronized.

## 13. Direct instructions to the implementation agent

1. Read this whole document and inspect the actual project before coding.
2. Build the frontend in **React + TypeScript** using the repository's existing framework; add React Three Fiber/Three.js for the graph.
3. Use the provided colors, sizing, semantics, layout, and interaction rules precisely. Do not replace the point-cloud concept with ordinary circular graph nodes.
4. Keep the immersive visual prominent, but do not sacrifice evidence inspection, usability, and performance.
5. Bind UI to the existing schema via adapters; do not silently invent data or claim unsupported API behavior.
6. Create a deterministic demo dataset only where necessary, clearly marked as demo.
7. Make every visible primary action work; no static facades.
8. Deliver a usable frontend with real routes, loading states, responsive behavior, and an interaction-tested 3D scene.
9. Make the outcome genuinely demonstrable: a new subproblem is discovered, added to FRONTIER, connected to a parent project, assigned or shared with a researcher, and revisited through the timeline.
10. When an integration is unsupported, say what remains unimplemented instead of simulating success.

**North star:** When a research experiment reveals an unknown, the scientist should be able to *see the unknown form as a new point of light*, click it to inspect evidence, discover a teammate's potentially relevant work, launch a new research investigation, and eventually see that result flow back to unblock the original goal.
