'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import './drill-pad.css'

type RawMessage = { role: 'user' | 'assistant'; content: string }
type Meta = {
  stage?: string
  grade?: 'A' | 'B' | 'C' | 'D' | null
  company?: string
  domain?: string
  categoriesTested?: string[]
  gapsFlagged?: string[]
  note?: string
  sessionComplete?: boolean
}
type GapEvent = { date: number; sessionId: string; category: string; hit: boolean }
type SessionRecord = {
  id: string
  dayType: string
  company: string | null
  domain: string | null
  grade: string | null
  startedAt: number
  endedAt: number | null
  rawMessages: RawMessage[]
  gapsFlaggedTotal: string[]
}

const DAY_TYPES = [
  { id: 'Case Day', name: 'Case Day', desc: 'Full experiment design arc, ~25 min' },
  { id: 'Mechanics Day', name: 'Mechanics Day', desc: 'OVB drills + definition check' },
  { id: 'Communication Day', name: 'Communication Day', desc: 'PM translation + distributions' },
  { id: 'Weekend', name: 'Weekend', desc: 'Lighter case + mechanics/PM' },
  { id: 'Definition check', name: 'Definition Check', desc: 'Quick precision quiz, 3 terms' },
]

const CATEGORIES = [
  { id: 'guardrail_specificity', label: 'Guardrail specificity' },
  { id: 'two_sided_market', label: 'Two-sided market' },
  { id: 'ovb_direction', label: 'OVB direction' },
  { id: 'multiple_testing', label: 'Multiple testing' },
  { id: 'metric_precision', label: 'Metric precision' },
  { id: 'alpha_framing', label: 'Alpha as decision cost' },
]

const COMPANY_POOL = [
  'Surprise me', 'Lyft', 'Whatnot', 'Pinterest', 'Airbnb', 'Chime', 'Tubi', 'TikTok', 'Meta',
  'DoorDash', 'Uber', 'Instacart', 'Spotify', 'Etsy', 'StockX', 'Faire', 'Reddit', 'Snap',
  'Coinbase', 'Robinhood', 'OpenTable', 'Zillow',
]

const FOCUS_POOL = [
  { id: '', label: 'Auto — target my weakest areas' },
  { id: 'guardrail_specificity', label: 'Guardrail specificity' },
  { id: 'two_sided_market', label: 'Two-sided marketplace reasoning' },
  { id: 'ovb_direction', label: 'OVB direction (Corr × Corr)' },
  { id: 'multiple_testing', label: 'Multiple testing (Bonferroni vs BH)' },
  { id: 'metric_precision', label: 'Metric / denominator precision' },
  { id: 'alpha_framing', label: 'Alpha as a decision cost' },
  { id: 'cuped', label: 'CUPED / variance reduction' },
  { id: 'sutva', label: 'SUTVA & randomization unit' },
  { id: 'distribution', label: 'Distribution reasoning' },
]

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}
function stripMeta(text: string) {
  return text.replace(/\n?<<META>>[\s\S]*?<<END>>\s*$/, '').trim()
}
function parseMeta(text: string): Meta | null {
  const m = text.match(/<<META>>([\s\S]*?)<<END>>/)
  if (!m) return null
  try {
    return JSON.parse(m[1])
  } catch {
    return null
  }
}

