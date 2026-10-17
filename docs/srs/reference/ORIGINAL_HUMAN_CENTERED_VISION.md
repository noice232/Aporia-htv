# ORIGINAL USER-EDITED CONCEPT REFERENCE (APORIA NAMING)

This is the user-supplied complete original vision, retained as context. APORIA v3 engineering SRS controls contradictory technical details.

# APORIA — The Collective Intelligence Operating System for Scientific Research


**Tagline:** An autonomous research ecosystem where AI scientists and human researchers learn together, discover new problems, conduct experiments, and collectively expand scientific knowledge.


## 1. The Core Idea


Imagine a research team of seven scientists.


Each works on different aspects of a larger project. They read papers, develop hypotheses, run experiments, make mistakes, discover techniques, and gradually develop expertise.


But their knowledge remains fragmented across individual conversations, code repositories, presentations, experiment logs, and personal experience.


APORIA connects all of them into one collective research intelligence.


Every researcher has an AI research partner that understands their scientific judgment and conducts experiments autonomously.


Every agent contributes findings to a shared, evolving scientific knowledge graph called **FRONTIER**.


When one research project encounters a new problem, APORIA creates an investigation to solve it, discovers whether another researcher has relevant knowledge, and coordinates the work across the team.


Every interaction becomes a potential opportunity for the entire system to learn.


**The ultimate goal: Turn independent researchers and AI agents into a coordinated scientific organization that becomes more capable with every investigation.**


---


## 2. The Three Levels of Intelligence


APORIA operates at three levels.


### Level 1 — Individual Research Intelligence


Every researcher has an AI agent that learns their:


- Scientific reasoning style and preferences.
- Areas of expertise.
- Experimental methodologies.
- Research priorities.
- Common questions and objections.
- Past corrections and discoveries.


It gradually learns how that scientist approaches research and can independently apply relevant lessons in future investigations.


It does not simply imitate their personality; it builds a model of their scientific judgment.


### Level 2 — Collective Research Intelligence


Inspired by Shopify River, research activity takes place in shared, access-controlled workspaces.


Agents can observe authorized contributions from the entire team.


When one researcher discovers an effective technique, corrects an experimental mistake, or identifies a new research direction, that contribution can become reusable knowledge for other agents.


The system automatically identifies:


- Relevant discoveries made by other researchers.
- Duplicated or overlapping investigations.
- Shared experimental bottlenecks.
- Opportunities to transfer algorithms across projects.
- Researchers with relevant expertise.
- Research questions that several projects depend upon.


The team develops a collective memory without losing each individual's independent judgment.


### Level 3 — Meta-Research Intelligence


APORIA also studies its own research process.


It evaluates which experiment-selection strategies, research methods, human-collaboration policies, and agent configurations produce useful findings.


It can test competing approaches and improve its future research policy.


**Level 1 learns how an individual researches. Level 2 learns how a team researches. Level 3 learns how to make both better.**


---


## 3. FRONTIER — The Living Scientific Knowledge and Research Graph


FRONTIER is the central intelligence structure of APORIA.


It is not simply a vector database, collection of papers, or knowledge visualization.


It is an **executable scientific dependency graph** representing the research team's current knowledge, uncertainties, hypotheses, ongoing investigations, and future research opportunities.


### What It Contains


Nodes represent:


- Research objectives.
- Problems and subproblems.
- Scientific hypotheses.
- Published papers and algorithms.
- Experimental results.
- Validated and disputed claims.
- Open questions and uncertainties.
- Human insights and corrections.
- Reusable methodologies.
- Individual and team research projects.


Edges represent:


- Supports or contradicts.
- Depends on or blocks.
- Tests or falsifies.
- Derived from.
- Could improve.
- Shares a methodology.
- Requires expertise.
- Solved by.
- Creates a new research problem.


Each node retains its sources, evidence, status, ownership, and relationships to other projects.


### Autonomous Knowledge Frontier Expansion


APORIA doesn't simply receive questions and answer them.


It recognizes when research creates new questions.


Suppose a researcher wants an algorithm that determines the best camera angle for a photograph.


