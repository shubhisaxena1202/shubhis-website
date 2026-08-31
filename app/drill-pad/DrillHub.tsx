"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

const DrillPadClient = dynamic(() => import("./DrillPadClient"), { ssr: false })
const CoderPadClient = dynamic(() => import("./CoderPadClient"), { ssr: false })

type Mode = "hub" | "experimentation" | "coding"

export default function DrillHub({ userEmail }: { userEmail: string }) {
  const [mode, setMode] = useState<Mode>("hub")

  if (mode === "experimentation") {
    return <DrillPadClient userEmail={userEmail} onBack={() => setMode("hub")} />
  }

  if (mode === "coding") {
    return <CoderPadClient userEmail={userEmail} onBack={() => setMode("hub")} />
  }

  /* ---- Hub / mode picker ---- */
  return (
    <div className="hub-root">
      <div className="hub-bg" />
      <div className="hub-content">
        <div className="hub-header">
          <span className="hub-dot">&#9670;</span>
          <h1>DRILL PAD</h1>
          <p className="hub-sub">Interview practice hub</p>
        </div>

        <div className="hub-cards">
          <button className="hub-card" onClick={() => setMode("experimentation")}>
            <div className="hub-card-icon">&#9881;</div>
            <div className="hub-card-info">
              <h2>Experimentation Drills</h2>
              <p>
                A/B testing, experiment design, metrics, OVB, guardrails,
                communication &mdash; the full DS interview arc.
              </p>
              <div className="hub-card-tags">
                <span>Case Day</span>
                <span>Mechanics Day</span>
                <span>Communication Day</span>
                <span>Weekend</span>
              </div>
            </div>
            <span className="hub-arrow">&rarr;</span>
          </button>

          <button className="hub-card" onClick={() => setMode("coding")}>
            <div className="hub-card-icon">&#9638;</div>
            <div className="hub-card-info">
              <h2>Coding Drills</h2>
              <p>
                SQL, Pandas, statistical simulations, code reading, AI investigation
                &mdash; timed problems with multi-part escalation.
              </p>
              <div className="hub-card-tags">
                <span>SQL Day</span>
                <span>Python Day</span>
                <span>Weekend</span>
                <span>Mixed</span>
              </div>
            </div>
            <span className="hub-arrow">&rarr;</span>
          </button>
        </div>

        <p className="hub-email">{userEmail}</p>
      </div>

      <style>{`
        .hub-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          color: #E9EDE7;
        }
        .hub-bg {
          position: fixed;
          inset: 0;
          background-color: #0D1210;
          background-image:
            linear-gradient(#26332C 1px, transparent 1px),
            linear-gradient(90deg, #26332C 1px, transparent 1px);
          background-size: 28px 28px;
          z-index: 0;
        }
        .hub-content {
          position: relative;
          z-index: 1;
          max-width: 620px;
          width: 100%;
          padding: 40px 24px;
        }
        .hub-header {
          text-align: center;
          margin-bottom: 36px;
        }
        .hub-dot {
          color: #F2A63E;
          font-size: 18px;
          text-shadow: 0 0 12px #F2A63E;
        }
        .hub-header h1 {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.04em;
          margin: 8px 0 6px;
        }
        .hub-sub {
          color: #8FA098;
          font-size: 14px;
          margin: 0;
        }
        .hub-cards {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .hub-card {
          display: flex;
          align-items: center;
          gap: 18px;
          background: #141B18;
          border: 1px solid #26332C;
          border-radius: 10px;
          padding: 22px 20px;
          text-align: left;
          color: #E9EDE7;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          width: 100%;
        }
        .hub-card:hover {
          border-color: #F2A63E;
          background: rgba(242,166,62,0.05);
        }
        .hub-card-icon {
          font-size: 28px;
          color: #F2A63E;
          flex-shrink: 0;
          width: 44px;
          text-align: center;
        }
        .hub-card-info {
          flex: 1;
          min-width: 0;
        }
        .hub-card-info h2 {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 6px;
        }
        .hub-card-info p {
          font-size: 13px;
          line-height: 1.55;
          color: #8FA098;
          margin: 0 0 10px;
        }
        .hub-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .hub-card-tags span {
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 2px 8px;
          border-radius: 3px;
          border: 1px solid #26332C;
          color: #8FA098;
        }
        .hub-arrow {
          font-size: 20px;
          color: #8FA098;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .hub-card:hover .hub-arrow { color: #F2A63E; }
        .hub-email {
          text-align: center;
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          font-size: 11px;
          color: #8FA098;
          margin: 32px 0 0;
          opacity: 0.6;
        }
        @media (max-width: 600px) {
          .hub-card { flex-direction: column; align-items: flex-start; gap: 10px; }
          .hub-arrow { display: none; }
        }
      `}</style>
    </div>
  )
}
