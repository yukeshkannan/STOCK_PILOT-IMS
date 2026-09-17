import React from 'react';
import Modal from './Modal';
import { Printer, Download, CheckCircle2 } from 'lucide-react';
import Badge from './Badge';

export default function PrintInvoiceModal({ isOpen, onClose, sale, tenant }) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${sale.invoice_number}`} maxWidth="750px">
      <div id="printable-invoice" style={{ padding: '0.5rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              {tenant?.company_name || sale.warehouse_name || 'StockPilot Business'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {tenant?.address || 'India'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              GSTIN: {tenant?.tax_number || '29ABCDE1234F1Z5'} | Phone: {tenant?.phone || '+91 98765 00000'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>TAX INVOICE</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
              {sale.invoice_number}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Date: {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <Badge status={sale.payment_status} />
            </div>
          </div>
        </div>

        {/* Bill To & Dispatch info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Bill To (Customer)
            </span>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '3px' }}>
              {sale.customer_name || 'Walk-in Customer'}
            </div>
            {sale.customer_phone && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone: {sale.customer_phone}</div>
            )}
            {sale.customer?.address && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sale.customer.address}</div>
            )}
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Dispatch & Payment Details
            </span>
            <div style={{ fontSize: '0.85rem', marginTop: '3px' }}>
              <strong>Warehouse:</strong> {sale.warehouse_name}
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Payment Method:</strong> {sale.payment_method}
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              <strong>Billed By:</strong> {sale.created_by || 'Admin'}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="data-table" style={{ marginBottom: '1.25rem' }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Item / Description</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Tax</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(sale.items || []).map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.product_code}</div>
                </td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{parseFloat(item.unit_price).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{item.tax_rate}% (₹{parseFloat(item.tax_amount || 0).toLocaleString()})</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{parseFloat(item.total_price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹{parseFloat(sale.subtotal || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Tax (GST):</span>
              <span>₹{parseFloat(sale.tax_amount || 0).toLocaleString()}</span>
            </div>
            {parseFloat(sale.discount_amount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--success)' }}>
                <span>Discount:</span>
                <span>- ₹{parseFloat(sale.discount_amount).toLocaleString()}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: 800,
                borderTop: '2px solid var(--border-color)',
                paddingTop: '0.5rem',
                color: 'var(--text-primary)'
              }}
            >
              <span>Grand Total:</span>
              <span>₹{parseFloat(sale.grand_total || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Paid Amount:</span>
              <span>₹{parseFloat(sale.paid_amount || 0).toLocaleString()}</span>
            </div>
            {parseFloat(sale.due_amount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 700 }}>
                <span>Balance Due:</span>
                <span>₹{parseFloat(sale.due_amount).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Notes */}
        <div
          style={{
            borderTop: '1px dashed var(--border-color)',
            paddingTop: '0.85rem',
            textAlign: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}
        >
          Thank you for your business! This is a computer generated invoice powered by StockPilot.
        </div>
      </div>

      <div className="modal-footer no-print">
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={16} /> Print / Save PDF
        </button>
      </div>
    </Modal>
  );
}
