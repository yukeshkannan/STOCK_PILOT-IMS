import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  ArrowLeft,
  FileText
} from 'lucide-react';

export default function PublicInvoicePage() {
  const { invoiceNumber } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

  useEffect(() => {
    const fetchPublicInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${API_BASE}/api/v1/sales/public/invoice/${encodeURIComponent(invoiceNumber)}`);
        setSale(res.data?.data || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invoice not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceNumber) {
      fetchPublicInvoice();
    }
  }, [invoiceNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const shareUrl = window.location.href;
    const storeTitle = sale?.company_name || 'Store';
    const msg = `*Tax Invoice:* #${sale?.invoice_number || invoiceNumber}\n*${storeTitle}*\nTotal: ₹${parseFloat(sale?.grand_total || 0).toLocaleString('en-IN')}\n\nView & Download Official Invoice:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: '32px', height: '32px', border: '2.5px solid #cbd5e1', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Loading Tax Invoice...</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: '#ffffff', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <FileText size={36} color="#64748b" />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>Invoice Not Available</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.825rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const items = sale.items || [];
  const grandTotal = parseFloat(sale.grand_total || 0);
  const subtotal = parseFloat(sale.subtotal || sale.total_amount || grandTotal);
  const discount = parseFloat(sale.discount_amount || 0);
  const totalTax = parseFloat(sale.tax_amount || 0);
  const paidAmount = parseFloat(sale.paid_amount || grandTotal);
  const changeAmount = Math.max(0, paidAmount - grandTotal);
  const saleDate = new Date(sale.sale_date || sale.created_at);
  const dateFormatted = saleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeFormatted = saleDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Priority: Real Company Name first
  const companyName = sale.company_name || sale.tenant?.company_name || 'STORE';
  const gstin = sale.company_gstin || sale.tenant?.tax_number || '29ABCDE1234F1Z5';
  const branchName = sale.warehouse_name || 'Main Outlet';
  const customerName = sale.customer_name && sale.customer_name !== 'Walk-in Customer' ? sale.customer_name : 'Walk-in Customer';
  const customerPhone = sale.customer_phone ? `+91 ${sale.customer_phone.replace(/\D/g, '').slice(-10)}` : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Action Toolbar (Hidden during print) */}
      <div className="no-print" style={{ maxWidth: '640px', margin: '0 auto 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#64748b' }}>
          Official Tax Invoice
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Main Minimalist Tax Invoice Sheet (ZARA / Zudio / Apple style) */}
      <div
        id="printable-receipt"
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '2.25rem 2.25rem 2rem',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header: Company Name & Invoice Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 0.35rem 0', textTransform: 'uppercase' }}>
              {companyName}
            </h1>
            <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>
              Outlet: {branchName}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              GSTIN: {gstin}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              #{sale.invoice_number}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
              {dateFormatted}, {timeFormatted}
            </div>
            <div style={{ marginTop: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#f1f5f9',
                  color: '#0f172a',
                  fontSize: '0.725rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                PAID • {sale.payment_method}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Billing Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Customer: </span>
            <strong style={{ color: '#0f172a' }}>{customerName}</strong>
            {customerPhone && <span style={{ color: '#64748b', marginLeft: '6px' }}>({customerPhone})</span>}
          </div>
          {sale.transaction_id && (
            <div style={{ fontSize: '0.775rem', color: '#64748b' }}>
              Txn ID: <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 600 }}>{sale.transaction_id}</span>
            </div>
          )}
        </div>

        {/* Clean Minimalist Line Items Table */}
        <div style={{ marginBottom: '1.75rem', overflowX: 'auto' }}>
          <table
            className="invoice-receipt-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
              background: 'transparent'
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1.5px solid #0f172a', background: 'transparent' }}>
                <th
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    padding: '10px 14px 10px 0',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    border: 'none',
                    borderBottom: '1.5px solid #0f172a'
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    width: '60px',
                    border: 'none',
                    borderBottom: '1.5px solid #0f172a'
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    width: '120px',
                    border: 'none',
                    borderBottom: '1.5px solid #0f172a'
                  }}
                >
                  Price
                </th>
                <th
                  style={{
                    background: 'transparent',
                    color: '#64748b',
                    padding: '10px 0 10px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    width: '130px',
                    border: 'none',
                    borderBottom: '1.5px solid #0f172a'
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: 'transparent' }}>
                  <td style={{ padding: '14px 14px 14px 0', verticalAlign: 'top', background: 'transparent', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{item.product_name}</div>
                    <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '3px' }}>
                      {item.product_code || item.sku} {item.tax_rate ? `• ${item.tax_rate}% GST` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 600, color: '#0f172a', verticalAlign: 'top', background: 'transparent' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '14px 12px', textAlign: 'right', color: '#475569', verticalAlign: 'top', background: 'transparent' }}>
                    ₹{parseFloat(item.unit_price).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '14px 0 14px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a', verticalAlign: 'top', background: 'transparent' }}>
                    ₹{parseFloat(item.total_price || item.unit_price * item.quantity).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ width: '260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#64748b', marginBottom: '0.4rem' }}>
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#16a34a', marginBottom: '0.4rem' }}>
                <span>Discount</span>
                <span style={{ fontWeight: 600 }}>-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {totalTax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#64748b', marginBottom: '0.4rem' }}>
                <span>GST Tax</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹{totalTax.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderTop: '1.5px solid #0f172a',
                paddingTop: '0.65rem',
                marginTop: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>Total Paid</span>
              <span style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {sale.payment_method === 'CASH' && paidAmount > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Cash Received:</span>
                  <strong style={{ color: '#0f172a' }}>₹{paidAmount.toLocaleString('en-IN')}</strong>
                </div>
                {changeAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Change Returned:</span>
                    <strong style={{ color: '#16a34a' }}>₹{changeAmount.toLocaleString('en-IN')}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Minimal Clean Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', color: '#94a3b8', fontSize: '0.775rem' }}>
          Thank you for shopping with {companyName}.
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-receipt {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 0 !important;
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
