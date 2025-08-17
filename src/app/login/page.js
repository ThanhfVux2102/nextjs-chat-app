'use client'
import { login, getCurrentUser } from '@/lib/api'
import React, { useState } from 'react'
import './login.css'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

const Login = () => {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  const toast = useToast()


  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !password) {
      toast.error('Please fill in both email and password')
      return
    }
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setLoading(true)
    try {
      // First, perform the login
      await login(email, password)

      // After successful login, get current user data from /api/auth/me
      const currentUserData = await getCurrentUser()

      if (!currentUserData || !currentUserData.user_id) {
        throw new Error('Failed to get user data from server')
      }

      // Use server-provided user_id and username instead of client-generated fallbacks
      const userData = {
        id: currentUserData.user_id,
        user_id: currentUserData.user_id,
        username: currentUserData.username,
        email: email, // Keep email from login form
        avatar: '/avatars/default.jpg', // Default avatar
      }

      authLogin(userData)

      toast.success('Login successful! Redirecting...', 1200)
      setTimeout(() => {
        router.replace('/chat')
      }, 1000)
    } catch (err) {
      console.error('Login error', err)
      const msg = String(err?.message || '')
      if (err?.status === 401 || /invalid|wrong|credential/i.test(msg)) {
        toast.error('Incorrect email or password')
      } else if (err?.status === 400 && /email/i.test(msg)) {
        toast.error('Please enter a valid email address')
      } else {
        toast.error('Server error. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="login-container">
      <div className="form-section">
        <h2>LOGIN INTO YOUR ACCOUNT</h2>

        <div className="form-group">
          <label>Email Address</label>
          <div className="input-icon">
            <input
              type="email"
              placeholder="alex@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <img src="/email-icon.png" alt="email icon" />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-icon">
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="off"
              onChange={(e) => setPassword(e.target.value)}
            />
            <img src="/lock-icon.png" alt="lock icon" />
          </div>
        </div>

        <div className="options">
          <label><input type="checkbox" /> Remember me?</label>
          <Link
            href="/forget-password"
            style={{ color: '#15240cff', textDecoration: 'underline', cursor: 'pointer' }}
          >
            Forgot Password?
          </Link>
          <Link href="/register" style={{ color: '#15240cff', textDecoration: 'underline' }}>
            Back to Register
          </Link>
        </div>

        <button className="btn-black" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Login Now'}
        </button>
      </div>
      <div className="image-section">
        <img src="/background.jpg" alt="team" />
      </div>
    </div>
  )
}


export default Login
