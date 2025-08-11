
'use client'
import { useState } from 'react'
import { register } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
  const router = useRouter()
  const { login: authLogin } = useAuth()
  
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      setMessage('Please fill in all fields')
      return
    }
    
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const res = await register(form.email, form.username, form.password)
      
      // Auto-login after successful registration
      const userData = {
        id: res.user?.id || Date.now(),
        email: form.email,
        username: form.username,
        avatar: res.user?.avatar || '/avatars/default.jpg'
      }
      
      authLogin(userData)
      setMessage('Registration successful! Redirecting to chat...')
      
      setTimeout(() => {
        router.push('/chat')
      }, 2000)
      
    } catch (error) {
      setMessage(error.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ flex: 7, backgroundColor: '#e0e0e0' }}>
        <img
          src="/register.jpg"
          alt="Register background"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

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
          <h2 style={{ color: 'gray', textAlign: 'center', marginBottom: '20px' }}>
            REGISTER YOUR ACCOUNT
          </h2>
          
          <input 
            name="username" 
            placeholder="Username" 
            onChange={handleChange} 
            value={form.username} 
            required  
            disabled={loading}
            style={{ 
              color: 'black', 
              border: '1px solid black',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            onChange={handleChange} 
            value={form.email} 
            required  
            disabled={loading}
            style={{ 
              color: 'black',  
              border: '1px solid black',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              width: '100%',
              boxSizing: 'border-box' 
            }}
          />
          
          <input 
            name="password" 
            type="password" 
            placeholder="Password" 
            onChange={handleChange} 
            value={form.password} 
            required  
            disabled={loading}
            style={{ 
              color: 'black',  
              border: '1px solid black',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              width: '100%',
              boxSizing: 'border-box' 
            }} 
          />
          
          <input 
            name="confirmPassword" 
            type="password" 
            placeholder="Confirm Password" 
            onChange={handleChange} 
            value={form.confirmPassword} 
            required  
            disabled={loading}
            style={{ 
              color: 'black',  
              border: '1px solid black',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
              width: '100%',
              boxSizing: 'border-box' 
            }} 
          />
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#15240cff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
          
          {message && (
            <p style={{ 
              color: message.includes('successful') ? 'green' : 'red', 
              marginTop: '15px',
              textAlign: 'center'
            }}>
              {message}
            </p>
          )}

          <p style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#15240cff', textDecoration: 'underline' }}>
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
