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
        width: '100%',
        flex: 1,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease',
        transform: fadeOut ? 'scale(1.01)' : 'scale(1)',
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
              backgroundColor: '#ffffff',
              padding: 'max(env(safe-area-inset-top, 0px), 1rem) 1.5rem max(env(safe-area-inset-bottom, 0px), 1rem) 1.5rem'
            }
          : {
              minHeight: 'calc(100vh - 170px)',
              height: '100%',
              backgroundColor: 'transparent',
              padding: '1.5rem 1rem'
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
              width: compact ? '118px' : '142px',
              height: 'auto'
            }}
          />
        </div>

        {/* Minimalist Progress Bar */}
        <div
          className="preloader-hairline-track"
          style={{
            width: compact ? '105px' : '135px'
          }}
        >
          <div className="preloader-hairline-fill" />
        </div>

        {/* Status text cleanly centered */}
        {displayText && (
          <div className="preloader-status-text">
            {displayText}
          </div>
        )}
      </div>
    </div>
  );
}

