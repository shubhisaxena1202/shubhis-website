'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      if (!data.session) {
        setError('Sign-in succeeded but no session was returned.')
        setLoading(false)
        return
      }
      router.push('/drill-pad')
      router.refresh()
    } catch (err: any) {
      setError(err?.message || 'Unexpected error — check browser console.')
      console.error('Login error:', err)
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <div style={styles.brand}>◇ DRILL PAD</div>
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
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0D1210',
    color: '#E9EDE7',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  },
  card: {
    width: 320,
    padding: 26,
    border: '1px solid #26332C',
    borderRadius: 10,
    background: '#141B18',
  },
  brand: {
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    color: '#F2A63E',
    fontSize: 12,
    letterSpacing: '0.08em',
    marginBottom: 10,
  },
  title: { fontSize: 16, margin: '0 0 18px', fontWeight: 600 },
  input: {
    width: '100%',
    padding: 11,
    marginBottom: 10,
    background: '#0D1210',
    border: '1px solid #26332C',
    borderRadius: 6,
    color: '#E9EDE7',
    fontSize: 13,
  },
  error: { color: '#E0645A', fontSize: 12, marginBottom: 10 },
  button: {
    width: '100%',
    padding: 11,
    background: '#F2A63E',
    color: '#20150A',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
    cursor: 'pointer',
  },
}
