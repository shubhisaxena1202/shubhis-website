"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import "./coder-pad.css"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Question {
  title: string
  context_markdown: string
  parts: string[]
  hidden_solution_markdown: string
}

interface PartScore { part: number; status: "correct" | "partial" | "incorrect"; note: string }
interface EvalResult {
  grade: string
  part_scores: PartScore[]
  syntax_issues: string[]
  evaluation_markdown: string
  follow_up_question: string
}
interface ClarifyItem { question: string; response: string; maturity: string; note?: string }
interface HistoryEntry {
  id?: string; created_at?: string; day_type: string; archetype: string; title: string;
  grade: string; correct: number; partial: number; incorrect: number; total_parts: number;
  syntax_issue_count: number; questions_asked: number; questions_strong: number;
  questions_ok: number; questions_weak: number
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const SEQUENCES: Record<string, string[]> = {
  sql: ["sql", "sql"],
  python: ["pandas", "simulation"],
  weekend: ["ai_investigation", "code_reading"],
  mixed: ["sql", "simulation"],
}
const TIME_LIMITS: Record<string, number> = { sql: 25, pandas: 30, simulation: 30, code_reading: 18, ai_investigation: 30 }
const LANG: Record<string, string> = { sql: "sql", pandas: "python", simulation: "python", code_reading: "python", ai_investigation: "python" }
const GRADE_COLOR: Record<string, string> = { A: "var(--cp-accent)", B: "var(--cp-blue)", C: "var(--cp-amber)", D: "var(--cp-coral)" }
const STATUS_COLOR: Record<string, string> = { correct: "var(--cp-accent)", partial: "var(--cp-amber)", incorrect: "var(--cp-coral)" }
const STATUS_LABEL: Record<string, string> = { correct: "Correct", partial: "Partial credit", incorrect: "Incorrect" }
const MATURITY_COLOR: Record<string, string> = { strong: "var(--cp-accent)", ok: "var(--cp-blue)", weak: "var(--cp-amber)" }
const MATURITY_LABEL: Record<string, string> = { strong: "STRONG QUESTION", ok: "OK TO ASK", weak: "COULD SKIP THIS" }

/* ------------------------------------------------------------------ */
/*  Prompt templates                                                   */
/* ------------------------------------------------------------------ */
const KNOWN_GAPS = `
KNOWN GAPS - always probe these:
- SQL: NULL handling. col != NULL is always NULL - correct pattern is IS NULL or anti-join. She must handle NULLs proactively without being prompted.
- SQL: Window functions under time pressure - LAG, LEAD, ROW_NUMBER, RANK, SUM OVER PARTITION BY
- Python: transform vs groupby().agg() - she must use transform when broadcasting group stats back to the original index, not a separate merge
- Python: Statistical simulation WITHOUT scipy or statsmodels - numpy only, from scratch
- Python: Named aggregation syntax in agg(): col=('source', 'func') - not chained methods
- Python: Explicit merge how= parameter - must state and justify left vs inner vs outer
STRENGTHS - raise the bar, don't drill basics: CUPED, DiD, variance reduction, switchback experiments, experimentation design, business translation.
Contexts to use: TikTok creator analytics, Whatnot marketplace listings, Uber rides/drivers, Meta feed engagement, DoorDash orders, Spotify listening behavior.
`

const MULTIPART_RULE = `
This question MUST be structured as 3-4 escalating parts, the way a real interview unfolds - each part builds directly on the previous one's result, gets harder, and is only revealed after the candidate finishes the one before it. Do NOT write 3-4 independent questions; part 2 should assume part 1 is already solved and extend it, part 3 should extend part 2, etc. Good escalation patterns: (a) compute a base metric -> (b) break it down by a dimension or add a filter -> (c) add a window/time-based twist (trend, cohort, ranking) -> (d) a "what if" that changes a requirement or asks her to explain/defend a decision. Each part's text should be a short, self-contained ask (1-3 sentences), written as the interviewer would say it out loud.`

const ARCHETYPE_RULES: Record<string, string> = {
  sql: `Generate ONE medium-hard SQL business scenario with ONE shared schema.${MULTIPART_RULE}
Across the parts combined, require at least 2 of: window function (LAG/LEAD/ROW_NUMBER/RANK/SUM-AVG OVER PARTITION BY), CASE WHEN inside an aggregate, CTE structure, date logic (quarters/cohort weeks/30-day windows). Include at least one nullable column to force NULL handling. Provide full schema (table names, columns, types) in context_markdown. Do not include hints or solutions in any part.`,
  pandas: `Generate ONE pandas scenario with 2-3 DataFrames (schemas described), used across all parts.${MULTIPART_RULE}
Across the parts combined, require: groupby+agg with NAMED aggregation syntax (agg(new_col=('source_col','func'))), a merge with an EXPLICIT how= she must state and justify, transform for at least one group-level stat broadcast back to the original index, and one NULL-handling decision.`,
  simulation: `Generate ONE statistical simulation scenario (bootstrap CI, permutation test, power simulation, or Monte Carlo - rotate), used across all parts.${MULTIPART_RULE}
State explicitly that she must implement it with numpy only - NO scipy, NO statsmodels. Good escalation: (a) implement the core simulation -> (b) report the deliverable (e.g. 95% CI via percentile method, or % reaching significance) -> (c) change a parameter (unequal sample sizes, different alpha, effect size) and ask how the result changes -> (d) interpret the result for a launch decision.`,
  code_reading: `Write ONE 15-30 line Python function (put the full code in the FIRST part's text inside a code block) related to: CUPED variants, retention cohort analysis, funnel drop-off calculation, rolling metric with window functions, or A/B test result formatting with CIs. Do NOT say what it does.${MULTIPART_RULE}
Escalate across parts: (a) explain what it does in plain language, (b) explain one specific design decision, (c) identify one potential issue or edge case, (d) propose and describe a fix or extension. Raise the bar since she knows CUPED/DiD cold.`,
  ai_investigation: `Describe ONE dataset (columns, approx row count, business context) and a broad analytical question, framed as if she is directing an AI coding assistant.${MULTIPART_RULE}
Escalate across parts: (a) initial exploration/aggregation request, (b) a deeper cut or join, (c) a request that would surface one of the planted errors if she isn't careful, (d) ask her to sanity-check the result before shipping it. In hidden_solution_markdown, write a "reference implementation" that secretly contains exactly 3 subtle errors chosen from: wrong aggregation level, missing NULL filter, wrong join type, off-by-one date boundary, or wrong window frame. Clearly list the 3 planted errors at the end of hidden_solution_markdown under a "### Planted errors" heading. Do not reveal them in any part.`,
}

function genSystem(archetype: string) {
  return `You are generating ONE interview coding drill question for Shubhi, a Senior Data Scientist preparing for senior consumer tech DS interviews (Meta, TikTok, Whatnot, Uber).
${KNOWN_GAPS}
ARCHETYPE INSTRUCTIONS:
${ARCHETYPE_RULES[archetype]}

SCHEMA REQUIREMENTS (apply to every archetype that involves a dataset):
For every table or DataFrame, give: (1) one line saying what a row represents, (2) each column as "- column_name (type): what it means" — always state the type AND the business meaning, (3) explicitly flag which columns can be NULL and what a NULL means there, (4) row count order of magnitude, (5) if there are 2+ tables, one line on how they relate.
Use compact bullet lists, not markdown tables.

Keep everything else lean: hidden_solution_markdown should be the code plus 2-3 sentences of explanation, nothing longer. Total response must fit comfortably in 2200 tokens.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{"title": "short title", "context_markdown": "dataset description in markdown", "parts": ["part 1 text", "part 2 text", "part 3 text", "part 4 text (optional)"], "hidden_solution_markdown": "the full correct solution for ALL parts"}`
}

function evalSystem(archetype: string) {
  return `You are evaluating Shubhi's answer to a multi-part interview coding drill question (archetype: ${archetype}). She was given 3-4 escalating parts, one revealed at a time, and her final code reflects her cumulative answer across all of them.
${KNOWN_GAPS}
GRADING SCALE (grade the whole sequence holistically):
A - Correct across all parts, handled NULLs proactively, stated plan before writing, clean structure, adapted cleanly as parts escalated
B - Correct logic overall, missed NULL handling or needed a prompt, minor structure issue, or struggled with one part
C - Correct output but wrong approach on at least one part, or missed an edge case
D - Logic error in the final output, or imported scipy/statsmodels for a simulation

Also score EACH part individually as "correct", "partial", or "incorrect" - partial means the right idea but a flaw in execution.

Separately, list any concrete SYNTAX issues in her code as short specific strings. If there are none, return an empty array.

Ask exactly ONE follow-up question, chosen from: business translation, what-if extension, or mechanics.

Respond with ONLY valid JSON, no markdown fences, no preamble, matching exactly this shape:
{"grade": "A", "part_scores": [{"part": 1, "status": "correct", "note": "one sentence"}], "syntax_issues": ["issue"], "evaluation_markdown": "3-5 sentences of evaluation in markdown", "follow_up_question": "one follow-up question"}`
}

const FOLLOWUP_SYSTEM = `You are giving brief, direct feedback (2-3 sentences, markdown) on Shubhi's answer to a single follow-up interview question. Be specific about whether her reasoning is sound. Respond with ONLY valid JSON, no fences: {"feedback_markdown": "..."}`

const ASK_SYSTEM = `You are playing the technical interviewer during a live coding interview. The candidate (Shubhi, a Senior DS) has a clarifying question.

Judge the maturity of the question honestly:
- "strong": genuinely ambiguous, would materially change her approach
- "ok": reasonable but answerable by re-reading the schema
- "weak": already explicitly stated in the context

Answer AS the interviewer — concise, 1-3 sentences. Do not reveal the solution.

Respond with ONLY valid JSON, no fences:
{"maturity": "strong", "response": "the answer", "note": "one private coaching note"}`

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
async function callClaude(systemPrompt: string, userPrompt: string, maxTokens: number = 2600) {
  const res = await fetch("/api/drill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, userPrompt, maxTokens }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`)
  const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n")
  if (!text) throw new Error("Empty response from model")
  return text
}

function parseJSON(text: string) {
  const clean = text.replace(/```json|```/g, "").trim()
  try { return JSON.parse(clean) }
  catch { throw new Error("Couldn't parse model output as JSON: " + clean.slice(0, 300)) }
}

function mdToHtml(md: string) {
  if (!md) return ""
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _l, c) => `<pre><code>${c}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^### (.*)$/gm, "<h4>$1</h4>")
    .replace(/^## (.*)$/gm, "<h4>$1</h4>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*-\s+(.*)$/gm, "<li>$1</li>")
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => "<ul>" + m + "</ul>")
  html = html.split(/\n{2,}/).map((p) =>
    p.startsWith("<h4") || p.startsWith("<ul") || p.startsWith("<pre") ? p : `<p>${p.replace(/\n/g, "<br>")}</p>`
  ).join("")
  return html
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0")
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
type View = "picker" | "question" | "summary" | "history"

export default function CoderPadClient({ userEmail, onBack }: { userEmail: string; onBack: () => void }) {
  const [view, setView] = useState<View>("picker")
  const [dayType, setDayType] = useState("")
  const [archetypes, setArchetypes] = useState<string[]>([])
  const [idx, setIdx] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [archetype, setArchetype] = useState("")
  const [partIndex, setPartIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null)
  const [grades, setGrades] = useState<string[]>([])
  const [clarifyLog, setClarifyLog] = useState<ClarifyItem[]>([])
  const [loading, setLoading] = useState("")
  const [error, setError] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerContent, setDrawerContent] = useState("")
  const [followupAnswer, setFollowupAnswer] = useState("")
  const [followupFeedback, setFollowupFeedback] = useState("")
  const [solutionShown, setSolutionShown] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [askInput, setAskInput] = useState("")
  const [askLoading, setAskLoading] = useState(false)

  // Timer
  const [secondsLeft, setSecondsLeft] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback((minutes: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    let s = minutes * 60
    setSecondsLeft(s)
    timerRef.current = setInterval(() => {
      s--
      setSecondsLeft(s)
      if (s <= 0) { if (timerRef.current) clearInterval(timerRef.current) }
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  // Textarea line sync
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumRef = useRef<HTMLDivElement>(null)
  const lineCount = answer.split("\n").length

  function syncScroll() {
    if (textareaRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  /* ---- Start a day ---- */
  async function startDay(day: string) {
    const seqs = SEQUENCES[day]
    setDayType(day)
    setArchetypes(seqs)
    setIdx(0)
    setGrades([])
    await loadQuestion(day, seqs, 0)
  }

  async function loadQuestion(day: string, seqs: string[], qIdx: number) {
    const arch = seqs[qIdx]
    setArchetype(arch)
    setPartIndex(0)
    setAnswer("")
    setEvalResult(null)
    setDrawerOpen(false)
    setDrawerContent("")
    setFollowupAnswer("")
    setFollowupFeedback("")
    setSolutionShown(false)
    setClarifyLog([])
    setQuestion(null)
    setView("question")
    setLoading(`generating question ${qIdx + 1} of ${seqs.length}...`)
    setError("")

    try {
      const raw = await callClaude(genSystem(arch), `Generate the question now. Archetype: ${arch}.`, 2600)
      const q = parseJSON(raw) as Question
      setQuestion(q)
      setLoading("")
      startTimer(TIME_LIMITS[arch])
    } catch (err: any) {
      setLoading("")
      setError(err?.message || "Failed to generate question")
    }
  }

  /* ---- Submit answer ---- */
  async function submitAnswer() {
    stopTimer()
    setDrawerOpen(true)
    setDrawerContent("")
    setLoading("evaluating...")

    try {
      const q = question!
      const partsText = q.parts.map((p, i) => `Part ${i + 1}: ${p}`).join("\n\n")
      const userPrompt = `QUESTION CONTEXT:\n${q.context_markdown}\n\nQUESTION PARTS (all revealed, in order):\n${partsText}\n\nHER FINAL CUMULATIVE ANSWER (covers all parts):\n${answer || "(no answer submitted)"}\n\nEvaluate now.`
      const raw = await callClaude(evalSystem(archetype), userPrompt, 1600)
      const result = parseJSON(raw) as EvalResult
      setEvalResult(result)
      setGrades((prev) => [...prev, result.grade])
      setLoading("")
      saveHistoryEntry(result, q.parts.length)
    } catch (err: any) {
      setLoading("")
      setError(err?.message || "Failed to evaluate")
    }
  }

  /* ---- Follow-up ---- */
  async function submitFollowup() {
    setFollowupFeedback("")
    setLoading("checking...")
    try {
      const q = question!
      const userPrompt = `Original question (all parts):\n${q.parts.join("\n\n")}\n\nFollow-up question: ${evalResult!.follow_up_question}\n\nHer follow-up answer: ${followupAnswer || "(no answer)"}`
      const raw = await callClaude(FOLLOWUP_SYSTEM, userPrompt, 600)
      const result = parseJSON(raw)
      setFollowupFeedback(result.feedback_markdown)
      setSolutionShown(true)
      setLoading("")
    } catch (err: any) {
      setFollowupFeedback("Error: " + (err?.message || "unknown"))
      setLoading("")
    }
  }

  /* ---- Ask interviewer ---- */
  async function askClarifying() {
    const q = askInput.trim()
    if (!q || !question) return
    setAskInput("")
    setAskLoading(true)
    const pendingItem: ClarifyItem = { question: q, response: "thinking...", maturity: "" }
    setClarifyLog((prev) => [...prev, pendingItem])
    try {
      const revealedParts = question.parts.slice(0, partIndex + 1)
      const userPrompt = `QUESTION CONTEXT:\n${question.context_markdown}\n\nPARTS REVEALED SO FAR:\n${revealedParts.map((p, i) => `Part ${i + 1}: ${p}`).join("\n\n")}\n\nHER CLARIFYING QUESTION:\n${q}`
      const raw = await callClaude(ASK_SYSTEM, userPrompt, 350)
      const result = parseJSON(raw)
      setClarifyLog((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { question: q, response: result.response, maturity: result.maturity, note: result.note }
        return updated
      })
    } catch {
      setClarifyLog((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = { ...updated[updated.length - 1], response: "Couldn't reach the interviewer", maturity: "" }
        return updated
      })
    } finally {
      setAskLoading(false)
    }
  }

  /* ---- History ---- */
  async function saveHistoryEntry(result: EvalResult, totalParts: number) {
    try {
      const partScores = result.part_scores || []
      const entry = {
        day_type: dayType, archetype, title: question?.title || "",
        grade: result.grade,
        correct: partScores.filter((p) => p.status === "correct").length,
        partial: partScores.filter((p) => p.status === "partial").length,
        incorrect: partScores.filter((p) => p.status === "incorrect").length,
        total_parts: totalParts,
        syntax_issue_count: (result.syntax_issues || []).length,
        questions_asked: clarifyLog.length,
        questions_strong: clarifyLog.filter((c) => c.maturity === "strong").length,
        questions_ok: clarifyLog.filter((c) => c.maturity === "ok").length,
        questions_weak: clarifyLog.filter((c) => c.maturity === "weak").length,
      }
      await fetch("/api/drill-history", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry) })
    } catch (e) { console.error("Could not save history:", e) }
  }

  async function loadHistory() {
    setView("history")
    setLoading("loading history...")
    try {
      const res = await fetch("/api/drill-history")
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setHistory(data.history || [])
      setLoading("")
    } catch (err: any) {
      setError(err?.message || "Failed to load history")
      setLoading("")
    }
  }

  /* ---- Advance parts / next question ---- */
  function advancePart() {
    if (!question) return
    if (partIndex < question.parts.length - 1) {
      setPartIndex((p) => p + 1)
    } else {
      submitAnswer()
    }
  }

  function nextQuestion() {
    const nextIdx = idx + 1
    setIdx(nextIdx)
    loadQuestion(dayType, archetypes, nextIdx)
  }

  /* ---- Timer display ---- */
  const timerClass = secondsLeft <= 30 ? "cp-timer crit" : secondsLeft <= 120 ? "cp-timer warn" : "cp-timer"

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="cp-root" id="cpRoot">
      {/* Top bar */}
      <div className="cp-topbar">
        <div className="cp-logo">
          <span className="dot">&#9670;</span> DRILL PAD
          <span className="cp-mode-label">CODING</span>
        </div>
        <div className="cp-tabs">
          {Object.keys(SEQUENCES).map((day) => (
            <button
              key={day}
              className={`cp-tab ${dayType === day && view === "question" ? "active" : ""}`}
              disabled={view === "question" && !!loading}
              onClick={() => startDay(day)}
            >
              {day.toUpperCase()}
            </button>
          ))}
        </div>
        <div className={timerClass}>{view === "question" && question ? fmtTime(Math.max(secondsLeft, 0)) : "--:--"}</div>
        <button className="cp-btn secondary cp-small-btn" onClick={loadHistory}>History</button>
        <button className="cp-btn secondary cp-small-btn" onClick={onBack}>Back</button>
      </div>

      {/* Body */}
      <div className="cp-body">
        {/* Loading state */}
        {loading && (
          <div className="cp-loading">
            <div className="cp-spinner" />
            {loading}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="cp-empty">
            <h3>Error</h3>
            <p>{error}</p>
            <button className="cp-btn secondary" onClick={() => { setError(""); setView("picker") }}>Back</button>
          </div>
        )}

        {/* Picker */}
        {view === "picker" && !loading && !error && (
          <div className="cp-empty">
            <h3>Pick a day type to start</h3>
            <p>SQL Day &rarr; 2 SQL problems &bull; Python Day &rarr; Pandas + Simulation &bull; Weekend &rarr; AI-assisted investigation + code reading &bull; Mixed &rarr; 1 SQL + 1 Simulation</p>
          </div>
        )}

        {/* Question view */}
        {view === "question" && question && !loading && !error && (
          <>
            <div className="cp-qpanel">
              <div className="cp-qheader">
                <span className="cp-badge lang">{LANG[archetype]}</span>
                <span className="cp-badge progress">Q{idx + 1} of {archetypes.length} &bull; {dayType}</span>
              </div>
              <div className="cp-qtitle">{question.title}</div>
              <div className="cp-qbody">
                <h4>Context</h4>
                <div dangerouslySetInnerHTML={{ __html: mdToHtml(question.context_markdown) }} />
                {question.parts.slice(0, partIndex + 1).map((part, i) => (
                  <div key={i}>
                    <h4>Part {i + 1}{i === partIndex && partIndex < question.parts.length - 1 ? " (current)" : ""}</h4>
                    <div dangerouslySetInnerHTML={{ __html: mdToHtml(part) }} />
                  </div>
                ))}
                {partIndex < question.parts.length - 1 && (
                  <p className="cp-parts-hint">{question.parts.length - partIndex - 1} more part{question.parts.length - partIndex - 1 === 1 ? "" : "s"} unlock as you go.</p>
                )}
              </div>

              {/* Ask the interviewer */}
              <div className="cp-ask-section">
                <h4>Ask the interviewer</h4>
                <p className="cp-ask-hint">If something is genuinely ambiguous, ask before you code.</p>
                <div className="cp-ask-log">
                  {clarifyLog.map((item, i) => (
                    <div key={i} className="cp-ask-item">
                      {item.maturity && (
                        <span className="cp-maturity-badge" style={{ background: MATURITY_COLOR[item.maturity] || "var(--cp-muted)" }}>
                          {MATURITY_LABEL[item.maturity] || item.maturity.toUpperCase()}
                        </span>
                      )}
                      <div className="cp-ask-q">You: {item.question}</div>
                      <div className="cp-ask-a">Interviewer: {item.response}</div>
                      {item.note && <div className="cp-ask-note">{item.note}</div>}
                    </div>
                  ))}
                </div>
                <div className="cp-ask-input-row">
                  <input
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); askClarifying() } }}
                    placeholder='e.g. should cancelled trips count toward this?'
                    disabled={askLoading}
                  />
                  <button className="cp-btn secondary" onClick={askClarifying} disabled={askLoading}>Ask</button>
                </div>
              </div>
            </div>

            {/* Editor panel */}
            <div className="cp-editorpanel">
              <div className="cp-editortabs">
                <div className="cp-filetab">
                  <span className="dot" /> {LANG[archetype] === "sql" ? "answer.sql" : "answer.py"}
                </div>
              </div>
              <div className="cp-editorwrap">
                <div className="cp-linenums" ref={lineNumRef}>
                  {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
                </div>
                <textarea
                  ref={textareaRef}
                  className="cp-textarea"
                  spellCheck={false}
                  placeholder="-- write your answer here, it carries forward through every part"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onScroll={syncScroll}
                />
              </div>
              <div className="cp-editorfooter">
                <span className="cp-meta">{lineCount} line{lineCount === 1 ? "" : "s"} &bull; {answer.length} chars</span>
                <div className="cp-row-btns">
                  <button className="cp-btn ghost" onClick={() => { setDrawerOpen(true); setDrawerContent("hint") }}>Hint</button>
                  <button className="cp-btn primary" onClick={advancePart}>
                    {partIndex >= question.parts.length - 1 ? "Submit final answer" : `Continue to part ${partIndex + 2}`}
                  </button>
                </div>
              </div>

              {/* Drawer */}
              {drawerOpen && (
                <div className="cp-drawer open">
                  {drawerContent === "hint" && (
                    <p style={{ color: "var(--cp-muted)", fontStyle: "italic" }}>
                      Hint: reconsider which clause or concept the question is really testing before you look at the schema again.
                    </p>
                  )}
                  {evalResult && (
                    <>
                      <div className="cp-grade-row">
                        <div className="cp-grade-chip" style={{ background: GRADE_COLOR[evalResult.grade] || "var(--cp-muted)" }}>{evalResult.grade}</div>
                        <div dangerouslySetInnerHTML={{ __html: mdToHtml(evalResult.evaluation_markdown) }} />
                      </div>

                      {evalResult.part_scores.length > 0 && (
                        <>
                          <h5>Score &mdash; {evalResult.part_scores.filter(p => p.status === "correct").length} correct, {evalResult.part_scores.filter(p => p.status === "partial").length} partial, {evalResult.part_scores.filter(p => p.status === "incorrect").length} missed</h5>
                          <div className="cp-score-list">
                            {evalResult.part_scores.map((p, i) => (
                              <div key={i} className="cp-score-row">
                                <span className="cp-score-badge" style={{ background: STATUS_COLOR[p.status] || "var(--cp-muted)" }}>
                                  PART {p.part} &mdash; {STATUS_LABEL[p.status] || p.status}
                                </span>
                                <span>{p.note}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {evalResult.syntax_issues.length > 0 && (
                        <>
                          <h5>Syntax issues flagged</h5>
                          <ul className="cp-syntax-list">
                            {evalResult.syntax_issues.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </>
                      )}

                      <h5>Follow-up</h5>
                      <p>{evalResult.follow_up_question}</p>
                      {!followupFeedback && !solutionShown && (
                        <div className="cp-followup-box">
                          <textarea
                            value={followupAnswer}
                            onChange={(e) => setFollowupAnswer(e.target.value)}
                            placeholder="your answer..."
                          />
                          <div className="cp-row-btns">
                            <button className="cp-btn secondary" onClick={submitFollowup}>Submit follow-up</button>
                            <button className="cp-btn ghost" onClick={() => setSolutionShown(true)}>Skip to solution</button>
                          </div>
                        </div>
                      )}

                      {followupFeedback && (
                        <>
                          <h5>Feedback</h5>
                          <div dangerouslySetInnerHTML={{ __html: mdToHtml(followupFeedback) }} />
                        </>
                      )}

                      {solutionShown && (
                        <>
                          <h5>Solution</h5>
                          <div dangerouslySetInnerHTML={{ __html: mdToHtml(question?.hidden_solution_markdown || "") }} />
                          <div className="cp-row-btns" style={{ marginTop: 14 }}>
                            {idx < archetypes.length - 1 ? (
                              <button className="cp-btn primary" onClick={nextQuestion}>Next question &rarr;</button>
                            ) : (
                              <button className="cp-btn primary" onClick={() => setView("summary")}>Finish day</button>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Summary */}
        {view === "summary" && (
          <div className="cp-summary">
            <h3>{dayType.toUpperCase()} DAY &mdash; DONE</h3>
            <p className="cp-summary-sub">{archetypes.length} question{archetypes.length === 1 ? "" : "s"} completed</p>
            <div className="cp-summary-grades">
              {grades.map((g, i) => (
                <div key={i} className="cp-grade-chip" style={{ background: GRADE_COLOR[g] || "var(--cp-muted)" }}>{g}</div>
              ))}
            </div>
            <div className="cp-row-btns" style={{ justifyContent: "center" }}>
              <button className="cp-btn primary" onClick={() => { setView("picker"); setDayType("") }}>Run another day</button>
              <button className="cp-btn secondary" onClick={loadHistory}>View history</button>
            </div>
          </div>
        )}

        {/* History */}
        {view === "history" && !loading && !error && (
          <div className="cp-history">
            <div className="cp-history-header">
              <h3>Coding Session History</h3>
              <button className="cp-btn secondary cp-small-btn" onClick={() => { setView("picker"); setDayType("") }}>Back</button>
            </div>
            {history.length === 0 ? (
              <div className="cp-empty">
                <h3>No sessions logged yet</h3>
                <p>Finish a question and your grade will show up here.</p>
              </div>
            ) : (
              <>
                <div className="cp-history-stats">
                  <div>
                    <div className="cp-stat-num" style={{ color: "var(--cp-accent)" }}>
                      {history.reduce((s, h) => s + (h.total_parts || 0), 0) > 0
                        ? Math.round((history.reduce((s, h) => s + (h.correct || 0), 0) / history.reduce((s, h) => s + (h.total_parts || 0), 0)) * 100)
                        : 0}%
                    </div>
                    <div className="cp-stat-label">parts correct</div>
                  </div>
                  <div>
                    <div className="cp-stat-num">{history.length}</div>
                    <div className="cp-stat-label">questions completed</div>
                  </div>
                  <div>
                    <div className="cp-stat-num" style={{ color: history.reduce((s, h) => s + (h.syntax_issue_count || 0), 0) ? "var(--cp-coral)" : "var(--cp-accent)" }}>
                      {history.reduce((s, h) => s + (h.syntax_issue_count || 0), 0)}
                    </div>
                    <div className="cp-stat-label">syntax issues</div>
                  </div>
                  <div>
                    <div className="cp-stat-num" style={{ color: "var(--cp-blue)" }}>
                      {history.reduce((s, h) => s + (h.questions_asked || 0), 0)}
                    </div>
                    <div className="cp-stat-label">questions asked</div>
                  </div>
                </div>
                <div className="cp-history-list">
                  {[...history].reverse().map((h, i) => (
                    <div key={i} className="cp-history-row">
                      <div className="cp-grade-chip cp-grade-small" style={{ background: GRADE_COLOR[h.grade] || "var(--cp-muted)" }}>{h.grade || "?"}</div>
                      <div className="cp-history-info">
                        <div className="cp-history-title">{h.title || h.archetype}</div>
                        <div className="cp-history-meta">
                          {new Date(h.created_at || "").toLocaleDateString()} &bull; {h.day_type} &bull; {h.archetype} &bull; {h.correct}/{h.total_parts} correct
                          {h.syntax_issue_count ? ` • ${h.syntax_issue_count} syntax issue${h.syntax_issue_count === 1 ? "" : "s"}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="cp-statusbar">
        <span className="gap">tracking &rarr; <b>NULL handling</b></span>
        <span className="gap"><b>window functions</b> under pressure</span>
        <span className="gap"><b>transform</b> vs groupby+merge</span>
        <span className="gap">named aggregation syntax</span>
        <span className="gap">explicit merge how=</span>
        <span className="gap">no scipy/statsmodels in simulations</span>
      </div>
    </div>
  )
}
