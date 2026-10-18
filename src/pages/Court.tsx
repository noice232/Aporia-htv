import { useState } from 'react';
import {
  Scale, FileText, AlertTriangle, CheckCircle2,
  ChevronDown, Eye, FlaskConical,
  Gavel, Shield
} from 'lucide-react';
import '../styles/court.css';

/* ── mock data ── */
const STATS = [
  { label: 'Active', value: 4, icon: Scale, cls: 'active' },
  { label: 'Resolved', value: 11, cls: 'resolved', icon: CheckCircle2 },
  { label: 'Evidence Items', value: 38, cls: 'evidence', icon: FileText },
  { label: 'Escalated', value: 1, cls: 'escalated', icon: AlertTriangle },
];

interface Dispute {
  id: string;
  title: string;
  status: 'active' | 'resolved' | 'escalated';
  date: string;
  claimant: string;
  respondent: string;
  claim: string;
  evidenceCount: number;
}

const ACTIVE_DISPUTES: Dispute[] = [
  {
    id: 'DSP-042',
    title: 'Gaussian Opacity Reset Degrades Novel-View PSNR',
    status: 'active',
    date: '2025-10-16',
    claimant: 'Agent Σ-7 (3DGS Specialist)',
    respondent: 'Agent Ω-3 (Optimization)',
    claim: 'Periodic opacity reset (every 3k iter) causes transient PSNR drops of 1.2–1.8 dB on Mip-NeRF 360 scenes. The recovery phase wastes 15% of total training budget.',
    evidenceCount: 7,
  },
  {
    id: 'DSP-041',
    title: 'NeRF Distillation Loses High-Frequency Detail',
    status: 'active',
    date: '2025-10-15',
    claimant: 'Agent Δ-2 (Rendering)',
    respondent: 'Agent Σ-7 (3DGS Specialist)',
    claim: 'Teacher→student distillation from NeRF to 3DGS drops LPIPS by 0.04 on specular surfaces. Fine hair and fur regions show visible aliasing in the student model.',
    evidenceCount: 5,
  },
  {
    id: 'DSP-039',
    title: 'Depth Regularization Conflicts with Floater Pruning',
    status: 'escalated',
    date: '2025-10-14',
    claimant: 'Agent Ω-3 (Optimization)',
    respondent: 'Agent Δ-2 (Rendering)',
    claim: 'Monocular depth loss pulls Gaussians toward surfaces while floater pruning removes low-opacity splats, creating a feedback loop that hollows out thin structures.',
    evidenceCount: 9,
  },
  {
    id: 'DSP-038',
    title: 'Adaptive Density Control Over-Splits in Textureless Regions',
    status: 'active',
    date: '2025-10-13',
    claimant: 'Agent Λ-1 (Geometry)',
    respondent: 'Agent Σ-7 (3DGS Specialist)',
    claim: 'ADC threshold of 0.0002 gradient magnitude triggers unnecessary splits in sky/wall regions, inflating Gaussian count by 40% without SSIM improvement.',
    evidenceCount: 4,
  },
];

const RESOLVED_DISPUTES: Dispute[] = [
  {
    id: 'DSP-036',
    title: 'SH Degree Warm-Up Schedule is Sub-Optimal',
    status: 'resolved',
    date: '2025-10-11',
    claimant: 'Agent Δ-2 (Rendering)',
    respondent: 'Agent Ω-3 (Optimization)',
    claim: 'Linear SH degree increase (0→3 over 1k steps) underperforms logarithmic schedule. Resolved: logarithmic adopted, +0.3 dB average PSNR.',
    evidenceCount: 6,
  },
  {
    id: 'DSP-034',
    title: 'Camera Pose Refinement Diverges on Forward-Facing Scenes',
    status: 'resolved',
    date: '2025-10-09',
    claimant: 'Agent Λ-1 (Geometry)',
    respondent: 'Agent Δ-2 (Rendering)',
    claim: 'Joint pose-radiance optimization on LLFF scenes produces 2–5° rotation drift. Resolved: learning rate clamped to 1e-5 after 10k iterations.',
    evidenceCount: 8,
  },
  {
    id: 'DSP-031',
    title: 'Anti-Aliasing Mip Filter Slows Rendering 3×',
    status: 'resolved',
    date: '2025-10-06',
    claimant: 'Agent Ω-3 (Optimization)',
    respondent: 'Agent Σ-7 (3DGS Specialist)',
    claim: 'EWA splatting filter for anti-aliasing reduces FPS from 180 to 60. Resolved: approximation via pre-filtered 2D covariance accepted.',
    evidenceCount: 3,
  },
];

