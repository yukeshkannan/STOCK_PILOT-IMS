import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { setCredentials } from '../../app/authSlice';
import api from '../../services/api';
import { Mail, Lock, LogIn, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      if (res?.success) {
        dispatch(setCredentials(res.data));
        const loggedUser = res.data.user;

        // Dynamic Role-Based Landing Page Routing
        if (loggedUser?.isSuperAdmin) {
          navigate('/admin');
        } else if (!loggedUser?.tenantId || loggedUser?.isProfileCompleted === false) {
          navigate('/complete-profile');
        } else if (loggedUser?.roleName === 'STAFF') {
          navigate('/sales/new'); // Direct POS Billing Terminal for Staff / Cashier
        } else {
          navigate('/dashboard'); // Executive & Warehouse Admin Dashboard
        }
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
        Welcome back
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Sign in to your StockPilot business account
      </p>

      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            color: 'var(--danger)',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email Address */}
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type="email"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@business.com"
              required
            />
          </div>
        </div>

        {/* Password with Eye Toggle */}
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '11px' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              tabIndex={-1}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          disabled={loading}
        >
          <LogIn size={18} />
          <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        Register a new business?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
          Create Company Account →
        </Link>
      </div>
    </div>
  );
}
