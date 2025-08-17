'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { forgotPassword } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const toast = useToast()

const handleSubmit = async (e) => {
  e.preventDefault()

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    toast.error('Please enter your email')
    return
  }
  if (!emailRegex.test(email)) {
    toast.error('Please enter a valid email address')
    return
  }

  setLoading(true)
  try {
    await forgotPassword(email)
    toast.success('Check your email for the reset link.', 1200)
  } catch (err) {
    const msg = String(err?.message || 'Failed to send reset link')
    toast.error(msg)
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <button onClick={() => router.back()} style={styles.backButton}>←</button>
        <h2 style={styles.title}>Forgot password</h2>
        <p style={styles.subtitle}>Please enter your email to reset the password</p>
        
        <form onSubmit={handleSubmit}>
          <label style={{...styles.label, color: 'black'}}>Your Email</label>
          <input
            type="email"
            required
            placeholder="Enter your email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{...styles.input, color: 'black'}}
          />
          <button type="submit" style={styles.submitButton}>Reset Password</button>
        </form>
        <p style={styles.minitext}>Already remember your password? <a href="/login">Back to login</a></p>
      </div>
    </div>
  )
}

const styles = {
    minitext: {
        color: "#888",

    },
  wrapper: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '16px',
    width: 'min(420px, 92vw)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: '16px',
    top: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
  },
  title: {
    marginTop: '24px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#555'
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: "#555"
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    marginBottom: '20px',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  }
}
