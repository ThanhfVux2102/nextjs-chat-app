'use client'

import React, { createContext, useContext, useMemo, useState, useRef, useEffect } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, type: 'success', text: '' })
  const timerRef = useRef(null)

  const hide = () => setToast(prev => ({ ...prev, visible: false }))

  const show = (type, text, duration = 2000) => {
    setToast({ visible: true, type, text })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(hide, duration)
  }

  const api = useMemo(() => ({
    show,
    success: (text, duration) => show('success', text, duration),
    error: (text, duration) => show('error', text, duration),
    hide,
  }), [])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast.visible && (
        <div style={styles.overlay}>
          <div style={{
            ...styles.toast,
            ...(toast.type === 'success' ? styles.success : styles.error)
          }}>
            {toast.text}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.2)', zIndex: 9999,
  },
  toast: {
    minWidth: 280, maxWidth: '90vw', padding: '14px 18px', borderRadius: 10,
    fontSize: 14, fontWeight: 600, textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid transparent',
    animation: 'toast-pop-in 150ms ease-out',
  },
  success: { background: '#e6f4ea', borderColor: '#34a853', color: '#196127' },
  error: { background: '#fdecea', borderColor: '#d93025', color: '#a50e0e' },
}

// Animation keyframes are defined globally in globals.css
