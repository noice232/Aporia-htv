# APORIA — External integrations, engineering decisions, and scope reconciliation

## 1. Vendor and public code references

| System | Source/reference | Required use | Critical note |
|---|---|---|---|
| Gemini API | https://ai.google.dev/gemini-api/docs/structured-output | Server-side structured scientific plans, judgment compilation and optional dual-score rubric scoring | Agent must verify installed SDK and model name and demonstrate **real** live inference. No Gemini model output is evidence of an experiment result. |
| Papiers | https://papiers.ai/docs and https://wiki.papiers.ai/docs/agents | Authorized reading history/notes/highlights to condition human scientific judgment and build evidence packets | Treat CLI as read-only unless exact installed supported write API documented; request consent and persist output separately. |
| Tiger Data | https://www.tigerdata.com/docs/reference/timescaledb/hypertables and https://www.tigerdata.com/docs/reference/timescaledb/continuous-aggregates | Hosted PostgreSQL relational + Timescale hypertable events/metrics, live aggregate analytics | Current Tiger versions differ in hypertable CREATE syntax; pin/test against actual deployment. Materialized continuous aggregates may not include newest rows automatically. |
| cosmos.gl | https://github.com/cosmosgl/graph and https://cosmograph.app/docs-lib/ | MIT-licensed GPU graph layout/interaction; import into Three.js scene where feasible | Prefer positions + Three.js rendering to duplicated expensive canvases. Preserve dependency license notices. |
| Cosmograph sample | https://run.cosmograph.app/public/ca9fd1ad-fe83-4238-8b69-b707c633aef0 | Interaction/cluster density benchmark | Treat as visual behavior inspiration, not blanket permission to copy restricted application source. |
| Paperscape | https://paperscape.org/ | One paper = one semantic point, scientific cluster semantics | Avoid assuming its hosted corpus/data is freely redistributable; ingest own permitted arXiv/OpenAlex subset. |
| Three.js | https://threejs.org/docs/ | Custom point sprites, depth, controls, glow and rendering | Shader, picking and WebGL fallback implemented, not static visualization image. |
| arXiv | https://info.arxiv.org/help/api/user-manual.html | Literature source, canonical arXiv paper IDs | Respect API rate limits, identifiers and source provenance. |
| OpenAlex | https://docs.openalex.org/ | Paper metadata, citations, topic/concept graph | Respect current API/registration/rate limits, source terms, staleness and data quality. |
| Karpathy autoresearch | https://github.com/karpathy/autoresearch | Inspiration for disciplined hypothesis → code/eval → metric → keep/discard loop | Do not imply originality of basic autoresearch loop. Preserve notices for any incorporated licensed code. |
| Saeejith workshop | https://github.com/saeejithnair/hack-the-valley-autoresearch | CPU-sized experiment budget, hypotheses, human question baseline | Not an APORIA monorepo scaffold; check license before any copy. |
| Shopify River | https://shopify.engineering/under-the-river | Shared sessions, durable harness/sandbox/skills and team-learning design | Conceptual inspiration, not an API or product dependency. |

## 2. Architectural decision records

**ADR-001: New APORIA repo, don't fork workshop as application.** Workshop's CPU language model is narrowly focused; adapt *experimental discipline*, not structure. Private project with third-party notices and appropriate team ownership agreement.

**ADR-002: Gemini as replaceable first-choice provider.** Use provider interface and enabled Gemini live in judged demo; if unavailable, show error/fixture explicitly. Does not hardwire public Gemini provider into business logic.

**ADR-003: Tiger Data as production-demo store.** Postgres semantics for relational research graph, Timescale hypertables for append-only events and metric samples; local fallback for dev, labeled. Implement migration tests on actual version.

**ADR-004: Papiers as first-class, optional AUTHENTICATION but mandatory product capability.** If no user's Papiers content connected, agent can take direct feedback; must not claim a Papiers-backed result. No unsupported writing to their service.

**ADR-005: FRONTIER research nodes distinct from paper and decorative particles.** Semantic paper points map 1:1 to source; research problems actions have provenance; cosmetic dust has no semantic ID.

**ADR-006: CFG policy implemented as per-candidate extrapolated two-score action selection.** Normative exact equation in 02; score calibration and scientific hard constraints; no automatic personality belief as truth.

**ADR-007: Full SRS, incremental milestones.** All 16 modules required; G0–G6 are staged release gates, not permission to omit G4/G5. Avoid claiming ability to ingest all of arXiv or conduct all domains of science from one hackathon sprint.

**ADR-008: Human owns integration cadence.** Two agents commit locally and deliver checkpoint proof; user periodically pushes to remote after review, merges via integration branch, can reject changes. No simultaneous agent code writing to shared checkout.

## 3. What was wrong with earlier PRDs / updated resolution

- **Earlier flaw:** 13 KB v2 PRD was high-level, agents had to invent behavior. **Change:** FR-ID software requirements, UX per page, DB schema, 74 API operations, CFG equations, acceptance matrix.
- **Earlier flaw:** 'P1 stretch'/'P2 defer' omitted defining original vision (River, meta, truth maintenance). **Change:** all retained as required bounded functional modules G0–G6.
- **Earlier flaw:** weighted average guidance only w∈[0,1] and no dual-planner score records. **Change:** discrete CFG-style extrapolation `s_u + w(s_c-s_u)`, w>1 and complete audit/tests.
- **Earlier flaw:** user assigned to code backend. **Change:** two coding agents; human handles product decisions, API/branch review and periodic pushes.
- **Earlier flaw:** FORKLINE and APORIA documents might conflict. **Change:** APORIA v3 authoritative; legacy original copied with new name only as reference.
- **Earlier flaw:** geometry experiment could be interpreted as full 3DGS SOTA. **Change:** real bounded coverage proxy + correct metric labeling, pluggable secondary real evaluator, no invented PSNR/3DGS claims.
- **Earlier flaw:** sponsor tech merely named. **Change:** provider interfaces + explicit test evidence of real Gemini/Tiger/Papiers usage.
- **Earlier flaw:** black-box proprietary concerns. **Change:** private APORIA repo, no APORIA MIT by default, scoped source access and team rights documented. Idea alone remains separately subject to IP law; do not make claims of exclusive monopoly over the concept.

## 4. Product change control

A modification that reduces scope must be a HUMAN-signed `SCOPE_CHANGE.md` describing omitted FR IDs, user-facing impact, remaining acceptance failures and demo truthfulness. Agent discretion to silently skip scope is prohibited. Technical simplifications that preserve FR acceptance are allowed and encouraged; avoid unnecessary swarm orchestration, but no functionality can be faked. For unreached external credentials, status is `blocked-on-owner` not `complete`.