APORIA begins investigating novel-view rendering using 3D Gaussian Splatting (3DGS).


It discovers that promising viewpoints expose previously unobserved parts of the scene.


This becomes a new problem:


**How can the missing regions be completed while maintaining geometric and perceptual consistency?**


APORIA creates a new FRONTIER research node.


Before attempting to invent a solution, it searches existing scientific literature and the team's research memory.


It identifies relevant approaches, including geometry-aware diffusion inpainting.


If the available techniques are insufficient, it defines experiments to investigate the unresolved limitation.


The new research project becomes a dependency of the original camera-angle investigation.


Once the subproblem produces a validated result, APORIA integrates the result back into its parent project and continues.


**Research recursively generates research, and solved subproblems unlock their parent investigations.**


---


## 4. Autonomous Research Engine


APORIA runs actual experiments rather than only generating research suggestions.


Each research cycle follows:


1. Retrieve relevant context from FRONTIER, Papiers, and previous experiments.
2. Generate hypotheses grounded in existing evidence.
3. Design falsifiable experiments and evaluation metrics.
4. Execute experiments using code, models, simulations, or suitable research tools.
5. Evaluate results against baselines.
6. Challenge interpretations and inspect failures.
7. Determine whether the problem is solved, should be refined, or has revealed another research dependency.
8. Select and execute the next research step.
9. Update FRONTIER and shared research memory.


This loop can operate across multiple interconnected projects.


APORIA can pause an investigation when a prerequisite is unresolved, execute independent branches in parallel, and automatically resume blocked investigations when dependencies become available.


---


## 5. Recursive Research Discovery and Prioritization


APORIA maintains a continuously evolving portfolio of research questions.


The system can discover new questions through experimental failures, contradictory evidence, missing algorithms, unexpected observations, and unexplained results.


But discovering an unanswered question is not enough.


It must determine whether pursuing that question is valuable.


The Research Portfolio Engine ranks candidate investigations using:


- Expected impact on the original objective.
- Number and importance of downstream projects unlocked.
- Expected information gain.
- Scientific uncertainty.
- Available evidence and reusable methods.
- Computational and human resource requirements.
- Researcher priorities.
- Probability of obtaining an informative result.


This enables the system to recognize when one fundamental problem is blocking several seemingly unrelated projects.


Instead of independently solving the same issue multiple times, APORIA creates a shared research effort.


**The system learns not only how to answer research questions, but which questions are worth investigating.**


---


## 6. Researcher Personality and Scientific Intuition


Each agent builds a persistent scientific profile of its human collaborator.


It learns from the researcher's papers, annotations, feedback, past experiments, decisions, and conversations.


For example, a researcher repeatedly rejects model improvements that sacrifice robustness for small gains in average accuracy.


APORIA extracts a scoped principle:


"When evaluating performance improvements, examine whether the gains remain valid under relevant distribution shifts."


In future experiments, the agent can independently apply that principle without requiring the researcher to repeat it.


The profile separates:


**Preferences:** What the researcher values or wants to optimize.


**Expertise:** What subjects and methodologies they understand.


**Scientific principles:** Generalizable methodological lessons supported by evidence.


**Assumptions:** Beliefs that may require additional verification.


**Uncertainty:** Situations where the agent cannot reliably infer the researcher's judgment.


These profiles remain individual even when team knowledge is shared.


One scientist's preferences do not automatically become another scientist's preferences.


---


## 7. CFG-Inspired Scientific Guidance


APORIA introduces a research-policy mechanism inspired by classifier-free guidance (CFG).


The purpose is to distinguish two sources of research direction:


**Independent Research Policy:** Selects investigations based on experimental evidence, uncertainty, scientific value, and available resources.


**Human-Aligned Research Policy:** Incorporates the researcher's learned priorities, reasoning patterns, and methodological preferences.


A configurable guidance mechanism determines how much influence human preferences should have over a particular research decision.


Unlike actual diffusion-model CFG, research policies cannot simply be assumed to combine meaningfully through vector arithmetic.


