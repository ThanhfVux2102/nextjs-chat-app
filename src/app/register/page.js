
'use client'
import { useState } from 'react'
import { register } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'  

export default function RegisterPage() {
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
      setMessage('Đăng ký thành công!')
      router.push('/login')
    } catch (error) {
      setMessage(error.message || 'Đăng ký thất bại')
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
        <h2 style={{ color: 'gray' }}>REGISTER YOUR ACCOUNT</h2>
        <input name="username" placeholder="Username" onChange={handleChange} value={form.username} required  style={{ color: 'black', border: '1px solid black',
      padding: '8px',
      borderRadius: '4px',
      marginBottom: '10px',
      width: '100%',
      boxSizing: 'border-box'}}/>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} value={form.email} required  style={{ color: 'black',  border: '1px solid black',
      padding: '8px',
      borderRadius: '4px',
      marginBottom: '10px',
      width: '100%',
      boxSizing: 'border-box' }}/>
        <input name="password" type="password" placeholder="Password" onChange={handleChange} value={form.password} required  style={{ color: 'black',  border: '1px solid black',
      padding: '8px',
      borderRadius: '4px',
      marginBottom: '10px',
      width: '100%',
      boxSizing: 'border-box' }}/>
        <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} value={form.confirmPassword} required  style={{ color: 'black',  border: '1px solid black',
      padding: '8px',
      borderRadius: '4px',
      marginBottom: '10px',
      width: '100%',
      boxSizing: 'border-box' }} />
        <button type="submit">Register</button>
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
