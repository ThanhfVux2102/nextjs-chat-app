'use client'

export default function SlideOverWrapper({ 
  isOpen, 
  onClose, 
  children, 
  isMobile, 
  position = 'right',
  width = '400px',
  minWidth = '300px'
}) {
  const slideDirection = position === 'right' ? 'right' : 'left'
  const transformValue = isOpen ? 'translateX(0)' : `translateX(${position === 'right' ? '100%' : '-100%'})`
  
  return (
    <>
             {/* Slide-over container */}
       <div
         style={{
           position: isMobile ? 'fixed' : 'relative',
           top: 0,
           [position]: isMobile ? (isOpen ? 0 : '-100%') : 0,
           height: '100vh',
           width: isMobile ? '100%' : width,
           minWidth: isMobile ? '100%' : minWidth,
           backgroundColor: '#fff',
           zIndex: 999,
           transition: `${slideDirection} 0.3s ease`,
           overflow: 'hidden',
           boxShadow: isMobile ? 'none' : (isOpen ? '0 0 20px rgba(0,0,0,0.1)' : 'none'),
           transform: isMobile ? 'none' : (isOpen ? 'translateX(0)' : `translateX(${position === 'right' ? '100%' : '-100%'})`),
         }}
       >
        {children}
      </div>

      {/* Backdrop overlay for mobile */}
      {isMobile && isOpen && (
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
          onClick={onClose}
        />
      )}
    </>
  )
}
