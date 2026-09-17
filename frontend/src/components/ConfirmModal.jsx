import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal - Clean, Minimal Enterprise Confirmation & Delete Dialog
 * Replaces native browser alert/confirm boxes with a sleek, centered modal.
 */
export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName = '',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  maxWidth = '420px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="modal-overlay confirm-modal-overlay" onClick={() => !loading && onClose()}>
      <div
        className="modal-content confirm-modal-content"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.85rem' }}>
          <div
            className={`confirm-modal-icon-badge ${variant}`}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : '#fdf2fb',
              color: isDanger ? '#dc2626' : isWarning ? '#d97706' : '#982A86',
              border: `1px solid ${isDanger ? '#fecaca' : isWarning ? '#fde68a' : '#f3c7ec'}`
            }}
          >
            {isDanger ? (
              <Trash2 size={18} />
            ) : isWarning ? (
              <AlertTriangle size={18} />
            ) : (
              <Trash2 size={18} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#0f172a',
                lineHeight: 1.3,
                marginBottom: '0.2rem'
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: '0.825rem', color: '#64748b', lineHeight: 1.45, margin: 0 }}>
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ padding: '0.25rem', borderRadius: '50%', color: '#94a3b8' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {itemName && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.55rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '1rem',
              wordBreak: 'break-word'
            }}
          >
            {itemName}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
            marginTop: '1.15rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : isWarning ? 'btn-warning' : 'btn-primary'} btn-sm`}
            onClick={onConfirm}
            disabled={loading}
            style={{ minWidth: '85px' }}
          >
            {loading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
