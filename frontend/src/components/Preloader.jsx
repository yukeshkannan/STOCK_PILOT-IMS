import React from 'react';
import logoImg from '../assets/logo.png';

export default function Preloader({
  message = 'Initializing Workspace',
  submessage = '',
  isFullScreen = false,
  compact = false,
  fadeOut = false
}) {
  const displayText = submessage || message;

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
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease',
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
              minHeight: '60vh',
              padding: '2.5rem 1rem'
            }),
        boxSizing: 'border-box'
      }}
    >
      <div className="preloader-minimal-wrap">
        {/* Official Brand Logo */}
        <div className="preloader-logo-container">
          <img
            src={logoImg}
            alt="StockPilot"
            style={{
              width: compact ? '120px' : '150px',
              height: 'auto'
            }}
          />
        </div>

        {/* Minimalist Progress Bar */}
        <div
          className="preloader-hairline-track"
          style={{
            width: compact ? '110px' : '140px'
          }}
        >
          <div className="preloader-hairline-fill" />
        </div>

        {/* Text exactly matching the user's design */}
        {displayText && (
          <div className="preloader-status-text">
            {displayText}
          </div>
        )}
      </div>
    </div>
  );
}

