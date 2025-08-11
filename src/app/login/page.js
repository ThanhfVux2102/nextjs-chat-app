'use client'
import { login } from '@/lib/api'
import React, { useState } from 'react'
import './login.css'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const Login = () => {
  const router = useRouter()
  const { login: authLogin } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please fill in all fields')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await login(email, password)
      console.log('Login response:', res)
      
      // Store user data in auth context - use the actual user ID from backend
      const userData = {
        id: res.user?.id || res.id || Date.now(), // Try multiple possible ID fields
        email: email,
        username: res.user?.username || res.username || email.split('@')[0],
        avatar: res.user?.avatar || res.avatar || '/avatars/default.jpg'
      }
      
      console.log('Storing user data:', userData)
      authLogin(userData)
      setMessage('Login successful!')
      
      // Redirect to chat after a short delay
      setTimeout(() => {
        router.push('/chat')
      }, 1000)
      
    } catch (err) {
      console.error('Login error', err)
      setMessage(err.message || 'Connection error to server')
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
              disabled={loading}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
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

        <button 
          className="btn-black" 
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login Now'}
        </button>

        {message && (
          <p style={{ 
            color: message.includes('successful') ? 'green' : 'red', 
            marginTop: 10,
            textAlign: 'center'
          }}>
            {message}
          </p>
        )}
      </div>
      <div className="image-section">
      <img src="/background.jpg" alt="team" />
    </div>
    </div>
  )
}

export default Login
