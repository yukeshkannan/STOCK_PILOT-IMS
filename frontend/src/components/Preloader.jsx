import React from 'react';
import logoImg from '../assets/logo.png';

export default function Preloader({
  message = 'Loading...',
  submessage = '',
  isFullScreen = false,
  compact = false,
  fadeOut = false
}) {
  return (
    <div
      className={`preloader-overlay ${isFullScreen ? 'preloader-fixed' : ''} ${fadeOut ? 'preloader-fade-out' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        width: '100%',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease',
        transform: fadeOut ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: fadeOut ? 'none' : 'auto',
        ...(isFullScreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999999,
              height: '100vh',
              minHeight: '100vh',
              padding: 'max(env(safe-area-inset-top, 0px), 1rem) 1.5rem max(env(safe-area-inset-bottom, 0px), 1rem) 1.5rem'
            }
          : {
              minHeight: '65vh',
              padding: '2rem 1rem'
            }),
        boxSizing: 'border-box'
      }}
    >
      <div
        className="preloader-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: compact ? '220px' : '300px',
          width: '100%',
          position: 'relative'
        }}
      >
        {/* Unique Minimalist Orbital Brand Badge */}
        <div
          style={{
            position: 'relative',
            width: compact ? '64px' : '80px',
            height: compact ? '64px' : '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}
        >
          {/* Subtle Radar Ripple */}
          <div className="preloader-radar-wave" />

          {/* Smooth Conic Orbital Gradient Ring */}
          <div className="preloader-orbital-ring" />

          {/* Elevated Pure White Center Plate */}
          <div className="preloader-icon-plate">
            <img
              src={logoImg}
              alt="StockPilot"
              style={{
                width: compact ? '30px' : '38px',
                height: compact ? '30px' : '38px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>

        {/* Clean Modern Typography */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div
            style={{
              fontSize: compact ? '1.15rem' : '1.3rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px'
            }}
          >
            <span>Stock</span>
            <span style={{ color: '#982A86' }}>Pilot</span>
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#982A86',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginTop: '3px'
            }}
          >
            {message}
          </div>
        </div>

        {/* 0.5s Micro Progress Fill Bar */}
        <div className="preloader-progress-track">
          <div className="preloader-progress-indicator" />
        </div>

        {submessage && (
          <p
            style={{
              fontSize: '0.76rem',
              color: '#64748b',
              marginTop: '0.65rem',
              fontWeight: 500
            }}
          >
            {submessage}
          </p>
        )}
      </div>
    </div>
  );
}

