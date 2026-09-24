import React, { useState, useEffect, useCallback } from 'react';
import { Download, X, Share2, PlusSquare, CheckCircle2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function MobileAppBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Check if device is mobile (either mobile UA or screen width <= 768px)
  const checkIfMobile = useCallback(() => {
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileUA || isSmallScreen;
  }, []);

  useEffect(() => {
    // 1. Check if already running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setShowPrompt(false);
      return;
    }

    // 2. Check if Apple iOS
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isApple);

    // 3. Capture beforeinstallprompt event whenever fired
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (checkIfMobile() && !isDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Reactive Resize Listener (so reducing browser width in devtools immediately activates prompt)
    const handleResizeOrCheck = () => {
      const mobileNow = checkIfMobile();
      if (mobileNow && !isStandalone) {
        if (!isDismissed) {
          setShowPrompt(true);
        }
      } else {
        setShowPrompt(false);
        // Reset dismissed state when user switches back to desktop so they can test mobile view again
        setIsDismissed(false);
      }
    };

    // 5. Global trigger to open modal anytime (e.g. from Sidebar/Navbar Install button)
    const handleManualOpen = () => {
      setIsDismissed(false);
      setShowPrompt(true);
    };
    window.addEventListener('open_pwa_install', handleManualOpen);

    // Initial check after short delay
    const initialTimer = setTimeout(() => {
      handleResizeOrCheck();
    }, 600);

    window.addEventListener('resize', handleResizeOrCheck);

    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResizeOrCheck);
      window.removeEventListener('open_pwa_install', handleManualOpen);
      clearTimeout(initialTimer);
    };
  }, [checkIfMobile, isDismissed]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowPrompt(false);
      setIsDismissed(true);
      alert("To install: Tap the browser menu (⋮) and select 'Add to Home screen' or 'Install App'.");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
  };

  if (!showPrompt || isDismissed) return null;

  return (
    <div className="mobile-app-overlay" onClick={handleDismiss}>
      <div className="mobile-app-card" onClick={(e) => e.stopPropagation()}>
        {/* Drag Indicator */}
        <div className="mobile-app-drag-bar" />

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="mobile-app-dismiss-btn"
          aria-label="Close"
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mobile-app-header">
          <div className="mobile-app-logo-box">
            <img src={logoImg} alt="StockPilot" className="mobile-app-logo-img" />
          </div>

          <div className="mobile-app-info">
            <div className="mobile-app-title-row">
              <h3 className="mobile-app-title">StockPilot POS</h3>
              <CheckCircle2 size={15} className="mobile-app-verified-badge" />
            </div>
            <p className="mobile-app-developer">StockPilot Technologies</p>
            <div className="mobile-app-meta-row">
              <span className="mobile-app-rating">★ 4.9</span>
              <span className="mobile-app-meta-dot">•</span>
              <span className="mobile-app-size">8.4 MB</span>
              <span className="mobile-app-meta-dot">•</span>
              <span className="mobile-app-badge-free">Free</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mobile-app-desc">
          Install the official StockPilot app for fast stock lookup, offline counter sales, and instant receipt printing.
        </p>

        {/* iOS Safari 2-Step Instructions */}
        {showIOSGuide ? (
          <div className="mobile-app-ios-guide">
            <div className="ios-guide-header">Add to iPhone Home Screen:</div>
            <div className="ios-guide-step">
              <span className="guide-step-badge">1</span>
              <span>
                Tap the <strong>Share</strong> icon{' '}
                <Share2 size={14} className="guide-inline-icon" /> at the bottom of Safari.
              </span>
            </div>
            <div className="ios-guide-step">
              <span className="guide-step-badge">2</span>
              <span>
                Select <strong>Add to Home Screen</strong>{' '}
                <PlusSquare size={14} className="guide-inline-icon" /> and tap <strong>Add</strong>.
              </span>
            </div>
            <button onClick={handleDismiss} className="btn-guide-done">
              Got it
            </button>
          </div>
        ) : (
          /* CTAs */
          <div className="mobile-app-actions">
            <button onClick={handleInstallClick} className="btn-app-install-primary">
              <Download size={16} />
              <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
            </button>
            <button onClick={handleDismiss} className="btn-app-dismiss-secondary">
              Not now
            </button>
          </div>
        )}
      </div>

      <style>{`
        .mobile-app-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          animation: appFadeIn 0.2s ease-out;
        }

        .mobile-app-card {
          background: #ffffff;
          width: 100%;
          max-width: 480px;
          border-radius: 20px 20px 0 0;
          padding: 1.25rem 1.25rem 1.75rem 1.25rem;
          box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.18);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          animation: appSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          border-top: 1px solid #e2e8f0;
        }

        [data-theme='dark'] .mobile-app-card {
          background: #1e1b4b;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }

        .mobile-app-drag-bar {
          width: 36px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 999px;
          margin: -0.25rem auto 0 auto;
        }

        [data-theme='dark'] .mobile-app-drag-bar {
          background: rgba(255, 255, 255, 0.2);
        }

        .mobile-app-dismiss-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #f1f5f9;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mobile-app-dismiss-btn:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        [data-theme='dark'] .mobile-app-dismiss-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        .mobile-app-header {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding-right: 2rem;
        }

        .mobile-app-logo-box {
          width: 54px;
          height: 54px;
          border-radius: 12px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }

        [data-theme='dark'] .mobile-app-logo-box {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .mobile-app-logo-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .mobile-app-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mobile-app-title-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .mobile-app-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        [data-theme='dark'] .mobile-app-title {
          color: #f8fafc;
        }

        .mobile-app-verified-badge {
          color: #059669;
          flex-shrink: 0;
        }

        .mobile-app-developer {
          font-size: 0.78rem;
          color: #64748b;
          margin: 0.15rem 0 0.25rem 0;
        }

        [data-theme='dark'] .mobile-app-developer {
          color: #94a3b8;
        }

        .mobile-app-meta-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
        }

        [data-theme='dark'] .mobile-app-meta-row {
          color: #94a3b8;
        }

        .mobile-app-rating {
          color: #d97706;
        }

        .mobile-app-meta-dot {
          opacity: 0.5;
        }

        .mobile-app-badge-free {
          background: #ecfdf5;
          color: #059669;
          padding: 0.05rem 0.35rem;
          border-radius: 4px;
          font-weight: 700;
        }

        [data-theme='dark'] .mobile-app-badge-free {
          background: rgba(5, 150, 105, 0.2);
          color: #34d399;
        }

        .mobile-app-desc {
          font-size: 0.82rem;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }

        [data-theme='dark'] .mobile-app-desc {
          color: #cbd5e1;
        }

        .mobile-app-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 0.25rem;
        }

        .btn-app-install-primary {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          padding: 0.75rem 1rem;
          background: #982A86;
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(152, 42, 134, 0.25);
          transition: all 0.15s ease;
        }

        .btn-app-install-primary:hover {
          background: #832072;
        }

        .btn-app-dismiss-secondary {
          padding: 0.75rem 1rem;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-app-dismiss-secondary:hover {
          background: #e2e8f0;
          color: #0f172a;
        }

        [data-theme='dark'] .btn-app-dismiss-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
        }

        .mobile-app-ios-guide {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #334155;
        }

        [data-theme='dark'] .mobile-app-ios-guide {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
        }

        .ios-guide-header {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 0.15rem;
        }

        [data-theme='dark'] .ios-guide-header {
          color: #f8fafc;
        }

        .ios-guide-step {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          line-height: 1.35;
        }

        .guide-step-badge {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #982A86;
          color: #ffffff;
          font-size: 0.68rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .guide-inline-icon {
          display: inline-block;
          vertical-align: middle;
          margin: 0 2px;
          color: #982A86;
        }

        .btn-guide-done {
          margin-top: 0.35rem;
          padding: 0.55rem;
          background: #982A86;
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 700;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }

        @keyframes appSlideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes appFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