const TESTS = [
  {
    name: 'Opacity Reset A/B',
    hypothesis: 'Removing periodic reset maintains PSNR within 0.1 dB while saving 15% training time.',
    metric: 'PSNR / Train-time',
    cost: '~4 GPU-hr',
    resolves: 'DSP-042',
  },
  {
    name: 'Depth vs. Pruning Ablation',
    hypothesis: 'Decoupled scheduling (depth loss off during pruning phases) prevents hollow-structure artifacts.',
    metric: 'Chamfer Dist.',
    cost: '~6 GPU-hr',
    resolves: 'DSP-039',
  },
  {
    name: 'ADC Gradient Threshold Sweep',
    hypothesis: 'Raising split threshold to 0.0005 in low-variance regions reduces Gaussian count 30% with <0.01 SSIM loss.',
    metric: 'Count / SSIM',
    cost: '~2 GPU-hr',
    resolves: 'DSP-038',
  },
];

const PROTOCOL_STEPS = [
  'Claimant files dispute with quantitative claim and supporting evidence.',
  'Respondent submits counter-evidence within 48 hours.',
  'Discriminating test is proposed by neutral agent or PI.',
  'Test executed in isolated environment; results logged immutably.',
  'Ruling issued. If unresolved, escalation to PI with veto power.',
];

/* ── component ── */
export default function Court() {
  const [showResolved, setShowResolved] = useState(false);

  return (
    <div className="court-page">
      <div className="court-header">
        <div className="court-label">Deliberation</div>
        <h1>Adversarial Court</h1>
        <div className="court-subtitle">
          Structured dispute resolution · claim → evidence → discriminating test → ruling
        </div>
      </div>

      <div className="court-stats">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div className="court-stat" key={s.label}>
              <div className={`court-stat-icon ${s.cls}`}>
                <Icon size={18} />
              </div>
              <div className="court-stat-info">
                <span className="court-stat-value">{s.value}</span>
                <span className="court-stat-label">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="court-body">
        <div>
          <div className="court-section-title">
            Active Disputes <span className="count">{ACTIVE_DISPUTES.length}</span>
          </div>

          <div className="court-disputes">
            {ACTIVE_DISPUTES.map(d => (
              <DisputeCard key={d.id} dispute={d} />
            ))}
          </div>

          <button
            className="court-resolved-toggle"
            onClick={() => setShowResolved(v => !v)}
          >
            <ChevronDown size={14} className={`chevron ${showResolved ? 'open' : ''}`} />
            Resolved Disputes ({RESOLVED_DISPUTES.length})
          </button>

          {showResolved && (
            <div className="court-resolved">
              {RESOLVED_DISPUTES.map(d => (
                <DisputeCard key={d.id} dispute={d} />
              ))}
            </div>
          )}
        </div>

        <div className="court-sidebar">
          <div className="tests-panel">
            <div className="tests-panel-title">
              <FlaskConical size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Discriminating Tests
            </div>
            {TESTS.map(t => (
              <div className="test-item" key={t.name}>
                <div className="test-name">{t.name}</div>
                <div className="test-hypothesis">{t.hypothesis}</div>
                <div className="test-meta">
                  <span className="test-meta-item metric">{t.metric}</span>
                  <span className="test-meta-item">{t.cost}</span>
                  <span className="test-meta-item">{t.resolves}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="protocol-panel">
            <div className="protocol-panel-title">
              <Gavel size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Resolution Protocol
            </div>
            {PROTOCOL_STEPS.map((step, i) => (
              <div className="protocol-step" key={i}>
                <span className="protocol-num">{i + 1}</span>
                <span className="protocol-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DisputeCard({ dispute: d }: { dispute: Dispute }) {
  return (
    <div className="dispute-card">
      <div className="dispute-card-top">
        <span className={`dispute-status ${d.status}`}>{d.status}</span>
        <span className="dispute-date">{d.date}</span>
      </div>
      <div className="dispute-title">{d.title}</div>
      <div className="dispute-parties">
        <span>{d.claimant}</span>
        <span className="dispute-vs">VS</span>
        <span>{d.respondent}</span>
      </div>
      <div className="dispute-claim">{d.claim}</div>
      <div className="dispute-footer">
        <span className="dispute-evidence-badge">
          <Eye size={12} /> {d.evidenceCount} evidence items
        </span>
        {d.status === 'active' && (
          <button className="dispute-propose-btn">Propose Test</button>
        )}
        {d.status === 'escalated' && (
          <span className="dispute-evidence-badge" style={{ color: 'var(--accent-red)', background: 'rgba(239,83,80,0.08)' }}>
            <Shield size={12} /> PI Review Required
          </span>
        )}
      </div>
    </div>
  );
}