APORIA would instead compare or rerank candidate research actions using the two policies.


For example:


- Higher human influence emphasizes the researcher's preferred evaluation criteria.
- Lower human influence gives independent exploration more freedom.
- Critical methodological or safety constraints remain enforced regardless of preference weight.


Over time, APORIA tests which guidance settings produce better research outcomes across different contexts.


**The goal is to learn when human intuition improves investigation and when independent scientific criticism is necessary.**


---


## 8. PARALLAX — The Scientific Disagreement Engine


Research agents shouldn't blindly trust themselves or their human collaborators.


APORIA therefore uses structured scientific disagreement.


Specialized agents can take complementary roles:


**Investigator:** Proposes hypotheses and experiments.


**Skeptic:** Searches for alternative explanations, unsupported assumptions, and contradictions.


**Methodologist:** Evaluates whether experiments meaningfully test the stated claims.


**Researcher-Aligned Agent:** Introduces relevant human priorities and methodological lessons.


Disagreements generate testable questions.


Instead of deciding who is correct through an AI debate, the system identifies what evidence could distinguish the competing explanations.


When the available evidence is insufficient, the disagreement remains unresolved within FRONTIER.


This is important because an agent's confidence is not scientific proof.


---


## 9. Human Expertise and Collaboration


APORIA continuously evaluates whether a human could materially improve an investigation.


When appropriate, it asks a targeted question accompanied by relevant evidence.


For example:


"A new reconstruction method improves perceptual quality but introduces inconsistencies between viewpoints. Should this investigation prioritize single-frame realism or geometric consistency across views?"


The researcher can:


- Answer the question.
- Challenge the agent's interpretation.
- Change the objective.
- Propose an alternative experiment.
- Introduce new domain knowledge.
- Redirect the investigation.
- Request additional evidence.


The agent updates its research plan accordingly.


While awaiting feedback, other independent investigations can continue.


### Expertise Routing


APORIA also knows which collaborators may be qualified to help.


It maintains an expertise graph derived from volunteered expertise, prior work, and validated contributions.


When an agent encounters an unfamiliar problem, it can identify a relevant team member, prepare a concise evidence packet, and request their input.


The system does not need every researcher to personally monitor every investigation.


---


## 10. Collective Research Intelligence — Inspired by Shopify River


This is a fundamental part of APORIA, not an optional collaboration feature.


Shopify's River demonstrates the value of running agent interactions in shared workspaces where other employees can observe, intervene, and reuse successful techniques.


APORIA adapts this philosophy specifically for scientific research.


### Shared Research Sessions


Every authorized team member can observe ongoing research sessions, including:


- Agent hypotheses.
- Experimental decisions.
- Code changes.
- Experimental evidence.
- Failed approaches.
- Human corrections.
- Newly discovered research questions.
- Proposed next steps.


A researcher can join another agent's investigation and contribute expertise without restarting the process.


### Collective Learning


When a researcher or agent discovers something useful, APORIA evaluates whether it represents reusable knowledge.


Examples include:


- A methodological correction.
- An experimental configuration that works.
- A previously overlooked confounding variable.
- A new evaluation procedure.
- A useful research strategy.
- A newly discovered dependency.
- A reproducible scientific finding.


Candidate lessons are converted into versioned research skills or knowledge-graph updates.


Future agents can retrieve and apply these lessons.


The system becomes more capable without requiring the underlying language model to be retrained after every interaction.


### Three-Layer Research Memory


**Personal memory:** Private or researcher-specific preferences, reasoning styles, and work context.


**Team memory:** Shared experiments, findings, methodological corrections, and research dependencies.


**Global memory:** Explicitly shared, appropriately validated findings and reusable research skills accessible to a wider research community.


All memory has provenance, validation status, and access controls.


Human feedback does not automatically become established scientific truth.


### Collective Research Coordination


APORIA uses shared memory to coordinate team research actively.


It can detect duplicate experiments, identify related problems, reuse findings, and suggest collaboration.


Rather than simply notifying people of what their colleagues have done, the system uses that information to change future research decisions.


