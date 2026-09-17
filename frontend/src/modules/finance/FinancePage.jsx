import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import StatCard from '../../components/StatCard';
import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import {
  CreditCard,
  Plus,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Trash2,
  Receipt,
  FileText,
  Search,
  Building2
} from 'lucide-react';

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'sales_inflow'
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'RENT',
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    recipient: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, saleRes] = await Promise.all([
        api.get('/expenses').catch(() => ({ data: [] })),
        api.get('/sales').catch(() => ({ data: [] }))
      ]);

      setExpenses(expRes?.data || []);
      setSales(saleRes?.data || []);
    } catch (err) {
      console.error('Error loading finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered lists
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter(
      (e) =>
        (e.expense_number && e.expense_number.toLowerCase().includes(q)) ||
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.recipient && e.recipient.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
    );
  }, [expenses, searchQuery]);

  const salesInflow = useMemo(() => {
    return sales
      .filter((s) => parseFloat(s.paid_amount || 0) > 0)
      .map((s) => ({
        id: s.id,
        invoice_number: s.invoice_number,
        date: s.sale_date || s.created_at,
        customer_name: s.customer_name || 'Walk-in Customer',
        customer_phone: s.customer_phone || '',
        warehouse_name: s.warehouse_name || 'Main Warehouse',
        grand_total: parseFloat(s.grand_total || 0),
        paid_amount: parseFloat(s.paid_amount || 0),
        payment_method: s.payment_method || 'CASH'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales]);

  const filteredSalesInflow = useMemo(() => {
    if (!searchQuery.trim()) return salesInflow;
    const q = searchQuery.toLowerCase();
    return salesInflow.filter(
      (s) =>
        (s.invoice_number && s.invoice_number.toLowerCase().includes(q)) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(q)) ||
        (s.payment_method && s.payment_method.toLowerCase().includes(q))
    );
  }, [salesInflow, searchQuery]);

  // Calculations
  const totalSalesRevenue = useMemo(() => {
    return salesInflow.reduce((acc, s) => acc + s.paid_amount, 0);
  }, [salesInflow]);

  const totalExpensesAmount = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (parseFloat(e.amount) || 0), 0);
  }, [expenses]);

  const netCashflow = totalSalesRevenue - totalExpensesAmount;

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      toast.success('Expense recorded successfully');
      setIsExpenseModalOpen(false);
      setExpenseForm({
        title: '',
        category: 'RENT',
        amount: '',
        paymentMethod: 'BANK_TRANSFER',
        recipient: '',
        notes: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to record expense');
    }
  };

  const confirmDeleteExpense = (exp) => {
    setDeletingExpense(exp);
  };

  const executeDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      setIsDeleting(true);
      await api.delete(`/expenses/${deletingExpense.id}`);
      toast.success('Expense deleted successfully');
      setDeletingExpense(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Finance & Cashflow</h1>
          <p className="page-subtitle">
            Track operational overhead expenses, auto-synced POS sales revenue, and net profit cashflow
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="segmented-control">
            <button
              onClick={() => {
                setActiveTab('expenses');
                setSearchQuery('');
              }}
              className={`segmented-tab ${activeTab === 'expenses' ? 'active' : ''}`}
            >
              <CreditCard size={15} /> Operational Expenses ({expenses.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('sales_inflow');
                setSearchQuery('');
              }}
              className={`segmented-tab ${activeTab === 'sales_inflow' ? 'active' : ''}`}
            >
              <TrendingUp size={15} /> POS Sales Revenue ({salesInflow.length})
            </button>
          </div>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}
          >
            <Plus size={15} /> Record Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}
      >
        <StatCard
          title="Total POS Sales Collected"
          value={`₹${totalSalesRevenue.toLocaleString('en-IN')}`}
          subtitle="Auto-tracked sales cash inflow"
          icon={TrendingUp}
          color="#10b981"
        />
        <StatCard
          title="Total Operational Expenses"
          value={`₹${totalExpensesAmount.toLocaleString('en-IN')}`}
          subtitle="Business operating overheads"
          icon={TrendingDown}
          color="#f43f5e"
        />
        <StatCard
          title="Net Business Cashflow"
          value={`₹${netCashflow.toLocaleString('en-IN')}`}
          subtitle="Revenue minus expenses"
          icon={DollarSign}
          color={netCashflow >= 0 ? '#7c3aed' : '#f43f5e'}
        />
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.35rem', height: '38px', fontSize: '0.84rem' }}
            placeholder={activeTab === 'expenses' ? 'Search expenses by title, payee, category...' : 'Search sales revenue by invoice #, customer...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'expenses' ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Expense #</th>
                  <th>Date</th>
                  <th>Title / Purpose</th>
                  <th>Category</th>
                  <th>Recipient / Payee</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                      <CreditCard size={36} style={{ margin: '0 auto 0.6rem auto', opacity: 0.4, display: 'block' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>No operational expenses recorded yet</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>Click "Record Expense" to track rent, bills, or overheads</div>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id}>
                      <td style={{ fontWeight: 700, color: '#dc2626', fontFamily: 'monospace' }}>
                        {exp.expense_number}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(exp.expense_date || exp.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{exp.title}</div>
                        {exp.notes && <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>{exp.notes}</div>}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a'
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, color: '#334155' }}>{exp.recipient || '—'}</td>
                      <td>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', fontFamily: 'monospace' }}>
                          {exp.payment_method}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.92rem' }}>
                        - ₹{parseFloat(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => confirmDeleteExpense(exp)}
                          className="btn btn-sm"
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#dc2626',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            cursor: 'pointer'
                          }}
                          title="Delete Expense Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Invoice #</th>
                  <th>Billing Date</th>
                  <th>Customer Name & Phone</th>
                  <th>Warehouse Outlet</th>
                  <th>Payment Mode</th>
                  <th style={{ textAlign: 'right' }}>Invoice Grand Total</th>
                  <th style={{ textAlign: 'right' }}>Amount Received</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesInflow.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                      <Receipt size={36} style={{ margin: '0 auto 0.6rem auto', opacity: 0.4, display: 'block' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#64748b' }}>No sales revenue recorded yet</div>
                      <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>Sales invoices from POS will automatically display revenue inflow here</div>
                    </td>
                  </tr>
                ) : (
                  filteredSalesInflow.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: '#7c3aed',
                            background: '#f5f3ff',
                            border: '1px solid #ddd6fe',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px'
                          }}
                        >
                          {s.invoice_number}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(s.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.customer_name}</div>
                        {s.customer_phone && (
                          <div style={{ fontSize: '0.73rem', color: '#64748b', fontFamily: 'monospace' }}>
                            +91 {s.customer_phone.replace(/\D/g, '').slice(-10)}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#475569', fontSize: '0.82rem' }}>{s.warehouse_name}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#334155',
                            border: '1px solid #e2e8f0',
                            fontFamily: 'monospace'
                          }}
                        >
                          {s.payment_method}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#64748b', fontSize: '0.88rem' }}>
                        ₹{s.grand_total.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                        + ₹{s.paid_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Record Business Expense">
        <form onSubmit={handleCreateExpense}>
          <div className="form-group">
            <label className="form-label">Expense Title / Description *</label>
            <input
              type="text"
              className="form-input"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              placeholder="e.g. Monthly Warehouse Rent or Electricity Bill"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <CustomSelect
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                options={[
                  { value: 'RENT', label: 'RENT' },
                  { value: 'UTILITIES', label: 'UTILITIES (Power, Water, Internet)' },
                  { value: 'SALARIES', label: 'SALARIES & PAYROLL' },
                  { value: 'LOGISTICS', label: 'LOGISTICS & FREIGHT' },
                  { value: 'MAINTENANCE', label: 'MAINTENANCE & REPAIRS' },
                  { value: 'MARKETING', label: 'MARKETING & ADS' },
                  { value: 'OFFICE_SUPPLIES', label: 'OFFICE SUPPLIES' },
                  { value: 'TAXES', label: 'TAXES & COMPLIANCE' },
                  { value: 'OTHER', label: 'OTHER MISC' }
                ]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                className="form-input"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="₹ 0.00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <CustomSelect
                value={expenseForm.paymentMethod}
                onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                options={[
                  { value: 'BANK_TRANSFER', label: 'BANK_TRANSFER / NEFT' },
                  { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                  { value: 'CARD', label: 'CREDIT / DEBIT CARD' },
                  { value: 'CASH', label: 'CASH' },
                  { value: 'CHEQUE', label: 'CHEQUE' }
                ]}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Recipient / Payee</label>
              <input
                type="text"
                className="form-input"
                value={expenseForm.recipient}
                onChange={(e) => setExpenseForm({ ...expenseForm, recipient: e.target.value })}
                placeholder="e.g. BESCOM or Landlord Name"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Notes (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              placeholder="e.g. Paid for invoice ref #98234"
            />
          </div>

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'var(--primary)', color: '#fff', fontWeight: 600 }}
            >
              Record Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={executeDeleteExpense}
        title="Delete Expense Record?"
        message="Are you sure you want to delete this expense record? This will adjust the net cashflow calculations."
        itemName={deletingExpense ? `${deletingExpense.title} (- ₹${parseFloat(deletingExpense.amount).toLocaleString('en-IN')})` : ''}
        confirmText="Delete Expense"
        loading={isDeleting}
      />
    </div>
  );
}
