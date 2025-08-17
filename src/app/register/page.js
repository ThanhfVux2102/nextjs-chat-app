'use client'
import { useState } from 'react'
import { register } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './register.css'
import { useToast } from '@/contexts/ToastContext'

export default function RegisterPage() {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      await register(form.email, form.username, form.password)
      toast.success('Registration successful! Redirecting to login...', 1200)
      setTimeout(() => router.push('/login'), 1000)
    } catch (error) {
      const msg = String(error?.message || '')
      if (error?.status === 409 || /exist|taken|duplicate/i.test(msg)) {
        toast.error('Email is already registered')
      } else if (error?.status === 400) {
        toast.error('Invalid input. Please check your details')
      } else {
        toast.error('Registration failed. Please try again later.')
      }
    } finally {
      setLoading(false)
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
          <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} required autoComplete="off" style={{
            color: 'black', border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }} />
          <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} value={form.confirmPassword} required autoComplete="off" style={{
            color: 'black', border: '1px solid black',
            padding: '8px',
            borderRadius: '4px',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }} />
          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>

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
