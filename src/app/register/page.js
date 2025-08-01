// src/app/register/page.js
'use client'
import { useState } from 'react'

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match')
      return
    }

  }

return (
  <div style={{ display: 'flex', height: '100vh' }}>
    
    <div style={{ flex: 7, backgroundColor: '#e0e0e0' }}>
      { <img
    src="/register.jpg"
    alt="Login background"
    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
  />}
    </div>

    {/* Bên phải: chiếm 30% */}
    <div
      style={{
        flex: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#D9D9D9'
      }}
    >
      <form onSubmit={handleSubmit} style={{ width: '80%', maxWidth: '400px' }}>
        <h2 style={{ color: 'white' }}>REGISTER YOUR ACCOUNT</h2>
        <input name="username" placeholder="Username" onChange={handleChange} value={form.username} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} value={form.email} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} required />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} value={form.confirmPassword} required />
        <button type="submit">Register</button>
      </form>
    </div>
  </div>
)
}
