import { Lightbulb, MessageSquare, Bot, Sparkles } from 'lucide-react'
import { useProjectStore } from '../../stores/projects'

export function Inspector() {
  const currentId = useProjectStore((s) => s.currentId)
  const projects = useProjectStore((s) => s.projects)
  const current = projects.find((p) => p.id === currentId)

  return (
    <aside className="inspector-panel">
      <div className="inspector-header">
        <h3>Research Insights</h3>
        <span style={{ fontSize: 10, color: 'var(--accent-mint)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
          LIVE
        </span>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon mint">
            <Lightbulb size={14} />
          </div>
          <h4>Active Insights</h4>
        </div>
        {current ? (
          <p>Monitoring research on <strong>{current.title}</strong>. Agent continuously scans for relevant papers and emerging methods.</p>
        ) : (
          <p>Select a project to see live research insights.</p>
        )}
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon lavender">
            <MessageSquare size={14} />
          </div>
          <h4>Human Feedback</h4>
        </div>
        {current ? (
          <p>Your judgments and redirections steer the CFG guidance weight. Use the Judgment Compiler to add research principles.</p>
        ) : (
          <p>Judgments and corrections appear here as you review experiment results.</p>
        )}
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon cyan">
            <Bot size={14} />
          </div>
          <h4>Active Agents</h4>
        </div>
        {current ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-mint)' }} />
              <span style={{ fontSize: 12 }}>Literature Scanner</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
              <span style={{ fontSize: 12 }}>Hypothesis Generator</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-lavender)' }} />
              <span style={{ fontSize: 12 }}>Experiment Evaluator</span>
            </div>
          </>
        ) : (
          <p>Agents activate when a research project is running.</p>
        )}
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon amber">
            <Sparkles size={14} />
          </div>
          <h4>Recent Findings</h4>
        </div>
        {current ? (
          <>
            <div style={{ fontSize: 12, color: 'var(--fg)', marginBottom: 8, padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 6, borderLeft: '2px solid var(--accent-mint)' }}>
              Identified competing approaches with distinct quality-efficiency tradeoffs
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg)', padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 6, borderLeft: '2px solid var(--accent-cyan)' }}>
              Baseline evaluation complete — proposed method shows efficiency gains
            </div>
          </>
        ) : (
          <p>Discoveries from experiment runs will appear here.</p>
        )}
      </div>
    </aside>
  )
}
