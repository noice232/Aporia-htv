import {
  Users, MessageSquare, Clock, FlaskConical
} from 'lucide-react';
import '../styles/team.css';

/* ── mock data ── */
interface Member {
  initials: string;
  name: string;
  role: 'lead' | 'agent' | 'reviewer' | 'observer';
  spec: string;
  status: 'online' | 'away' | 'busy';
  contributions: number;
  gradient: string;
}

const MEMBERS: Member[] = [
  { initials: 'SC', name: 'Dr. Sarah Chen', role: 'lead', spec: 'Neural Radiance Fields', status: 'online', contributions: 142, gradient: 'linear-gradient(135deg, var(--accent-fuchsia), var(--accent-lavender))' },
  { initials: 'Σ7', name: 'Agent Σ-7', role: 'agent', spec: '3D Gaussian Splatting', status: 'online', contributions: 89, gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-mint))' },
  { initials: 'Ω3', name: 'Agent Ω-3', role: 'agent', spec: 'Optimization & Training', status: 'busy', contributions: 67, gradient: 'linear-gradient(135deg, var(--accent-amber), var(--accent-fuchsia))' },
  { initials: 'Δ2', name: 'Agent Δ-2', role: 'agent', spec: 'Rendering & View Synthesis', status: 'online', contributions: 54, gradient: 'linear-gradient(135deg, var(--accent-lavender), var(--accent-cyan))' },
  { initials: 'Λ1', name: 'Agent Λ-1', role: 'reviewer', spec: 'Geometry & Depth', status: 'away', contributions: 31, gradient: 'linear-gradient(135deg, var(--accent-mint), var(--accent-cyan))' },
  { initials: 'MK', name: 'Dr. Min-Jae Kim', role: 'observer', spec: 'External Advisor — KAIST', status: 'away', contributions: 8, gradient: 'linear-gradient(135deg, var(--fg-dim), var(--fg-muted))' },
];

interface Session {
  name: string;
  topic: string;
  participants: { initials: string; gradient: string }[];
  status: 'live' | 'paused' | 'archived';
  started: string;
  messages: number;
}

const SESSIONS: Session[] = [
  {
    name: 'Opacity Reset Ablation',
    topic: 'DSP-042 evidence gathering',
    participants: [
      { initials: 'Σ7', gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-mint))' },
      { initials: 'Ω3', gradient: 'linear-gradient(135deg, var(--accent-amber), var(--accent-fuchsia))' },
    ],
    status: 'live',
    started: '35 min ago',
    messages: 24,
  },
  {
    name: 'Mip-NeRF 360 Benchmark Run',
    topic: 'Baseline metrics for court disputes',
    participants: [
      { initials: 'Δ2', gradient: 'linear-gradient(135deg, var(--accent-lavender), var(--accent-cyan))' },
      { initials: 'Σ7', gradient: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-mint))' },
      { initials: 'Λ1', gradient: 'linear-gradient(135deg, var(--accent-mint), var(--accent-cyan))' },
    ],
    status: 'live',
    started: '2 hr ago',
    messages: 67,
  },
  {
    name: 'SH Degree Schedule Review',
    topic: 'Post-resolution verification — DSP-036',
    participants: [
      { initials: 'SC', gradient: 'linear-gradient(135deg, var(--accent-fuchsia), var(--accent-lavender))' },
      { initials: 'Ω3', gradient: 'linear-gradient(135deg, var(--accent-amber), var(--accent-fuchsia))' },
    ],
    status: 'paused',
    started: '6 hr ago',
    messages: 41,
  },
  {
    name: 'COLMAP Pose Drift Analysis',
    topic: 'Forward-facing scene investigation',
    participants: [
      { initials: 'Λ1', gradient: 'linear-gradient(135deg, var(--accent-mint), var(--accent-cyan))' },
    ],
    status: 'archived',
    started: '2 days ago',
    messages: 93,
  },
];

interface Skill {
  name: string;
  proficiency: 'expert' | 'advanced' | 'intermediate';
  score: string;
}

