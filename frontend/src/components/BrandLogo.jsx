import React from 'react';
import logoImg from '../assets/logo.png';

export default function BrandLogo({ size = 'md', className = '' }) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const logoHeight = isSm ? '40px' : isLg ? '80px' : '54px';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}
    >
      <img
        src={logoImg || '/logo.png'}
        alt="StockPilot Logo"
        style={{
          height: logoHeight,
          maxWidth: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}
