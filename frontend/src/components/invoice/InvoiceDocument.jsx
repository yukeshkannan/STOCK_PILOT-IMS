import React from 'react';
import { Building2, MapPin, Phone, Mail, User, Package, FileText } from 'lucide-react';

export const InvoiceDocument = React.forwardRef(({
  purchase = {},
  paymentInfo = null,
  suppliers = [],
  warehouses = [],
  tenant = null
}, ref) => {
  const items = purchase.items || [];
  const poNumber = purchase.po_number || `PO-${purchase.id || 'N/A'}`;

  // Supplier info
  const supplierObj = purchase.supplier || suppliers.find(s => s.id === purchase.supplier_id || s.name === purchase.supplier_name) || {};
  const supplierName = purchase.supplier_name || supplierObj.name || 'Supplier';
  const supplierGstin = purchase.supplier_gstin || supplierObj.gstin || null;
  const supplierPhone = purchase.supplier_contact || supplierObj.phone || supplierObj.contact_person || null;

  // Warehouse destination
  const warehouseObj = warehouses.find(w => w.id === purchase.warehouse_id || w.name === purchase.warehouse_name) || {};
  const warehouseName = purchase.warehouse_name || warehouseObj.name || 'Main Warehouse';
  const warehouseCity = warehouseObj.city || warehouseObj.address || 'Facility';

  // Company info
  const companyName = tenant?.tenantName || tenant?.companyName || tenant?.legalName || 'StockPilot Store';

  // Financials
  const rawSubtotal = parseFloat(purchase.subtotal || 0);
  const rawTax = parseFloat(purchase.tax_amount || 0);
  const rawDiscount = parseFloat(purchase.discount_amount || 0);
  const rawTotal = parseFloat(purchase.grand_total || (rawSubtotal + rawTax - rawDiscount) || 0);

  const paidAmount = paymentInfo?.amount 
    ? parseFloat(paymentInfo.amount) 
    : parseFloat(purchase.paid_amount !== undefined ? purchase.paid_amount : rawTotal);
  const dueAmount = Math.max(0, rawTotal - paidAmount);

  const paymentStatus = (dueAmount === 0 || purchase.payment_status === 'PAID') 
    ? 'PAID' 
    : (paidAmount > 0 ? 'PARTIAL' : (purchase.payment_status || 'UNPAID'));

  const orderDate = purchase.order_date || purchase.created_at || Date.now();
  const dateFormatted = new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div ref={ref} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 2 Tiles: Supplier & Receiving Destination */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
            Supplier / Vendor
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            {supplierName}
          </div>
          {supplierPhone && (
            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <Phone size={12} color="#982A86" />
              <span>{supplierPhone}</span>
            </div>
          )}
          {supplierGstin && (
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
              GSTIN: <strong>{supplierGstin}</strong>
            </div>
          )}
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', marginBottom: '6px' }}>
            Destination Facility
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
            {warehouseName}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <Building2 size={12} color="#982A86" />
            <span>{companyName}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <MapPin size={12} color="#982A86" />
            <span>{warehouseCity}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ width: '40px', padding: '10px 12px', textAlign: 'left', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>#</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Item Details</th>
            <th style={{ width: '80px', padding: '10px 12px', textAlign: 'center', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Qty</th>
            <th style={{ width: '110px', padding: '10px 12px', textAlign: 'right', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Unit Price</th>
            <th style={{ width: '80px', padding: '10px 12px', textAlign: 'right', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Tax</th>
            <th style={{ width: '120px', padding: '10px 12px', textAlign: 'right', fontSize: '11.5px', fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No items found in this purchase order.
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const price = parseFloat(item.unit_price || 0);
              const qty = parseInt(item.quantity, 10) || 1;
              const taxRate = parseFloat(item.tax_rate || 0);
              const total = parseFloat(item.total_price || (price * qty * (1 + taxRate / 100)));

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.product_name}</div>
                    <div style={{ fontSize: '11px', color: '#982A86', fontWeight: 500 }}>
                      SKU: {item.product_code}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{qty}</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#475569' }}>
                    ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#64748b' }}>{taxRate}%</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Financial Breakdown */}
      <div style={{ marginLeft: 'auto', width: '260px', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
          <span>Subtotal</span>
          <span style={{ fontWeight: 600, color: '#0f172a' }}>
            ₹{rawSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {rawTax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
            <span>GST / Tax</span>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>
              ₹{rawTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        {rawDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16a34a' }}>
            <span>Discount</span>
            <span>-₹{rawDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #0f172a', paddingTop: '8px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
          <span>Grand Total</span>
          <span style={{ color: '#982A86' }}>
            ₹{rawTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
});

export default InvoiceDocument;
