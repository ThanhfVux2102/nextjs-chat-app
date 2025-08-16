// src/app/verify/page.js
'use client'
import { useState } from 'react'

export default function VerifyPage() {
  const [code, setCode] = useState(['', '', '', '', ''])

  const handleChange = (e, index) => {
    const value = e.target.value
    if (!/^\d?$/.test(value)) return // allow only digits
    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // auto focus next input
    if (value && index < 4) {
      document.getElementById(`code-${index + 1}`).focus()
    }
  }

  const handleVerify = () => {
    const enteredCode = code.join('')

    // TODO: Call verify API here
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#444' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: 'min(420px, 92vw)' }}>

        <h2 style={{ fontWeight: 'bold', color: '#555' }}>Check your email</h2>
        <p style={{ color: '#555' }}>We sent a reset link to <b>contact@dscode...com</b><br />
          Enter 5 digit code that mentioned in the email</p>

        <div style={{ display: 'flex', gap: '10px', margin: '20px 0', flexWrap: 'wrap', justifyContent: 'center' }}>
          {code.map((c, i) => (
            <input
              key={i}
              id={`code-${i}`}
              type="text"
              maxLength="1"
              value={c}
              onChange={(e) => handleChange(e, i)}
              style={{
                width: '40px',
                height: '50px',
                textAlign: 'center',
                fontSize: '20px',
                borderRadius: '8px',
                border: '1px solid #ccc',

              }}
            />
          ))}
        </div>

        <button onClick={handleVerify} style={{
          width: '100%',
          padding: '10px',
          background: 'black',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          Verify Code
        </button>

        <p style={{ color: '#555', marginTop: '20px', textAlign: 'center', }}>
          Haven’t got the email yet? <a href="#" style={{ textDecoration: 'underline' }}>Resend email</a>
        </p>
      </div>
    </div>
  )
}
