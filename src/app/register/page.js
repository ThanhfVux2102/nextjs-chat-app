
'use client'
import { useState } from 'react'
import { register } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './register.css'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match')
      return
    }

    try {
      const res = await register(form.email, form.username, form.password)
      setMessage('Registration successful!')
      router.push('/login')
    } catch (error) {
      setMessage(error.message || 'Registration failed')
    }

  }



  return (
    <div className="register-container">
      <div className="register-image-section">
        <img
          src="/register.jpg"
          alt="Register background"
        />
      </div>

      <div className="register-form-section">
        <form onSubmit={handleSubmit} className="register-form">
          <h2>REGISTER YOUR ACCOUNT</h2>
          <input name="username" placeholder="Username" onChange={handleChange} value={form.username} required style={{
            color: 'black', border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }} />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} value={form.email} required style={{
            color: 'black', border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }} />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} required autoComplete="new-password" style={{
            color: 'black', border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} value={form.confirmPassword} required autoComplete="new-password" style={{
            color: 'black', border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }} />
          <button type="submit" className="register-btn">Register</button>
          {message && <p style={{ color: 'red', marginTop: 10 }}>{message}</p>}

          <p style={{ marginTop: '10px', textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#15240cff', textDecoration: 'underline' }}>
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
