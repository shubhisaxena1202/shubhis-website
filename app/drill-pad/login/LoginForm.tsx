"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/drill-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || "Sign-in failed")
        setLoading(false)
        return
      }
      router.push("/drill-pad")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Network error")
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.brand}>&#9671; DRILL PAD</div>
        <h1 style={styles.title}>Sign in</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
          autoComplete="current-password"
        />
        {error && <div style={styles.error}>{error}</div>}
        <button disabled={loading} type="submit" style={styles.button}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0D1210",
    color: "#E9EDE7",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  card: {
    width: 320,
    padding: 26,
    border: "1px solid #26332C",
    borderRadius: 10,
    background: "#141B18",
  },
  brand: {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    color: "#F2A63E",
    fontSize: 12,
    letterSpacing: "0.08em",
    marginBottom: 10,
  },
  title: { fontSize: 16, margin: "0 0 18px", fontWeight: 600 },
  input: {
    width: "100%",
    padding: 11,
    marginBottom: 10,
    background: "#0D1210",
    border: "1px solid #26332C",
    borderRadius: 6,
    color: "#E9EDE7",
    fontSize: 13,
  },
  error: { color: "#E0645A", fontSize: 12, marginBottom: 10 },
  button: {
    width: "100%",
    padding: 11,
    background: "#F2A63E",
    color: "#20150A",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    cursor: "pointer",
  },
}