export default function DrillPadClient({ userEmail, onBack }: { userEmail: string; onBack?: () => void }) {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [gapLog, setGapLog] = useState<GapEvent[]>([])
  const [active, setActive] = useState<SessionRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [awaitingAnswer, setAwaitingAnswer] = useState(false)
  const [justEnded, setJustEnded] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [openHistId, setOpenHistId] = useState<string | null>(null)

  const [dayType, setDayType] = useState(DAY_TYPES[0].id)
  const [company, setCompany] = useState('')
  const [focus, setFocus] = useState('')
  const [answer, setAnswer] = useState('')

  const transcriptRef = useRef<HTMLDivElement>(null)

  // Load history + any resumable in-progress session on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/drill-data')
        if (!res.ok) throw new Error('Failed to load history')
        const data = await res.json()
        const all: SessionRecord[] = data.sessions ?? []
        const done = all.filter((s) => s.endedAt !== null)
        const inProgress = all.find((s) => s.endedAt === null) ?? null
        setSessions(done)
        setGapLog(data.gapLog ?? [])
        if (inProgress) {
          setActive(inProgress)
          setAwaitingAnswer(true)
        }
      } catch (e: any) {
        setError(e.message || 'Could not load your history')
      }
    })()
  }, [])

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight })
  }, [active, loading, error])

  function weakestCategories(): string[] {
    const stats: Record<string, { hit: number; total: number }> = {}
    CATEGORIES.forEach((c) => (stats[c.id] = { hit: 0, total: 0 }))
    gapLog.slice(-120).forEach((ev) => {
      if (stats[ev.category]) {
        stats[ev.category].total++
        if (ev.hit) stats[ev.category].hit++
      }
    })
    return CATEGORIES.map((c) => ({
      label: c.label,
      rate: stats[c.id].total ? stats[c.id].hit / stats[c.id].total : null,
    }))
      .filter((c) => c.rate !== null && c.rate < 0.7)
      .sort((a, b) => (a.rate as number) - (b.rate as number))
      .slice(0, 3)
      .map((c) => c.label)
  }
  function recentCompanies(): string[] {
    return sessions.slice(-3).map((s) => s.company || 'surprise')
  }

  async function persist(session: SessionRecord, gapEvents: GapEvent[]) {
    try {
      await fetch('/api/drill-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, gapEvents }),
      })
    } catch {
      // non-fatal — local state still has it; next successful call will catch up
    }
  }

  async function callGrade(messages: RawMessage[]): Promise<string> {
    const res = await fetch('/api/drill-grade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Grading request failed')
    return data.text
  }

  async function startSession() {
    const focusLabel = FOCUS_POOL.find((f) => f.id === focus)?.label || ''
    const startMsg = `Day type: ${dayType}.
Company/context preference: ${company || 'Surprise me — pick a consumer tech or marketplace company not used recently.'}
Focus area preference: ${focus ? focusLabel : 'Auto — please weight this session toward my weakest tracked categories listed below.'}
My weakest tracked categories recently (lowest hit rate, prioritize these if focus is auto): ${weakestCategories().join(', ') || 'none yet — this is early days, use full known-gap list evenly'}.
Companies used in my last 3 sessions (avoid repeating): ${recentCompanies().join(', ') || 'none yet'}.
Please begin the drill now. Remember: one stage per message, end every message with the <<META>> block exactly as specified, nothing after it.`

    const session: SessionRecord = {
      id: uid(),
      dayType,
      company: company || null,
      domain: null,
      grade: null,
      startedAt: Date.now(),
      endedAt: null,
      rawMessages: [{ role: 'user', content: startMsg }],
      gapsFlaggedTotal: [],
    }
    setActive(session)
    setJustEnded(false)
    await requestNextTurn(session)
  }

  async function requestNextTurn(session: SessionRecord) {
    setLoading(true)
    setError(null)
    setAwaitingAnswer(false)
    try {
      const replyText = await callGrade(session.rawMessages)
      const updated: SessionRecord = {
        ...session,
        rawMessages: [...session.rawMessages, { role: 'assistant', content: replyText }],
      }
      const meta = parseMeta(replyText) || {}
      const tested = meta.categoriesTested || []
      const flagged = meta.gapsFlagged || []
      const now = Date.now()
      const newEvents: GapEvent[] = tested.map((cat) => ({
        date: now,
        sessionId: session.id,
        category: cat,
        hit: !flagged.includes(cat),
      }))
      if (meta.company) updated.company = meta.company
      if (meta.domain) updated.domain = meta.domain

      if (meta.sessionComplete) {
        const finalRecord: SessionRecord = {
          ...updated,
          endedAt: Date.now(),
          grade: meta.grade || null,
          gapsFlaggedTotal: [
            ...gapLog.filter((e) => e.sessionId === session.id && !e.hit).map((e) => e.category),
            ...newEvents.filter((e) => !e.hit).map((e) => e.category),
          ],
        }
        await persist(finalRecord, newEvents)
        setGapLog((g) => [...g, ...newEvents])
        setSessions((s) => [...s, finalRecord])
        setActive(null)
        setJustEnded(true)
      } else {
        await persist(updated, newEvents)
        setGapLog((g) => [...g, ...newEvents])
        setActive(updated)
        setAwaitingAnswer(true)
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong talking to the model.')
    }
    setLoading(false)
  }

  async function submitAnswer() {
    if (!active || !answer.trim()) return
    const updated: SessionRecord = {
      ...active,
      rawMessages: [...active.rawMessages, { role: 'user', content: answer.trim() }],
    }
    setAnswer('')
    setActive(updated)
    await requestNextTurn(updated)
  }

  async function discardActive() {
    setActive(null)
    setAwaitingAnswer(false)
  }

  async function clearHistory() {
    if (!confirm("Clear all drill history and gap tracking? This can't be undone.")) return
    await fetch('/api/drill-data', { method: 'DELETE' })
    setSessions([])
    setGapLog([])
    setActive(null)
    setJustEnded(false)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/drill-pad/login')
    router.refresh()
  }

  function trendFor(catId: string) {
    const events = gapLog.filter((e) => e.category === catId).slice(-10)
    const last5 = events.slice(-5)
    const prev5 = events.slice(-10, -5)
    if (last5.length >= 2 && prev5.length >= 2) {
      const r1 = last5.filter((e) => e.hit).length / last5.length
      const r0 = prev5.filter((e) => e.hit).length / prev5.length
      if (r1 > r0) return { label: '↑ improving', cls: 'up' }
      if (r1 < r0) return { label: '↓ slipping', cls: 'down' }
    }
    return { label: '—', cls: 'flat' }
  }

  return (
    <div id="dp-root">
      <header className="top">
        <div className="brand">
          <span className="dot" />
          DRILL PAD<span className="sub">experimentation &amp; causal inference practice</span>
        </div>
        <div className="top-status">
          <span className="chip">{userEmail}</span>
          <span className="chip">{sessions.length} sessions logged</span>
          <button className="ghost-btn" style={{ width: 'auto', padding: '5px 10px' }} onClick={signOut}>
            Sign out
          </button>
          {onBack && <button className="ghost-btn" style={{ width: 'auto', padding: '5px 10px' }} onClick={onBack}>Back</button>}
        </div>
      </header>

      <aside className="rail">
        {active && (
          <div className="resume-banner">
            <div className="rb-title">SESSION IN PROGRESS</div>
            {active.dayType} · {active.company || 'surprise'} — started{' '}
            {new Date(active.startedAt).toLocaleString()}
            <button className="ghost-btn" style={{ marginTop: 8 }} onClick={discardActive}>
              Discard &amp; start new
            </button>
          </div>
        )}

        <div className="rail-section">
          <h3>Day type</h3>
          {DAY_TYPES.map((dt) => (
            <button
              key={dt.id}
              className={`daytype-btn ${dt.id === dayType ? 'active' : ''}`}
              onClick={() => setDayType(dt.id)}
            >
              <span className="name">{dt.name}</span>
              <span className="desc">{dt.desc}</span>
            </button>
          ))}
        </div>

        <div className="rail-section">
          <h3>Company / context</h3>
          <select className="field" value={company} onChange={(e) => setCompany(e.target.value)}>
            {COMPANY_POOL.map((c) => (
              <option key={c} value={c === 'Surprise me' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
          <h3 style={{ marginTop: 14 }}>Focus area</h3>
          <select className="field" value={focus} onChange={(e) => setFocus(e.target.value)}>
            {FOCUS_POOL.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <button className="start-btn" disabled={!!active} onClick={startSession}>
          {active ? 'Resume the session above ↑' : 'Start Drill'}
        </button>
        <button className="ghost-btn" style={{ marginTop: 14 }} onClick={clearHistory}>
          Clear all history
        </button>
      </aside>

      <main className="pad">
        <div className="transcript" ref={transcriptRef}>
          {!active && !justEnded && (
            <div className="empty-state">
              <div className="glyph">◇</div>
              <h2>No active drill</h2>
              <p>Pick a day type on the left and hit Start Drill. Your history is saved to your account and available on every device you log into.</p>
            </div>
          )}

          {!active && justEnded && (
            <div className="entry final">
              <div className="card">
                <div className="card-head">
                  <span className="stage-name">Drill complete</span>
                  {sessions[sessions.length - 1]?.grade && (
                    <span className={`grade-badge grade-${sessions[sessions.length - 1].grade}`}>
                      {sessions[sessions.length - 1].grade}
                    </span>
                  )}
                </div>
                <div className="card-body">Nice work — check the signal panel for what moved, or start another drill.</div>
              </div>
            </div>
          )}

          {active && (
            <>
              <div className="entry start">
                <div className="card">
                  <div className="card-head">
                    <span className="tag company">{active.company || 'surprise'}</span>
                    <span className="tag">{active.dayType}</span>
                  </div>
                  <div className="card-body">Session started.</div>
                </div>
              </div>
              {active.rawMessages.slice(1).map((m, i) => {
                if (m.role === 'assistant') {
                  const meta = parseMeta(m.content) || {}
                  const clean = stripMeta(m.content)
                  const gaps = meta.gapsFlagged || []
                  const tested = meta.categoriesTested || []
                  return (
                    <div className="entry assistant" key={i}>
                      <div className="card">
                        <div className="card-head">
                          <span className="stage-name">{meta.stage || 'Drill'}</span>
                          {meta.grade && <span className={`grade-badge grade-${meta.grade}`}>{meta.grade}</span>}
                        </div>
                        <div className="card-body">{clean}</div>
                        {tested.length > 0 && (
                          <div className="gap-pills">
                            {tested.map((t) => {
                              const label = CATEGORIES.find((c) => c.id === t)?.label || t
                              const isMiss = gaps.includes(t)
                              return (
                                <span key={t} className={`gap-pill ${isMiss ? 'miss' : 'hit'}`}>
                                  {isMiss ? '✕' : '✓'} {label}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                }
                return (
                  <div className="entry user" key={i}>
                    <div className="card">
                      <div className="card-head">Your answer</div>
                      <div className="card-body">{m.content}</div>
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {error && (
            <div className="error-row">
              <span>{error}</span>
              <button onClick={() => active && requestNextTurn(active)}>Retry</button>
            </div>
          )}
          {loading && (
            <div className="loading-row">
              <span className="spinner" /> thinking through the next stage…
            </div>
          )}
        </div>

        {active && awaitingAnswer && !loading && (
          <div className="answer-dock">
            <div className="dock-label">
              <span>Your answer</span>
              <span>⌘+Enter to submit</span>
            </div>
            <textarea
              className="pad-input"
              placeholder="Type your answer here…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitAnswer()
              }}
            />
            <div className="dock-actions">
              <span className="hint">Answer like you would out loud — you'll be graded against the senior bar.</span>
              <button className="submit-btn" disabled={!answer.trim()} onClick={submitAnswer}>
                Submit
              </button>
            </div>
          </div>
        )}

        {justEnded && (
          <div className="session-end-actions">
            <button className="ghost-btn" onClick={() => setHistoryOpen(true)}>
              View history
            </button>
            <button className="start-btn" onClick={() => setJustEnded(false)}>
              Start another drill
            </button>
          </div>
        )}
      </main>

      <aside className="signal">
        <h3>Signal panel</h3>
        <div>
          {CATEGORIES.map((cat) => {
            const events = gapLog.filter((e) => e.category === cat.id).slice(-10)
            const trend = trendFor(cat.id)
            return (
              <div className="cat-strip" key={cat.id}>
                <div className="cat-name">
                  <span>{cat.label}</span>
                  <span className={`cat-trend ${trend.cls}`}>{trend.label}</span>
                </div>
                <div className="dots">
                  {Array.from({ length: 10 }, (_, i) => {
                    const ev = events[i]
                    if (!ev) return <span className="dot empty" key={i} />
                    return <span className={`dot ${ev.hit ? 'hit' : 'miss'}`} key={i} />
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <h3 style={{ marginTop: 20 }}>Running log</h3>
        <div className="log-list">
          {gapLog.length === 0 && (
            <div className="hint" style={{ color: 'var(--ink-dim)', fontSize: 11.5 }}>
              No drills logged yet.
            </div>
          )}
          {gapLog
            .slice(-8)
            .reverse()
            .map((ev, i) => {
              const label = CATEGORIES.find((c) => c.id === ev.category)?.label || ev.category
              return (
                <div className={`log-item ${ev.hit ? 'hit' : 'miss'}`} key={i}>
                  <div className="log-meta">
                    <span>{new Date(ev.date).toLocaleDateString()}</span>
                    <span>{ev.hit ? 'HIT' : 'MISS'}</span>
                  </div>
                  {label}
                </div>
              )
            })}
        </div>

        <button className="view-history-btn" onClick={() => setHistoryOpen(true)}>
          View full session history →
        </button>
      </aside>

      {historyOpen && (
        <div className="history-overlay open">
          <div className="history-panel">
            <button className="close-history" onClick={() => setHistoryOpen(false)}>
              Close ✕
            </button>
            <h2>Session history</h2>
            <div className="hp-sub">Every completed drill, most recent first.</div>
            {sessions.length === 0 && <div className="hint">No completed sessions yet.</div>}
            {sessions
              .slice()
              .reverse()
              .map((s) => {
                const gapCounts: Record<string, number> = {}
                s.gapsFlaggedTotal.forEach((g) => (gapCounts[g] = (gapCounts[g] || 0) + 1))
                const gapSummary =
                  Object.keys(gapCounts)
                    .map((g) => `${CATEGORIES.find((c) => c.id === g)?.label || g} (${gapCounts[g]})`)
                    .join(', ') || 'no gaps flagged'
                const open = openHistId === s.id
                return (
                  <div className="hist-session" key={s.id}>
                    <div
                      className="hist-session-head"
                      onClick={() => setOpenHistId(open ? null : s.id)}
                    >
                      <span className="date">{new Date(s.endedAt || 0).toLocaleDateString()}</span>
                      <span className="dtype">{s.dayType}</span>
                      <span className="tag company">{s.company || 'surprise'}</span>
                      <span className="spacer" />
                      {s.grade && <span className={`grade-badge grade-${s.grade}`}>{s.grade}</span>}
                    </div>
                    <div className="hint" style={{ marginTop: 6 }}>
                      Misses: {gapSummary}
                    </div>
                    {open && (
                      <div className="hist-detail open">
                        {s.rawMessages.slice(1).map((m, i) => {
                          if (m.role === 'assistant') {
                            const meta = parseMeta(m.content) || {}
                            return (
                              <div className="entry" key={i}>
                                <div className="card" style={{ borderColor: 'var(--line)', background: 'var(--void)' }}>
                                  <div className="card-head">
                                    <span className="stage-name">{meta.stage || ''}</span>
                                    {meta.grade && <span className={`grade-badge grade-${meta.grade}`}>{meta.grade}</span>}
                                  </div>
                                  <div className="card-body" style={{ fontSize: 12.5 }}>
                                    {stripMeta(m.content)}
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return (
                            <div className="entry" style={{ marginLeft: 16 }} key={i}>
                              <div className="card" style={{ borderColor: 'var(--amber)', background: 'var(--void)' }}>
                                <div className="card-head">Her answer</div>
                                <div className="card-body" style={{ fontSize: 12.5 }}>{m.content}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