**The team becomes a coordinated research network rather than seven isolated researchers using seven separate AI agents.**


---


## 11. Example: A Seven-Person Computer Vision Research Team


Imagine a seven-person research team investigating related computer-vision and generative-model problems.


Their work is divided across:


- **Researcher A:** 3D Gaussian Splatting and reconstruction.
- **Researcher B:** FLUX training and diffusion-model adaptation.
- **Researcher C:** Video generation and temporal consistency.
- **Researcher D:** Evaluation methodologies.
- **Researcher E:** Diffusion acceleration and distillation.
- **Researcher F:** Novel-view generation and camera optimization.
- **Researcher G:** Geometry-aware conditioning and scene completion.


Each scientist has an autonomous research agent connected to the same authorized FRONTIER workspace.


### Stage 1 — A New Problem Is Discovered


Researcher F's agent is optimizing camera viewpoints.


It discovers that many promising viewpoints expose missing regions in the reconstruction.


The agent creates a research question:


"Can geometry-aware inpainting improve completion of unobserved regions while preserving multi-view consistency?"


### Stage 2 — Collective Knowledge Retrieval


FRONTIER discovers that Researcher B previously investigated FLUX-based image editing and that Researcher G has experiments involving geometric conditioning.


It retrieves relevant findings, methodologies, and experimental artifacts.


Instead of starting from scratch, the agent proposes experiments combining previously investigated techniques.


### Stage 3 — Expertise Routing


The agent asks Researcher G whether a particular geometric representation is suitable for conditioning the inpainting model.


Researcher G challenges one assumption and suggests an alternative experimental configuration.


This correction is recorded and becomes available to other authorized agents.


### Stage 4 — Autonomous Experimentation


The agents execute competing configurations and evaluate outcomes.


Researcher D's prior evaluation lessons are retrieved to ensure that the improvement is measured consistently across multiple views rather than judged on one attractive frame.


### Stage 5 — New Knowledge Is Produced


One approach produces a measurable improvement under the chosen evaluation protocol.


APORIA records the result, associated uncertainty, code configuration, and human contributions.


The newly validated technique becomes a candidate reusable research component.


### Stage 6 — Return to the Parent Objective


The camera-angle research agent integrates the technique and reruns its original investigation.


The system can now evaluate viewpoints that were previously difficult to reconstruct.


### Stage 7 — Collective Improvement


Other agents working on scene completion or video consistency are notified that the method may be relevant to their problems.


The agent proposes transfer experiments rather than assuming the result generalizes automatically.


**One researcher's obstacle leads to a collaboration, produces an independently tested technique, and creates new opportunities for the entire team.**


---


## 12. APORIA — Counterfactual Research Branching


Every consequential human intervention can create a research fork.


**Branch A:** What the autonomous agent would have investigated without the intervention.


**Branch B:** What it investigates after incorporating human feedback.


Both branches can execute experiments from a shared checkpoint.


The system compares:


- Hypotheses.
- Experiment selection.
- Methodology.
- Resource use.
- Measured outcomes.
- Conclusions.
- Downstream research dependencies.


This provides evidence of how human collaboration changed the scientific process.


It can also reveal interventions that did not improve the result.


### Scientific Time Machine


Researchers can revisit previous decisions and launch alternative investigations.


For example:


"What if we'd prioritized geometric consistency before perceptual quality?"


APORIA restores a suitable research checkpoint, changes the experimental objective, and executes an alternate branch where possible.


The result is a research debugger that helps humans understand how scientific decisions influence the direction of discovery.


---


## 13. Cross-Project Knowledge Transfer


APORIA continuously searches for discoveries that may benefit other investigations.


A method developed for temporal consistency in video generation might be applicable to consistency between novel viewpoints.


An evaluation principle learned during one model-training experiment might help identify misleading improvements in another.


APORIA recognizes potential relationships through the knowledge graph and retrieval systems.


It then formulates a transfer hypothesis and tests whether the method works in the new context.


If the result is valid, the graph records a reusable connection between the projects.


**A scientific breakthrough should not remain confined to the experiment where it originated.**


---


## 14. Scientific Truth Maintenance


