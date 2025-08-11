'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/chat')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to chat
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: '#15240cff' }}>
            F.E Chat Web
          </h1>
          <p style={{ fontSize: '20px', color: '#666', marginBottom: '30px' }}>
            Connect with friends and colleagues in real-time
          </p>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Link href="/login">
            <a className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto">
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Login icon"
                width={20}
                height={20}
              />
              Login
            </a>
          </Link>
          
          <Link href="/register">
            <a className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]">
              Get Started
            </a>
          </Link>
        </div>

        <div style={{ 
          marginTop: '40px',
          padding: '30px',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
            Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Real-time Chat</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Instant messaging with real-time updates</p>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>👥</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>User Management</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Easy user search and profile management</p>
            </div>
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Secure</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Protected routes and user authentication</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p style={{ color: '#666', fontSize: '14px' }}>
          © 2024 F.E Chat Web. Built with Next.js and React.
        </p>
      </footer>
    </div>
  )
}
