import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  Copy, 
  FileText 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { numberToWords } from '../../utils/numberToWords';

export const InvoiceModal = ({
  isOpen,
  onClose,
  purchase,
  paymentInfo = null,
  isPaymentSuccess = false,
  suppliers = [],
  warehouses = [],
  tenant = null
}) => {
  const invoiceRef = useRef(null);

  if (!isOpen || !purchase) return null;

  const items = purchase.items || [];
  const poNumber = purchase.po_number || `PO-${purchase.id || '2026-0001'}`;

  // Supplier info (only actual values)
  const supplierObj = purchase.supplier || suppliers.find(s => s.id === purchase.supplier_id || s.name === purchase.supplier_name) || {};
  const supplierName = purchase.supplier_name || supplierObj.name || 'Vendor';
  const supplierGstin = purchase.supplier_gstin || supplierObj.gstin || null;
  const supplierPhone = purchase.supplier_contact || supplierObj.phone || supplierObj.contact_person || null;
  const supplierEmail = supplierObj.email || null;
  const supplierAddress = supplierObj.address || null;

  // Warehouse destination
  const warehouseObj = warehouses.find(w => w.id === purchase.warehouse_id || w.name === purchase.warehouse_name) || {};
  const warehouseName = purchase.warehouse_name || warehouseObj.name || 'Main Warehouse';
  const warehouseAddress = warehouseObj.location || warehouseObj.address || null;

  // Company info (Priority: real tenant data)
  const rawCompanyName = tenant?.tenantName || tenant?.companyName || tenant?.company_name || tenant?.legalName || 'STOCKPILOT';
  const companyName = rawCompanyName.toUpperCase();
  const companyGstin = tenant?.gstin || tenant?.tax_number || null;
  const companyPhone = tenant?.phone || null;
  const companyEmail = tenant?.email || null;
  const companyAddress = tenant?.address || null;

  // Financial calculations
  const rawSubtotal = parseFloat(purchase.subtotal || 0);
  const rawTax = parseFloat(purchase.tax_amount || 0);
  const rawDiscount = parseFloat(purchase.discount_amount || 0);
  const rawTotal = parseFloat(purchase.grand_total || (rawSubtotal + rawTax - rawDiscount) || 0);

  const paidAmount = paymentInfo?.amount 
    ? parseFloat(paymentInfo.amount) 
    : parseFloat(purchase.paid_amount !== undefined ? purchase.paid_amount : rawTotal);
  const dueAmount = Math.max(0, rawTotal - paidAmount);

  const isPaid = dueAmount === 0 || purchase.payment_status === 'PAID';
  const paymentStatus = isPaid 
    ? 'PAID' 
    : (paidAmount > 0 ? 'PARTIAL' : (purchase.payment_status || 'UNPAID'));

  const paymentMethod = paymentInfo?.method || purchase.payment_method || 'BANK';
  const paymentTxnId = paymentInfo?.transactionId || purchase.payment_txn_id || null;

  const orderDate = purchase.order_date || purchase.created_at || Date.now();
  const dateFormatted = new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const words = numberToWords(rawTotal);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    window.print();
  };

  const handleCopy = () => {
    const summary = `Purchase Order #${poNumber}\nCompany: ${companyName}\nSupplier: ${supplierName}\nAmount: ₹${rawTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\nStatus: ${paymentStatus}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      toast.success('PO voucher summary copied to clipboard');
    }
  };

  return (
    <div className="a4-invoice-overlay">
      <style>{`
        .a4-invoice-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 16px 40px;
          overflow-y: auto;
        }

        .a4-toolbar {
          width: 100%;
          max-width: 800px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          color: #ffffff;
        }

        .a4-toolbar-title {
          font-size: 15px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f8fafc;
        }

        .a4-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .a4-btn {
          padding: 7px 14px;
          border-radius: 7px;
          font-size: 12.5px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .a4-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .a4-btn.primary {
          background: #982A86;
          border-color: #982A86;
          box-shadow: 0 4px 12px rgba(152, 42, 134, 0.35);
        }

        .a4-btn.primary:hover {
          background: #832072;
        }

        .a4-close-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 7px;
          border-radius: 7px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .a4-close-btn:hover {
          background: rgba(239, 68, 68, 0.4);
          color: #ffffff;
        }

        /* Clean Corporate A4 Sheet */
        .a4-sheet {
          width: 100%;
          max-width: 800px;
          background: #ffffff;
          color: #0f172a;
          padding: 36px 42px;
          border-radius: 6px;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12.5px;
          line-height: 1.45;
          box-sizing: border-box;
        }

        /* Top Centered Brand */
        .a4-header-center {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }

        .a4-logo-img {
          height: 48px;
          max-width: 160px;
          object-fit: contain;
          margin-bottom: 8px;
        }

        .a4-company-name {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.02em;
          margin: 0 0 4px 0;
        }

        .a4-company-meta {
          font-size: 11.5px;
          color: #64748b;
          margin: 0;
        }

        /* Document Header Ribbon */
        .a4-doc-ribbon {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 14px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .a4-doc-type {
          font-size: 13px;
          font-weight: 800;
          color: #982A86;
          letter-spacing: 0.04em;
        }

        .a4-doc-number {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
        }

        /* 2-Column Info Grid */
        .a4-grid-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-bottom: 18px;
        }

        .a4-grid-cell {
          padding: 12px 16px;
        }

        .a4-grid-cell:first-child {
          border-right: 1px solid #e2e8f0;
        }

        .a4-cell-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
          display: block;
        }

        .a4-cell-title {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 2px;
        }

        .a4-cell-text {
          font-size: 11.5px;
          color: #475569;
          margin: 2px 0;
        }

        .a4-status-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: ${paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7'};
          color: ${paymentStatus === 'PAID' ? '#15803d' : '#b45309'};
          border: 1px solid ${paymentStatus === 'PAID' ? '#86efac' : '#fde68a'};
        }

        /* Items Table */
        .a4-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          margin-bottom: 18px;
        }

        .a4-table th {
          background: #f8fafc;
          color: #334155;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          text-align: left;
        }

        .a4-table td {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .a4-table tbody tr:nth-child(even) {
          background: #fafafa;
        }

        /* Totals & Bottom Section */
        .a4-bottom-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-bottom: 24px;
        }

        .a4-bottom-left {
          padding: 14px 16px;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .a4-words-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 4px;
        }

        .a4-words-label {
          font-size: 9.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
        }

        .a4-words-value {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 2px;
        }

        .a4-bottom-right {
          padding: 14px 16px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .a4-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
        }

        .a4-total-row.grand {
          border-top: 1.5px solid #0f172a;
          border-bottom: 1.5px solid #0f172a;
          padding: 6px 0;
          margin: 4px 0;
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
        }

        .a4-total-row.grand .val {
          color: #982A86;
        }

        /* Signatures */
        .a4-signatures {
          display: flex;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid #e2e8f0;
        }

        .a4-sig-block {
          text-align: center;
          width: 180px;
        }

        .a4-sig-space {
          height: 38px;
        }

        .a4-sig-line {
          border-top: 1px solid #0f172a;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          padding-top: 4px;
        }

        @media print {
          body {
            background: #ffffff !important;
          }
          .a4-toolbar {
            display: none !important;
          }
          .a4-invoice-overlay {
            position: static !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .a4-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      {/* Floating Action Header */}
      <div className="a4-toolbar">
        <div className="a4-toolbar-title">
          <FileText size={18} color="#f472b6" />
          <span>Purchase Order Voucher</span>
        </div>

        <div className="a4-toolbar-actions">
          <button onClick={handleCopy} className="a4-btn" title="Copy Details">
            <Copy size={13} /> Copy
          </button>
          <button onClick={handlePrint} className="a4-btn" title="Print Voucher">
            <Printer size={13} /> Print
          </button>
          <button onClick={handleDownload} className="a4-btn primary" title="Save PDF">
            <Download size={13} /> Save PDF
          </button>
          <button onClick={onClose} className="a4-close-btn" title="Close">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Clean Corporate A4 Sheet */}
      <div className="a4-sheet" ref={invoiceRef}>
        {/* Top Centered Brand & Logo */}
        <div className="a4-header-center">
          <div>
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="a4-logo-img" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <h1 className="a4-company-name">{companyName}</h1>
          <p className="a4-company-meta">
            {companyAddress && <span>{companyAddress} • </span>}
            {companyGstin && <span>GSTIN: {companyGstin} • </span>}
            {companyPhone && <span>Phone: {companyPhone} • </span>}
            {companyEmail && <span>Email: {companyEmail}</span>}
            {!companyAddress && !companyGstin && !companyPhone && <span>Procurement & Inventory Management System</span>}
          </p>
        </div>

        {/* Document Ribbon */}
        <div className="a4-doc-ribbon">
          <div className="a4-doc-type">PURCHASE ORDER VOUCHER</div>
          <div className="a4-doc-number">#{poNumber}</div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="a4-grid-info">
          {/* Supplier Details */}
          <div className="a4-grid-cell">
            <span className="a4-cell-label">SUPPLIER / VENDOR</span>
            <div className="a4-cell-title">{supplierName}</div>
            {supplierPhone && <div className="a4-cell-text"><strong>Phone:</strong> {supplierPhone}</div>}
            {supplierGstin && <div className="a4-cell-text"><strong>GSTIN:</strong> {supplierGstin}</div>}
            {supplierAddress && <div className="a4-cell-text">{supplierAddress}</div>}
          </div>

          {/* PO & Warehouse Particulars */}
          <div className="a4-grid-cell">
            <span className="a4-cell-label">ORDER PARTICULARS</span>
            <div className="a4-cell-text"><strong>Date:</strong> {dateFormatted}</div>
            <div className="a4-cell-text"><strong>Warehouse:</strong> {warehouseName}</div>
            <div className="a4-cell-text"><strong>Payment:</strong> {paymentMethod}</div>
            {paymentTxnId && <div className="a4-cell-text"><strong>Txn ID:</strong> {paymentTxnId}</div>}
            <div style={{ marginTop: '6px' }}>
              <span className="a4-status-tag">{paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="a4-table">
          <thead>
            <tr>
              <th style={{ width: '36px', textAlign: 'center' }}>#</th>
              <th>Item Description</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Unit Price</th>
              <th style={{ width: '70px', textAlign: 'right' }}>Tax</th>
              <th style={{ width: '110px', textAlign: 'right' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                  No items in this purchase order.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const price = parseFloat(item.unit_price || 0);
                const qty = parseInt(item.quantity, 10) || 1;
                const taxRate = parseFloat(item.tax_rate || 0);
                const total = parseFloat(item.total_price || (price * qty * (1 + taxRate / 100)));

                return (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.product_name}</div>
                      {item.product_code && (
                        <div style={{ fontSize: '10.5px', color: '#64748b' }}>SKU: {item.product_code}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                    <td style={{ textAlign: 'right' }}>
                      ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', color: '#475569' }}>
                      {taxRate > 0 ? `${taxRate}%` : '0%'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Totals & Amount in Words */}
        <div className="a4-bottom-grid">
          <div className="a4-bottom-left">
            <div className="a4-words-box">
              <span className="a4-words-label">Amount in Words:</span>
              <div className="a4-words-value">INR {words || 'Zero Rupees Only'}</div>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px' }}>
              * This is a computer generated purchase order record.
            </div>
          </div>

          <div className="a4-bottom-right">
            <div className="a4-total-row">
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                ₹{rawSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {rawTax > 0 && (
              <div className="a4-total-row">
                <span>GST / Tax:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  ₹{rawTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {rawDiscount > 0 && (
              <div className="a4-total-row" style={{ color: '#16a34a' }}>
                <span>Discount:</span>
                <span>-₹{rawDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="a4-total-row grand">
              <span>Grand Total:</span>
              <span className="val">
                ₹{rawTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="a4-total-row">
              <span>Paid Amount:</span>
              <span style={{ fontWeight: 600, color: '#16a34a' }}>
                ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {dueAmount > 0 && (
              <div className="a4-total-row" style={{ color: '#dc2626', fontWeight: 700 }}>
                <span>Balance Due:</span>
                <span>₹{dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="a4-signatures">
          <div className="a4-sig-block">
            <div className="a4-sig-space"></div>
            <div className="a4-sig-line">Receiver's Signature</div>
          </div>

          <div className="a4-sig-block">
            <div className="a4-sig-space"></div>
            <div className="a4-sig-line">Authorized Signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