const SKILLS: Skill[] = [
  { name: 'NeRF Training', proficiency: 'expert', score: '97' },
  { name: '3DGS Optimization', proficiency: 'expert', score: '94' },
  { name: 'View Synthesis', proficiency: 'advanced', score: '88' },
  { name: 'Depth Estimation', proficiency: 'advanced', score: '85' },
  { name: 'Point Cloud Processing', proficiency: 'intermediate', score: '72' },
  { name: 'Camera Calibration', proficiency: 'intermediate', score: '69' },
];

interface Activity {
  actor: string;
  action: string;
  time: string;
  color: string;
}

const ACTIVITY: Activity[] = [
  { actor: 'Agent Σ-7', action: 'submitted 3 new evidence items for DSP-042 (opacity reset ablation curves)', time: '12 min ago', color: 'var(--accent-cyan)' },
  { actor: 'Dr. Sarah Chen', action: 'approved discriminating test for depth-vs-pruning conflict', time: '45 min ago', color: 'var(--accent-fuchsia)' },
  { actor: 'Agent Ω-3', action: 'completed benchmark run on bicycle scene — 29.4 dB PSNR', time: '1 hr ago', color: 'var(--accent-amber)' },
  { actor: 'Agent Δ-2', action: 'filed dispute DSP-041 regarding distillation quality on specular surfaces', time: '3 hr ago', color: 'var(--accent-lavender)' },
  { actor: 'Agent Λ-1', action: 'updated geometry validation metrics for garden scene', time: '5 hr ago', color: 'var(--accent-mint)' },
  { actor: 'Dr. Sarah Chen', action: 'adjusted CFG guidance weight from 1.2 → 1.4 for exploration phase', time: '8 hr ago', color: 'var(--accent-fuchsia)' },
];

/* ── component ── */
export default function Team() {
  return (
    <div className="team-page">
      <div className="team-header">
        <div className="team-label">Collaboration</div>
        <h1>Research Team</h1>
        <div className="team-subtitle">
          Autonomous agents and human researchers coordinating on NeRF/3DGS investigation
        </div>
      </div>

      <div className="team-section-title">
        <Users size={13} /> Roster <span className="count">{MEMBERS.length}</span>
      </div>
      <div className="team-roster">
        {MEMBERS.map(m => (
          <div className="member-card" key={m.name}>
            <div className="member-avatar" style={{ background: m.gradient }}>
              <span style={{ position: 'relative' }}>
                {m.initials}
                <span className={`member-status-dot ${m.status}`} />
              </span>
            </div>
            <span className="member-name">{m.name}</span>
            <span className={`member-role ${m.role}`}>{m.role}</span>
            <span className="member-spec">{m.spec}</span>
            <span className="member-contributions">{m.contributions} contributions</span>
          </div>
        ))}
      </div>

      <div className="team-section-title">
        <MessageSquare size={13} /> Active Sessions <span className="count">{SESSIONS.filter(s => s.status === 'live').length}</span>
      </div>
      <div className="team-sessions">
        {SESSIONS.map(s => (
          <div className="session-card" key={s.name}>
            <div className="session-info">
              <div className="session-name">{s.name}</div>
              <div className="session-meta">
                <span>{s.topic}</span>
                <span>·</span>
                <span>{s.started}</span>
                <span>·</span>
                <span>{s.messages} msgs</span>
              </div>
            </div>
            <div className="session-participants">
              {s.participants.map((p, i) => (
                <div className="session-avatar" key={i} style={{ background: p.gradient }}>
                  {p.initials}
                </div>
              ))}
            </div>
            <span className={`session-status ${s.status}`}>
              <span className="session-status-dot" />
              {s.status}
            </span>
          </div>
        ))}
      </div>

      <div className="team-section-title">
        <FlaskConical size={13} /> Collective Skill Library
      </div>
      <div className="team-skills">
        <div className="skill-chips">
          {SKILLS.map(s => (
            <div className="skill-chip" key={s.name}>
              {s.name}
              <span className={`skill-proficiency ${s.proficiency}`}>{s.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="team-section-title" style={{ marginTop: 24 }}>
        <Clock size={13} /> Recent Activity
      </div>
      <div className="team-activity">
        {ACTIVITY.map((a, i) => (
          <div className="activity-item" key={i}>
            <div className="activity-dot" style={{ background: a.color }} />
            <div className="activity-content">
              <div className="activity-text">
                <strong>{a.actor}</strong> {a.action}
              </div>
              <div className="activity-time">{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
