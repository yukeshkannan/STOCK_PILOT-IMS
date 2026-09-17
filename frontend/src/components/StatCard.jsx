import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = '#7c3aed', trend }) {
  return (
    <div className="card kpi-card" style={{ padding: '1.25rem 1.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem', letterSpacing: '-0.02em' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 500 }}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.35rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>↑</span> {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="kpi-icon-box"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: `${color}15`,
              border: `1px solid ${color}30`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}

