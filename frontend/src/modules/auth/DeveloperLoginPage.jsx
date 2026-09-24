import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../app/authSlice';
import api from '../../services/api';
import logoImg from '../../assets/logo.png';
import { Lock, Mail, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import './DeveloperLoginPage.css';

export default function DeveloperLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/dev-login', {
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (res?.success && res?.data) {
        dispatch(setCredentials(res.data));
        navigate('/dev/workspace');
      } else {
        setError(res?.message || 'Authentication failed');
      }
    } catch (err) {
      setError(err?.message || 'Developer verification failed. Ensure you are registered in Dev & Support Team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dev-login-container">
      <div className="dev-login-card">
        {/* Brand Header */}
        <div className="dev-login-header">
          <div className="dev-logo-badge">
            <img src={logoImg} alt="StockPilot" className="dev-logo-img" />
          </div>
          <div className="dev-badge-tag">StockPilot Engineering</div>
          <h1 className="dev-login-title">Developer Portal</h1>
          <p className="dev-login-subtitle">
            Sign in to access your assigned tickets and resolution workspace.
          </p>
        </div>

        {error && (
          <div className="dev-alert">
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="dev-login-form">
          <div className="dev-form-group">
            <label className="dev-form-label">Developer Work Email</label>
            <div className="dev-input-wrapper">
              <Mail size={16} className="dev-input-icon" />
              <input
                type="email"
                className="dev-input"
                placeholder="dev.handle@stockpilot.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="dev-form-group">
            <label className="dev-form-label">Password / Passkey</label>
            <div className="dev-input-wrapper">
              <Lock size={16} className="dev-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="dev-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="dev-toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="dev-submit-btn"
            disabled={loading}
          >
            <span>{loading ? 'Signing in...' : 'Sign In to Workspace'}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
