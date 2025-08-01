'use client'

import React, { useState } from 'react'
import './login.css'
import { useRouter } from 'next/navigation'

const Login = () => {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Gửi cookie
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessage(err.detail || 'Login failed')
        return
      }

      setMessage('Đăng nhập thành công!')
      router.push('/chat') // load to main page
    } catch (err) {
      setMessage('Lỗi kết nối tới máy chủ')
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <img src="/lock-icon.png" alt="lock icon" />
          </div>
        </div>

        <div className="options">
          <label><input type="checkbox" /> Remember me?</label>
          <a href="#">Forgot Password?</a>
        </div>

        <button className="btn-black" onClick={handleLogin}>Login Now</button>

        {message && <p style={{ color: 'red', marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  )
}

export default Login
