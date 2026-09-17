import React from 'react';

export default function Badge({ status, text }) {
  const label = text || status;
  let variant = 'badge-neutral';

  const s = String(status || '').toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'APPROVED', 'PAID', 'GOOD', 'RECEIPT'].includes(s)) {
    variant = 'badge-success';
  } else if (['PENDING', 'PENDING_APPROVAL', 'PARTIAL', 'DRAFT'].includes(s)) {
    variant = 'badge-warning';
  } else if (['CANCELLED', 'REJECTED', 'SUSPENDED', 'UNPAID', 'DAMAGED', 'LOW_STOCK', 'OUT_OF_STOCK', 'RETURN_OUT', 'RETURNED'].includes(s)) {
    variant = 'badge-danger';
  } else if (['TRANSFER', 'SALE', 'PURCHASE', 'IN_TRANSIT', 'DISPATCHED', 'SHIPPED', 'RETURN_IN'].includes(s)) {
    variant = 'badge-info';
  }

  return <span className={`badge ${variant}`}>{label}</span>;
}
