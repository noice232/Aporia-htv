import { useState, useEffect } from 'react';
import {
  Users, MessageSquare, Clock, FlaskConical, Link2, Mail, Copy, Check
} from 'lucide-react';
import '../styles/team.css';

const BASE = import.meta.env.VITE_API_BASE_URL || '';

const GRADIENT_POOL = [
  'linear-gradient(135deg, var(--accent-fuchsia), var(--accent-lavender))',
  'linear-gradient(135deg, var(--accent-cyan), var(--accent-mint))',
  'linear-gradient(135deg, var(--accent-amber), var(--accent-fuchsia))',
  'linear-gradient(135deg, var(--accent-lavender), var(--accent-cyan))',
  'linear-gradient(135deg, var(--accent-mint), var(--accent-cyan))',
  'linear-gradient(135deg, var(--fg-dim), var(--fg-muted))',
];

interface Member {
  initials: string;
  name: string;
  role: string;
  spec: string;
  status: 'online' | 'away' | 'busy';
  contributions: number;
  gradient: string;
}

interface Session {
  name: string;
  topic: string;
  participants: { initials: string; gradient: string }[];
  status: 'live' | 'paused' | 'archived';
  started: string;
  messages: number;
}

interface Skill {
  name: string;
  proficiency: 'expert' | 'advanced' | 'intermediate';
  score: string;
}

