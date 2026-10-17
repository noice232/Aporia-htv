# APORIA — Two Autonomous Agents, Human Checkpointed Commits, and Merge Protocol

## 0. Human role and operating principle

The human user is **product owner, not primary coder**. The two agents operate in separate checkouts and write code. User approves design deviations, credentials/provider accounts, reviews diff/tests/screenshots, and **periodically pushes** completed checkpoint commits. Both agents MUST continue through ALL milestone gates G0–G6 until full SRS acceptance, not stop when demo works. No one commits code in this document package; it is the scaffold for agents to implement.

## 1. One-time shared scaffolding — done BEFORE starting two agents

Give a single scaffold agent `09_INITIAL_SCAFFOLD_PROMPT.md`, plus the entire ZIP. It establishes private `aporia` repo, directory structure, pinned deps, `.env.example` (never secrets), build/test scripts, auth/fixture plumbing, OpenAPI contract mirror, typed frontend client, basic Docker/dev run, GitHub Actions lint/typecheck/test, no-project-license copyright/third-party notices, base app/API runnable, and first smoke passing. **Scaffold may contain basic stubs only at G0**; frontend/backend agents then replace with real modules. Initial scaffold commit hash is announced to both agents and pushed by the human.

Scaffold can be done by an agent in fresh checkout. After completion, human checks remote repo is PRIVATE and commits no `.env`, credentials, private paper corpus, or uploaded docs with confidential user work.

## 2. Branch and checkout topology

```
private GitHub: aporia
     main   [immutable shared G0 scaffold commit]
     ├── feat/research-engine    → ../aporia-research    (Agent A)
     └── feat/frontier-ui       → ../aporia-frontier    (Agent B)

integration/g1 → integration/g2 → ... → integration/g6 → main
```

Example commands (run from newly cloned `aporia/` after G0 scaffold pushed):

```bash
git switch main
git pull --ff-only
git worktree add -b feat/research-engine ../aporia-research main
git worktree add -b feat/frontier-ui ../aporia-frontier main
```

Start Agent A in `../aporia-research`, Agent B in `../aporia-frontier`. Agents must never work in the same directory or touch another's owned files. Shared root, `contracts/`, `fixtures/`, CI and `.github` are human/scaffold-controlled. Agents propose changes through `docs/contract-change-requests/` or chat; integrate after approval. **Do not have agents repeatedly reset/rebase concurrently without coordinating with user.**

## 3. Periodic checkpoints — exactly how user pushes

A checkpoint is **a small verified vertical slice**, not a timed promise. Request an update after every meaningful milestone or approximately every 30–60 minutes of agent work. If an agent is blocked, it must report immediately rather than silently implement an incompatible workaround. Agents are allowed to commit locally but not push unless user explicitly delegates.

Agent delivers this brief review packet:

```
Agent: A or B
Checkpoint: A2 / B2 / etc.
Local branch + HEAD SHA:
Completed FR IDs:
Paths changed:
Commands/tests run + actual results:
Screenshots/API evidence (links or paths):
Fixture vs real mode:
Secrets/config requested:
Breaking contract changes? (yes/no and requested diff)
Blocked / risks:
Remaining SRS modules:
Next milestone:
```

Human reviews locally: `git -C ../aporia-research status`, `git -C ../aporia-research log -3 --oneline`, `git -C ../aporia-research diff main...HEAD` (similarly frontend). If acceptable, HUMAN pushes each feature branch:

```bash
git -C ../aporia-research push -u origin feat/research-engine
git -C ../aporia-frontier push -u origin feat/frontier-ui
```

**Do not push unless secrets check and agent tests pass.** If rejected, request a new local commit and repeat. Agents continue in their feature worktrees after approved pushes.

## 4. Integration cadence (no big-bang merge)

At G1, G2, ... after both agents have reached compatible checkpoint, human or designated integration agent creates/updates `integration/gN` from latest integrated commit, merges both branches with `--no-ff` and runs suite. Integration does not need to merge into `main` every milestone: can maintain `integration/progress` until gates pass, but ensure both agents know integration baseline if new contracts landed. Changes from a previous integration gate can be forwarded to feature branches with an explicit user-mediated sync/rebase only; ensure no overwritten work.

