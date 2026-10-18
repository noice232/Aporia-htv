import { Lightbulb, MessageSquare, Bot, Sparkles } from 'lucide-react'

export function Inspector() {
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
        <p>No active insights yet. Start a research project to see live findings here.</p>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon lavender">
            <MessageSquare size={14} />
          </div>
          <h4>Human Feedback</h4>
        </div>
        <p>Judgments and corrections appear here as you review experiment results.</p>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon cyan">
            <Bot size={14} />
          </div>
          <h4>Active Agents</h4>
        </div>
        <p>No agents running. Agents activate when experiments are in progress.</p>
      </div>

      <div className="inspector-section">
        <div className="inspector-section-title">
          <div className="inspector-icon amber">
            <Sparkles size={14} />
          </div>
          <h4>Recent Findings</h4>
        </div>
        <p>Discoveries and blockers from experiment runs will appear here.</p>
      </div>
    </aside>
  )
}