APORIA must be capable of revising its beliefs.


Suppose several research projects depend on a finding that a particular method improves geometric consistency.


Later, a replication experiment reveals that the original evaluation contained a flaw.


APORIA identifies every downstream conclusion that depends on the flawed finding.


It marks those conclusions for reassessment and proposes experiments to verify whether they remain valid.


The system tracks distinctions between:


- Proposed hypotheses.
- Preliminary evidence.
- Replicated findings.
- Disputed claims.
- Rejected hypotheses.
- Invalidated experimental results.


This prevents shared memory from becoming an accumulation of plausible but unverified claims.


---


## 15. Meta-Autoresearch — Improving the Scientist


APORIA doesn't limit experimentation to external scientific problems.


It also evaluates its own research strategies.


For example, it could investigate whether a particular problem benefits more from:


- Incremental optimization.
- Broad exploration.
- Hypothesis falsification.
- Independent multi-agent criticism.
- Early human intervention.
- Reusing historical research lessons.
- Prioritizing high-impact research dependencies.


The system can compare these approaches under controlled experimental budgets and evaluate whether they produce more useful scientific results.


Successful strategies become reusable, versioned research skills.


Unsuccessful strategies can be revised or deprecated.


The research policy improves through evidence rather than simply accumulating longer system prompts.


**APORIA researches how to become a better researcher.**


---


## 16. The Agentic Infrastructure


APORIA uses a modular agentic architecture inspired partly by Shopify River's underlying infrastructure.


### Durable Research Sessions


Each investigation has a persistent session identity and event history.


Agent decisions, experimental configurations, outputs, human interventions, and failures are recorded.


An interrupted experiment can be resumed using its saved state and artifacts rather than relying entirely on conversation memory.


### Agent Harness


A central harness coordinates:


- Hypothesis generation.
- Research planning.
- Tool invocation.
- Experiment scheduling.
- Human interaction.
- Evidence evaluation.
- Memory retrieval.
- Research prioritization.
- Branching and checkpointing.


The agent's decision-making process is separate from the environment in which executable code runs.


### Sandboxed Experiment Execution


Experiments execute in isolated, reproducible environments where practical.


Their code versions, parameters, datasets, metrics, and artifacts are stored so other researchers can inspect and reproduce results.


### Model Context Protocol (MCP)


MCP provides a standard way to connect agents with supported external tools and research resources.


Potential integrations include:


- Paper and literature retrieval.
- GitHub repositories.
- Python experiment runners.
- Research databases.
- Model-evaluation services.
- GPU infrastructure.
- Internal tools with authorized access.


### Specialized Agent Profiles


Investigator, skeptic, methodologist, literature researcher, experiment runner, and knowledge-curation roles share the same underlying infrastructure.


Different agent capabilities are configured as profiles rather than requiring a new platform for each role.


### GraphRAG


Graph Retrieval-Augmented Generation (GraphRAG) retrieves relationships between evidence, hypotheses, research problems, researchers, and experimental dependencies.


Vector similarity helps discover relevant material, but structured relationships determine whether one finding supports, contradicts, or unblocks another.


---


## 17. Papiers Integration


Papiers acts as a source of researcher reading and thinking context.


APORIA can use its supported CLI to retrieve:


- Relevant papers.
- Saved passages.
- Highlights.
- Annotations and notes.
- Equations.
- Previous reading conversations.


This information helps the research agent understand what an individual has studied, questioned, or considered important.


APORIA distinguishes active human judgment from merely saving a paper.


The experiment database and shared FRONTIER graph remain the primary stores for generated research outputs.


The currently documented Papiers CLI is read-only, so writing findings back into Papiers would require a separately supported interface. The architecture does not depend on unsupported write operations.


---


## 18. The Visual Interface


APORIA provides a unified interface for both individual and collective research.


### FRONTIER Universe


An interactive two-dimensional or three-dimensional representation of scientific knowledge, unresolved questions, research dependencies, and discoveries.


Researchers can navigate and directly influence the research graph.


### Research Timeline