Suggested command from main checkout:

```bash
git fetch origin
git switch main
git switch -c integration/g1
git merge --no-ff feat/research-engine
git merge --no-ff feat/frontier-ui
# run make check + make e2e + smoke run
```

At subsequent gate, branch from latest merged integration commit (or advance same `integration/progress` branch) and merge new feature commits. If a merge conflict occurs, assign fix to owner on respective branch, not silent contract rewrites. For CI, prefer GitHub PRs from both features to a protected integration branch, human approves. `main` remains stable and demoable.

## 5. Milestone gates and required shared demonstration

| Gate | Agent A must show | Agent B must show | Merge gate |
|---|---|---|---|
| **G0** | scaffold only | scaffold only | root lint/dev/contract fixtures, private repo |
| **G1** | real papers/projects/graph/events/Tiger migrations/auth | neon semantic paper galaxy, layout, search and source inspector | paper click provenance, live event renders, restart persists |
| **G2** | real Gemini plan, bounded camera experiment, blocker child + agenda | Lab, agenda, event timeline, live metrics | run → measured blocker → new node + queue through API |
| **G3** | live/secured Papiers, compiler, exact score formula, approved action, two runs | Judgment+CFG scoring view, fork explorer, source browser | w=0 vs w>0 traceable and executed or honest pending |
| **G4** | PARALLAX, expertise, team sessions, skills, transfer, truth graph, portfolio | Court, Team, Profile, Portfolio and warnings | two users access team, tested lesson reuse, disputes |
| **G5** | meta trials, secondary evaluator, security/resume hardening | Meta, library, settings, all route tests, visual/perf/a11y | complete FR coverage, error/reconnect/restart tests |
| **G6** | live Gemini + Tiger + Papiers integration checks / docs | judge 4-min flow, WebGL fallback, final visual signoff | full release test suite; main merge; tag v1.0 |

**No deferral trap:** A module absent at G3 is not “cut for hackathon”; it remains required by G5/G6. User may choose an explicit reduced release only through recorded scope change, with accurate completion disclosure.

## 6. Agreement on contract ownership

`contracts/openapi.yaml` and `contracts/fixtures/*.json` start frozen G0. Schema changes requested by A/B go into `docs/contract-decisions.md`: proposed reason, backward compatibility, exact fields/endpoints affected, fixture/consumer tests, user approval. A user-approved contract update is committed on integration and then brought to both feature branches. Do not rewrite event names or `PolicyRun` contract independently. Design components against client types, not invented nested JSON.

## 7. Human decision moments

The human only needs to make decisions at: (1) scope changes (must not silently drop original requirements), (2) credentials/registration and explicit access sharing for Papiers/Gemini/Tiger, (3) proprietary repo/teammate code rights, (4) acceptance of design visual compared to references, (5) disputed science metric definition, (6) reviewed skill/global sharing, (7) release. All routine implementation belongs to agents.

## 8. Security and legal checklist before EACH push

- `.env`, Google key, Papiers session tokens, Tiger DB URL, private corpus notes absent from Git history and diffs; check with secret scanning.
- Third-party libraries retain their license/NOTICE obligations. Don't copy workshop source without verifying grant; treat code as inspiration if unclear.
- User wanted proprietary code: private repo + `All rights reserved` copyright statement, no APORIA MIT LICENSE; dependency MIT notices unaffected. Teammate author rights require explicit agreement.
- Tests and static checks actually pass; screenshots contain no private Papiers details unauthorized for team demo.

## 9. Stop conditions

Agents may stop only on (a) explicit instruction to pause, (b) waiting for human credential or permission, (c) unresolvable infrastructure block reported with actionable steps, or (d) ALL gates G0–G6 passed with acceptance evidence. “The demo looks awesome” is **not** a completion criterion.
