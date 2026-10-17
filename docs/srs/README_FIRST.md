# APORIA — COMPLETE TWO-AGENT SRS / IMPLEMENTATION HANDOFF v3.0

**Purpose:** A specification sufficiently precise to hand to two autonomous coding agents. The user supervises decisions, periodically reviews/commits/pushes, and merges milestones. **No application has been implemented by this deliverable.** The prior v2 handoff was a narrow MVP and must be **discarded as implementation source of truth**.

## Do exactly this

1. Create a new **private** repository `aporia`, no APORIA open-source license by default; preserve third-party notices and agree authorship/ownership with collaborators.
2. Give a scaffolding agent THIS ENTIRE ZIP with `09_INITIAL_SCAFFOLD_PROMPT.md`. Have it commit G0 to `main`; review/push it yourself.
3. Create **two separate Git worktrees** at the SAME G0 commit. Agent A uses `05_AGENT_A_RESEARCH_ENGINE.md`; Agent B uses `06_AGENT_B_FRONTEND.md`.
4. Each agent works to completion across ALL requirements and checkpoints. Every milestone it locally commits and gives you a checkpoint packet. You inspect, approve and PUSH its branch; then integrate verified checkpoints. Do not ask either to "build the whole thing" without test gates; conversely, do not let them end at MVP.
5. Use `08_TEST_MATRIX.md` to judge whether each requirement actually works. For the intended Papiers/Gemini/Tiger prize demonstrations, provide actual authenticated connections; fixtures are not sponsor integrations.

## What changed from v2 / former FORKLINE v1.1

- APORIA is final product name; FRONTIER, PARALLAX, FORK remain subsystem names.
- **Full product scope** now mandatory: 16 functional modules, 13 navigable views, all required endpoints, real scientific runner, real team collaboration, Papiers judgment grounding, Gemini, Tiger, truth maintenance, portfolio and meta-policy.
- **Exact CFG-inspired policy:** two separately evaluated policies on the SAME candidates, `score_guided = score_uncond + w*(score_cond - score_uncond)`, extrapolation w>1, calibrated scores, hard constraints, recorded provenance and experiment forks. Old v1.1 single blended utility is superseded.
- **No 'P2 defer' loophole.** Required modules delivered in phases G0–G6; scaling to all of arXiv/production-grade multi-GPU is separately an infrastructure capacity question.
- **Human does not code backend.** Both lanes owned by coding agents, source-of-truth contract frozen, user periodically reviews/pushes.
- Old long-form v1.1 product and visual specs **preserved and APORIA-renamed** in `reference/` for detailed inspiration; SRS v3 controls if any conflict.

## Reading order

`01_COMPLETE_SOFTWARE_REQUIREMENTS.md` → `02_CFG_GUIDANCE_POLICY.md` → `03_FRONTEND_RENDERING_AND_UX.md` → `04_DATA_AND_EVENT_MODEL.md` → `contracts/openapi.yaml` → lane instructions (`05`/`06`) → `07_MILESTONES_AND_MERGE.md` → `08_TEST_MATRIX.md` → archived references/target PNGs. Contracts are the initial frozen v1 wire schema; schema changes require signoff and coordinated regeneration.

## Packaging map

- `01_...` 16-module full SRS and complete gates
- `02_...` concrete dual-policy guided decision algorithm
- `03_...` 13 screens and point-cloud art/interaction engineering
- `04_...` DB, events, provenance, teams, privacy and audit
- `05_...` Agent A detailed phases
- `06_...` Agent B detailed phases
- `07_...` worktrees, periodic human pushing, merge protocol
- `08_...` traceability and release acceptance
- `09_...` shared scaffold prompt
- `contracts/openapi.yaml` machine-readable API contract
- `contracts/fixtures/` safe deterministic sample objects
- `reference/` long-form renamed legacy specs + actual images

**Key product behavior:** give research objective → evidence-grounded compiler → actual bounded experiment → discover new dependency → obtain meaningful Papiers/human judgment → independently and conditionally score same experiments with configurable CFG-like guidance → run fair experimental fork → use results to update FRONTIER → team shares validated skills → agent improves future methods through trials.

**End condition:** complete working repo is built by agents and passes live/demo gates. This ZIP is a **requirements package**, not a runnable application.