A live view of agent hypotheses, experiments, results, human feedback, and autonomous decisions.


### Team Research Workspace


A shared environment where multiple researchers and agents collaborate on the same investigation.


### Researcher Profile


An inspectable view of each researcher's learned methodologies, preferences, and scientific judgment.


### Research Portfolio


A prioritized list of ongoing investigations, blockers, research opportunities, and predicted downstream value.


### Scientific Court


A structured interface for competing hypotheses, alternative explanations, and proposed experiments.


### Fork Explorer


Side-by-side research trajectories showing the effects of human intervention or alternative methodological decisions.


### Evidence Inspector


Direct access to underlying experiment configurations, logs, code, metrics, supporting literature, and uncertainty assessments.


---


## 19. The Core Research Loop


The entire platform operates through one continuous system:


1. **Human objective:** A scientist or team provides a broad research goal.
2. **Scientific compilation:** APORIA translates it into testable hypotheses and measurable experiments.
3. **Knowledge retrieval:** FRONTIER and Papiers identify relevant research, history, and human judgment.
4. **Autonomous investigation:** Agents conduct experiments and evaluate evidence.
5. **Scientific criticism:** Competing interpretations are challenged.
6. **Research discovery:** Experiments create new questions and expose unresolved dependencies.
7. **Portfolio prioritization:** APORIA decides which research problems are most valuable to investigate.
8. **Collective intelligence:** Shared memory identifies relevant work and expertise across the team.
9. **Human collaboration:** Agents request guidance or researchers intervene directly.
10. **Counterfactual evaluation:** Research forks reveal the consequences of important decisions.
11. **Knowledge integration:** Validated discoveries become reusable methods and update dependent projects.
12. **Meta-learning:** APORIA evaluates and improves the strategies used to conduct research.


Then the cycle repeats.


---


## 20. What Makes APORIA Different?


APORIA combines capabilities that are usually treated as separate systems.


**Recursive Research Discovery:** Research autonomously creates new research projects.


**Executable Scientific Frontier:** The knowledge graph represents real experimental dependencies and can drive future actions.


**Individual Scientific Intuition:** Agents learn methodological judgment from human researchers.


**CFG-Inspired Guidance:** Human preferences influence decisions without replacing independent evaluation.


**Scientific Disagreement:** Competing interpretations are tested through evidence.


**Collective Intelligence:** Lessons from one researcher become reusable by other authorized agents.


**Cross-Project Transfer:** Discoveries can unlock seemingly unrelated investigations.


**Counterfactual Research:** The contribution of human judgment can be compared through actual experimental branches.


**Truth Maintenance:** New evidence can invalidate and revise earlier findings across the research graph.


**Meta-Autoresearch:** The system improves the process by which it conducts research.


The innovation is not merely having all these tools.


It is **making them operate as one continuous learning system where scientific experiments, human expertise, and collective research memory improve one another.**


---


## 21. Long-Term Vision


Today, researchers use AI tools to perform individual tasks.


APORIA proposes a different relationship.


A scientist doesn't simply prompt an AI. They develop an ongoing research partnership.


A team doesn't simply share papers and meeting notes. It develops a collective, evidence-backed scientific memory.


An autonomous agent doesn't simply optimize an assigned experiment. It identifies unresolved problems, creates new investigations, discovers connections across projects, and evaluates which questions are worth solving.


The system doesn't simply get better at answering prompts. It improves its research policies through repeated experimentation and collaboration.


As researchers join, new expertise becomes available.


As experiments accumulate, the scientific frontier evolves.


As contradictions emerge, previous conclusions are reassessed.


As methods are discovered, they become reusable tools for future investigations.


### Final Pitch


**APORIA is a multiplayer autonomous research operating system where every scientist has an AI research partner, every experiment contributes to a shared scientific frontier, and every meaningful human correction can improve future research.**


**It autonomously discovers research problems, coordinates humans and agents to investigate them, transfers findings across projects, and learns how to become a better scientific collaborator over time.**


*Shopify River makes software-development knowledge compound across teams. APORIA aims to make scientific discovery compound across entire research organizations.*