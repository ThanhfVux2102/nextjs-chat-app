'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Sidebar from '../components/Sidebar'
import ChatBox from '../components/ChatBox'
import UserPanel from '../components/UserPanel'
import SlideOverWrapper from '../components/SlideOverWrapper'

export default function ChatPage() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setIsSidebarOpen(false)
        setIsRightPanelOpen(false) // ensure closed on mobile
      } else {
        setIsSidebarOpen(true)
        // do not auto-open right panel on desktop; keep user's current state
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const toggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <ProtectedRoute>
      <div
        style={{
          display: 'flex',
          height: '100vh',
          fontFamily: 'sans-serif',
          backgroundColor: '#fff',
          color: '#000',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: '10px',
              left: '10px',
              zIndex: 1001,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#007AFF',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            ☰
          </button>
        )}

        {/* Sidebar */}
        <div style={{ 
          flex: isMobile ? 'none' : 2, 
          width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '100%' : '350px',
          minWidth: isMobile ? '100%' : '280px',
          borderRight: '1px solid #ddd',
          backgroundColor: '#fff',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: isMobile ? (isSidebarOpen ? 0 : '-100%') : 0,
          height: '100vh',
          zIndex: 1000,
          transition: 'left 0.3s ease',
          overflow: 'hidden',
        }}>
          <Sidebar onClose={isMobile ? toggleSidebar : undefined} />
        </div>

                          {/* Chat Area */}
         <div style={{ 
           flex: 1, 
           display: 'flex', 
           flexDirection: 'column', 
           borderRight: 'none',
           backgroundColor: '#f8f9fa',
           width: '100%',
           minWidth: 0,
           transition: 'flex 0.3s ease',
           position: 'relative',
         }}>
           <ChatBox 
             toggleRightPanel={toggleRightPanel}
             isRightPanelOpen={isRightPanelOpen}
             isMobile={isMobile}
           />
           
           {/* Floating User Icon - positioned at the top-right of chat area */}
          {!isRightPanelOpen && !isMobile && (
            <button
              onClick={toggleRightPanel}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#f0f0f0',
                color: '#333',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 997,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e0e0e0'
                e.currentTarget.style.transform = 'scale(1.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0'
                e.currentTarget.style.transform = 'scale(1)'
              }}
              title="Show user details"
            >
              👤
             </button>
           )}

        {/* User Panel */}
        {isMobile ? (
          <SlideOverWrapper
            isOpen={isRightPanelOpen}
            onClose={toggleRightPanel}
            isMobile={isMobile}
            position="right"
            width="400px"
            minWidth="300px"
          >
            <UserPanel 
              toggleRightPanel={toggleRightPanel}
              isRightPanelOpen={isRightPanelOpen}
              isMobile={isMobile}
            />
          </SlideOverWrapper>
        ) : (
          <>{isRightPanelOpen && (
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 380,
              maxWidth: '92vw',
              maxHeight: '70vh',
              backgroundColor: '#fff',
              borderRadius: 12,
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              zIndex: 1002,
            }}>
              <UserPanel 
                toggleRightPanel={toggleRightPanel}
                isRightPanelOpen={isRightPanelOpen}
                isMobile={isMobile}
              />
            </div>
          )}
          </>
        )}

        </div>

        {/* Mobile Overlay - only for sidebar since UserPanel has its own */}
        {isMobile && isSidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
            }}
            onClick={toggleSidebar}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}
