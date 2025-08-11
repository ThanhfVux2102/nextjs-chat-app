'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { resetPassword } from '@/lib/api'

export default function ResetPasswordCompatPage() {
  const router = useRouter()
  const { token } = useParams()

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg('')

    if (!token) {
      setMsg('Missing reset token. Please open the link from your email again.')
      return
    }
    if (pw1.length < 8) {
      setMsg('Password must be at least 8 characters.')
      return
    }
    if (pw1 !== pw2) {
      setMsg('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      await resetPassword(token, pw1, pw2)
      router.push('/login')
    } catch (err) {
      setMsg(err?.message ?? 'Failed to reset password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.screen}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>
          We sent a reset link to <b>your gmail</b><br />
          enter new password, please
        </p>
        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 16 }}>
          <input
            type="password"
            placeholder="new password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="new password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            style={{ ...styles.input, marginTop: 12 }}
            required
          />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        {msg && <p style={styles.error}>{msg}</p>}
        <p style={styles.resend}>
          Haven’t got the email yet?{' '}
          <a href="/forget-password" style={styles.resendLink}>Resend email</a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  screen: {
    minHeight: '100vh',
    background: '#505050',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  card: {
    width: 420,
    maxWidth: '90vw',
    background: '#fff',
    borderRadius: 20,
    padding: '24px 28px 28px',
    boxShadow: '0 10px 30px rgba(0,0,0,.25)',
    position: 'relative'
  },
  title: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 22,
    fontWeight: 700,
    color: '#222'
  },
  subtitle: {
    margin: 0,
    color: '#7a7a7a',
    fontSize: 14,
    lineHeight: 1.5
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 8,
    border: '1px solid #dadada',
    outline: 'none',
    padding: '0 14px',
    fontSize: 14,
    color: '#222',
    background: '#fff'
  },
  btn: {
    marginTop: 18,
    width: '100%',
    height: 46,
    borderRadius: 10,
    border: 'none',
    background: '#000',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer'
  },
  resend: {
    marginTop: 16,
    textAlign: 'center',
    color: '#9a9a9a',
    fontSize: 14
  },
  resendLink: {
    color: '#000',
    textDecoration: 'underline',
    fontWeight: 600
  },
  error: {
    marginTop: 10,
    color: '#d32f2f',
    fontSize: 14
  }
}
