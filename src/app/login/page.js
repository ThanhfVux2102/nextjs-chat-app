'use client'
import { login } from '@/lib/api'
import React, { useState } from 'react'
import './login.css'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const Login = () => {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async () => {
    try {
      const res = await login(email, password);
      setMessage('Đăng nhập thành công!');
      router.push('/chat');
    } catch (err) {
      console.error('Login error', err);
      setMessage(err.message || 'Lỗi kết nối tới máy chủ');
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
            <Link
              href="/forget-password"
              style={{ color: '#0070f3', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Forgot Password?
            </Link>
        </div>

        <button className="btn-black" onClick={handleLogin}>Login Now</button>

        {message && <p style={{ color: 'red', marginTop: 10 }}>{message}</p>}
      </div>
      <div className="image-section">
      <img src="/background.jpg" alt="team" />
    </div>
    </div>
  )
}


export default Login
