import { useParams } from 'react-router-dom';
import {
  Target, ShieldCheck, Clock, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';
import '../styles/researcher-profile.css';

/* ── mock data ── */
const PROFILE = {
  initials: 'SC',
  name: 'Dr. Sarah Chen',
  role: 'Principal Investigator',
  affiliation: 'MIT CSAIL · Neural Radiance Lab',
  hIndex: 34,
  interventions: 28,
  tags: ['NeRF', '3D Gaussian Splatting', 'View Synthesis', 'Depth Estimation', 'Scene Reconstruction'],
};

interface Priority {
  text: string;
  weight: number;
}

const PRIORITIES: Priority[] = [
  { text: 'Maximize novel-view synthesis quality (PSNR, SSIM, LPIPS)', weight: 0.35 },
  { text: 'Reduce training time below 15 min per scene on single GPU', weight: 0.25 },
  { text: 'Maintain geometric accuracy for downstream 3D tasks', weight: 0.20 },
  { text: 'Explore hybrid NeRF+3DGS architectures', weight: 0.12 },
  { text: 'Minimize Gaussian count without quality regression', weight: 0.08 },
];

interface Rule {
  text: string;
  status: 'approved' | 'pending';
}

const RULES: Rule[] = [
  { text: 'Never discard training views — all captured data must be used or explicitly excluded with justification.', status: 'approved' },
  { text: 'Benchmark on Mip-NeRF 360 suite before claiming improvement. Single-scene results are insufficient.', status: 'approved' },
  { text: 'Escalate any dispute unresolved after 48 hours to PI with full evidence chain.', status: 'approved' },
  { text: 'Agents may not modify another agent\'s hypothesis without filing a court dispute.', status: 'approved' },
  { text: 'Allow speculative forks with CFG weight > 1.5 only during designated exploration windows.', status: 'pending' },
];

interface Intervention {
  action: string;
  date: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactLabel: string;
  context: string;
  color: string;
}

const INTERVENTIONS: Intervention[] = [
  { action: 'Raised CFG guidance weight from 1.2 → 1.4', date: 'Oct 16', impact: 'positive', impactLabel: '+0.6 dB avg PSNR', context: 'Exploration phase', color: 'var(--accent-mint)' },
  { action: 'Vetoed opacity reset removal (DSP-042 pending)', date: 'Oct 15', impact: 'neutral', impactLabel: 'Pending test', context: 'Dispute mediation', color: 'var(--accent-amber)' },
  { action: 'Approved logarithmic SH schedule (DSP-036)', date: 'Oct 12', impact: 'positive', impactLabel: '+0.3 dB PSNR', context: 'Dispute resolution', color: 'var(--accent-green)' },
  { action: 'Added depth regularization constraint', date: 'Oct 10', impact: 'positive', impactLabel: '-12% Chamfer dist', context: 'Quality directive', color: 'var(--accent-cyan)' },
  { action: 'Reduced ADC split threshold in low-var regions', date: 'Oct 8', impact: 'positive', impactLabel: '-30% Gaussians', context: 'Efficiency directive', color: 'var(--accent-lavender)' },
  { action: 'Paused Agent Ω-3 during benchmark run', date: 'Oct 6', impact: 'neutral', impactLabel: 'No metric change', context: 'Resource management', color: 'var(--fg-dim)' },
  { action: 'Overruled pose refinement LR (too aggressive)', date: 'Oct 4', impact: 'negative', impactLabel: '-0.2 dB transient', context: 'Emergency override', color: 'var(--accent-red)' },
  { action: 'Initialized research program with 5 priority axes', date: 'Oct 1', impact: 'positive', impactLabel: 'Baseline set', context: 'Program launch', color: 'var(--accent-fuchsia)' },
];

interface StyleMetric {
  label: string;
  value: number;
  color: string;
}

const STYLE_METRICS: StyleMetric[] = [
  { label: 'Intervention Freq', value: 72, color: 'var(--accent-fuchsia)' },
  { label: 'Evidence Reliance', value: 91, color: 'var(--accent-mint)' },
  { label: 'Risk Tolerance', value: 58, color: 'var(--accent-amber)' },
  { label: 'Agent Autonomy', value: 65, color: 'var(--accent-cyan)' },
  { label: 'Dispute Resolution', value: 84, color: 'var(--accent-lavender)' },
  { label: 'Exploration Bias', value: 47, color: 'var(--accent-icy)' },
];

/* ── component ── */
export default function ResearcherProfile() {
  const { researcherId } = useParams();

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div className="rp-label">Researcher</div>
        <h1>Investigator Profile</h1>
        <div className="rp-subtitle">
          Viewing <code>{researcherId ?? 'dr-chen'}</code> — principal investigator
        </div>
      </div>

      <div className="rp-identity">
        <div className="rp-avatar">{PROFILE.initials}</div>
        <div className="rp-identity-info">
          <div className="rp-name">{PROFILE.name}</div>
          <div className="rp-role">{PROFILE.role}</div>
          <div className="rp-affiliation">{PROFILE.affiliation}</div>
          <div className="rp-tags">
            {PROFILE.tags.map(t => (
              <span className="rp-tag" key={t}>{t}</span>
            ))}
          </div>
        </div>
        <div className="rp-identity-stats">
          <div className="rp-identity-stat">
            <span className="rp-identity-stat-value">{PROFILE.hIndex}</span>
            <span className="rp-identity-stat-label">h-index</span>
          </div>
          <div className="rp-identity-stat">
            <span className="rp-identity-stat-value">{PROFILE.interventions}</span>
            <span className="rp-identity-stat-label">Interventions</span>
          </div>
        </div>
      </div>

      <div className="rp-grid">
        <div>
          <div className="rp-section-title">
            <Target size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Research Priorities
          </div>
          <div className="rp-priorities">
            {PRIORITIES.map((p, i) => (
              <div className="priority-item" key={i}>
                <div className="priority-top">
                  <span className="priority-text">{p.text}</span>
                  <span className="priority-weight">{(p.weight * 100).toFixed(0)}%</span>
                </div>
                <div className="priority-bar">
                  <div
                    className="priority-bar-fill"
                    style={{ width: `${(p.weight / 0.35) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="rp-section-title">
            <ShieldCheck size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
            Governance Rules
          </div>
          <div className="rp-rules">
            {RULES.map((r, i) => (
              <div className="rule-item" key={i}>
                <span className={`rule-status ${r.status}`}>{r.status}</span>
                <span className="rule-text">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rp-section-title">
        <Clock size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        Intervention History
      </div>
      <div className="rp-timeline">
        {INTERVENTIONS.map((iv, i) => (
          <div className="intervention-item" key={i}>
            <div className="intervention-marker">
              <div className="intervention-dot" style={{ background: iv.color }} />
              {i < INTERVENTIONS.length - 1 && <div className="intervention-line" />}
            </div>
            <div className="intervention-content">
              <div className="intervention-action">{iv.action}</div>
              <div className="intervention-meta">
                <span>{iv.date}</span>
                <span>{iv.context}</span>
                <span className={`intervention-impact ${iv.impact}`}>
                  {iv.impact === 'positive' && <ArrowUpRight size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />}
                  {iv.impact === 'negative' && <ArrowDownRight size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />}
                  {iv.impact === 'neutral' && <Minus size={10} style={{ display: 'inline', verticalAlign: '-1px' }} />}
                  {' '}{iv.impactLabel}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rp-section-title">
        <BarChart3 size={13} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
        Research Style Metrics
      </div>
      <div className="rp-metrics">
        {STYLE_METRICS.map(m => (
          <div className="metric-item" key={m.label}>
            <span className="metric-label">{m.label}</span>
            <div className="metric-bar">
              <div className="metric-bar-fill" style={{ width: `${m.value}%`, background: m.color }} />
            </div>
            <span className="metric-value">{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