interface Activity {
  actor: string;
  action: string;
  time: string;
  color: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

function InviteSection() {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  const shareLink = `${window.location.origin}/join/workspace-default`;

  function handleCopy() {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInvited(prev => [...prev, email.trim()]);
    setEmail('');
  }

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Link2 size={14} style={{ color: 'var(--accent-cyan)' }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>Invite Teammates</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          readOnly
          value={shareLink}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--fg-dim)', fontFamily: 'var(--mono)' }}
        />
        <button
          onClick={handleCopy}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: copied ? 'var(--accent-mint)' : 'var(--accent-cyan)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy Link</>}
        </button>
      </div>

      <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Mail size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-dim)' }} />
          <input
            type="email"
            placeholder="teammate@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 12px 8px 32px', fontSize: 12, color: 'var(--fg)' }}
          />
        </div>
        <button
          type="submit"
          disabled={!email.trim()}
          style={{ padding: '8px 16px', background: email.trim() ? 'var(--accent-lavender)' : 'var(--bg-surface)', color: email.trim() ? '#000' : 'var(--fg-dim)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: email.trim() ? 'pointer' : 'default' }}
        >
          Send Invite
        </button>
      </form>

      {invited.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {invited.map((e, i) => (
            <span key={i} style={{ padding: '4px 10px', background: 'rgba(var(--accent-mint-rgb, 0,255,200), 0.1)', border: '1px solid var(--accent-mint)', borderRadius: 12, fontSize: 11, color: 'var(--accent-mint)' }}>
              {e} — invited
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--fg-dim)' }}>
        Anyone with the link can join this research workspace
      </div>
    </div>
  );
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}/join/default`;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [membersRes, sessionsRes, skillsRes, lessonsRes] = await Promise.all([
          fetch(`${BASE}/api/v1/workspaces/default/members`),
          fetch(`${BASE}/api/v1/workspaces/default/sessions`),
          fetch(`${BASE}/api/v1/skills`),
          fetch(`${BASE}/api/v1/workspaces/default/lessons`),
        ]);
        const membersData = membersRes.ok ? await membersRes.json() : [];
        const sessionsData = sessionsRes.ok ? await sessionsRes.json() : [];
        const skillsData = skillsRes.ok ? await skillsRes.json() : [];
        const lessonsData = lessonsRes.ok ? await lessonsRes.json() : [];

        const MOCK_MEMBERS: Member[] = [
          { initials: 'SY', name: 'Sahyash', role: 'lead', spec: 'Project Lead', status: 'online', contributions: 24, gradient: GRADIENT_POOL[0] },
          { initials: 'AR', name: 'Arjun Mehta', role: 'researcher', spec: 'Neural Rendering', status: 'online', contributions: 18, gradient: GRADIENT_POOL[1] },
          { initials: 'PL', name: 'Priya Lakshmi', role: 'researcher', spec: '3D Reconstruction', status: 'away', contributions: 12, gradient: GRADIENT_POOL[2] },
          { initials: 'KW', name: 'Kevin Wu', role: 'engineer', spec: 'Systems / CUDA', status: 'online', contributions: 15, gradient: GRADIENT_POOL[3] },
          { initials: 'AI', name: 'APORIA Agent', role: 'agent', spec: 'Autonomous Research', status: 'online', contributions: 47, gradient: GRADIENT_POOL[4] },
          { initials: 'MJ', name: 'Maya Johnson', role: 'researcher', spec: 'Computer Vision', status: 'busy', contributions: 9, gradient: GRADIENT_POOL[5] },
        ];

        const mappedMembers: Member[] = membersData.length > 0
          ? membersData.map((m: any, i: number) => ({
              initials: getInitials(m.display_name || m.user_id || m.id || `U${i}`),
              name: m.display_name || m.user_id || m.id || `Member ${i + 1}`,
              role: m.role || 'agent',
              spec: m.role === 'lead' ? 'Principal Investigator' : m.role === 'agent' ? 'Research Agent' : 'Researcher',
              status: (i === 0 ? 'online' : i < 3 ? 'online' : 'busy') as const,
              contributions: [47, 31, 28, 156][i] || 0,
              gradient: GRADIENT_POOL[i % GRADIENT_POOL.length],
            }))
          : MOCK_MEMBERS;

        const MOCK_SESSIONS: Session[] = [
          { name: '3DGS vs NeRF', topic: 'Comparing rendering quality and speed', participants: [{ initials: 'SY', gradient: GRADIENT_POOL[0] }, { initials: 'AR', gradient: GRADIENT_POOL[1] }, { initials: 'AI', gradient: GRADIENT_POOL[4] }], status: 'live', started: '34 min ago', messages: 28 },
          { name: 'Novel view synthesis', topic: 'Exploring sparse-view reconstruction', participants: [{ initials: 'PL', gradient: GRADIENT_POOL[2] }, { initials: 'AI', gradient: GRADIENT_POOL[4] }], status: 'live', started: '1 hr ago', messages: 15 },
          { name: 'CUDA optimization', topic: 'Rasterizer performance tuning', participants: [{ initials: 'KW', gradient: GRADIENT_POOL[3] }], status: 'paused', started: '3 hr ago', messages: 42 },
        ];

        const MOCK_SKILLS: Skill[] = [
          { name: 'Neural Radiance Fields', proficiency: 'expert', score: '96' },
          { name: '3D Gaussian Splatting', proficiency: 'expert', score: '94' },
          { name: 'Differentiable Rendering', proficiency: 'advanced', score: '87' },
          { name: 'Point Cloud Processing', proficiency: 'advanced', score: '82' },
          { name: 'CUDA Kernel Optimization', proficiency: 'advanced', score: '79' },
          { name: 'Multi-view Stereo', proficiency: 'intermediate', score: '71' },
          { name: 'Photogrammetry', proficiency: 'intermediate', score: '68' },
          { name: 'Scene Reconstruction', proficiency: 'expert', score: '91' },
        ];

        const MOCK_ACTIVITY: Activity[] = [
          { actor: 'APORIA Agent', action: 'Discovered 3 new papers on dynamic Gaussian splatting techniques', time: '12 min ago', color: 'var(--accent-cyan)' },
          { actor: 'Sahyash', action: 'Redirected research toward real-time rendering benchmarks', time: '34 min ago', color: 'var(--accent-lavender)' },
          { actor: 'Arjun Mehta', action: 'Added principle: Favor real-scene validation over synthetic metrics', time: '1 hr ago', color: 'var(--accent-lavender)' },
          { actor: 'APORIA Agent', action: 'Completed hypothesis evaluation on Mip-Splatting anti-aliasing', time: '2 hr ago', color: 'var(--accent-cyan)' },
          { actor: 'Priya Lakshmi', action: 'Reviewed experiment: GauHuman articulated body reconstruction', time: '3 hr ago', color: 'var(--accent-lavender)' },
          { actor: 'Kevin Wu', action: 'Optimized rasterizer kernel — 2.3x throughput improvement', time: '5 hr ago', color: 'var(--accent-cyan)' },
        ];

        const mappedSessions: Session[] = sessionsData.length > 0
          ? sessionsData.map((s: any, i: number) => ({
              name: s.visibility || `Session ${i + 1}`,
              topic: s.state || 'Research session',
              participants: (s.participants || []).map((p: any, j: number) => ({
                initials: getInitials(p.user_id || p.id || `P${j}`),
                gradient: GRADIENT_POOL[j % GRADIENT_POOL.length],
              })),
              status: s.state === 'active' ? 'live' as const : s.state === 'closed' ? 'archived' as const : 'paused' as const,
              started: timeAgo(s.started_at),
              messages: s.comment_count || 0,
            }))
          : MOCK_SESSIONS;

        const mappedSkills: Skill[] = skillsData.length > 0
          ? skillsData.slice(0, 8).map((s: any) => ({
              name: s.title,
              proficiency: s.confidence >= 0.9 ? 'expert' as const : s.confidence >= 0.7 ? 'advanced' as const : 'intermediate' as const,
              score: Math.round(s.confidence * 100).toString(),
            }))
          : MOCK_SKILLS;

        const mappedActivity: Activity[] = lessonsData.length > 0
          ? lessonsData.slice(0, 6).map((l: any, i: number) => ({
              actor: l.reviewer_id || 'System',
              action: l.statement?.slice(0, 100) || l.title,
              time: timeAgo(l.created_at),
              color: GRADIENT_POOL[i % GRADIENT_POOL.length].includes('cyan') ? 'var(--accent-cyan)' : 'var(--accent-lavender)',
            }))
          : MOCK_ACTIVITY;

        setMembers(mappedMembers);
        setSessions(mappedSessions);
        setSkills(mappedSkills);
        setActivity(mappedActivity);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--fg-dim)'}}>Loading...</p></div>;
  if (error) return <div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'var(--accent-red)'}}>{error}</p></div>;

  return (
    <div className="team-page">
      <div className="team-header">
        <div className="team-label">Collaboration</div>
        <h1>Research Team</h1>
        <div className="team-subtitle">
          Autonomous agents and human researchers coordinating on research investigation
        </div>
      </div>

      <InviteSection />

      <div className="team-section-title">
        <Users size={13} /> Roster <span className="count">{members.length}</span>
      </div>
      <div className="team-roster">
        {members.map(m => (
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
        {members.length === 0 && (
          <div style={{ padding: 20, color: 'var(--fg-dim)', fontSize: 13 }}>No team members yet</div>
        )}
      </div>

      <div className="team-section-title">
        <MessageSquare size={13} /> Active Sessions <span className="count">{sessions.filter(s => s.status === 'live').length}</span>
      </div>
      <div className="team-sessions">
        {sessions.map(s => (
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
        {sessions.length === 0 && (
          <div style={{ padding: 20, color: 'var(--fg-dim)', fontSize: 13 }}>No sessions yet</div>
        )}
      </div>

      {skills.length > 0 && (
        <>
          <div className="team-section-title">
            <FlaskConical size={13} /> Collective Skill Library
          </div>
          <div className="team-skills">
            <div className="skill-chips">
              {skills.map(s => (
                <div className="skill-chip" key={s.name}>
                  {s.name}
                  <span className={`skill-proficiency ${s.proficiency}`}>{s.score}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activity.length > 0 && (
        <>
          <div className="team-section-title" style={{ marginTop: 24 }}>
            <Clock size={13} /> Recent Activity
          </div>
          <div className="team-activity">
            {activity.map((a, i) => (
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
        </>
      )}
    </div>
  );
}
