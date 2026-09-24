import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import Preloader from '../../components/Preloader';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  RotateCw,
  ShoppingBag,
  Package,
  CreditCard,
  Building2,
  Receipt,
  FileText,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  ShieldCheck,
  Activity,
  User
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState('this_month'); // 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_year' | 'all' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('ALL');
  const [activeTableTab, setActiveTableTab] = useState('timeline'); // 'timeline' | 'products' | 'expenses' | 'payment_methods'

  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [returns, setReturns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [salesRes, expRes, purRes, retRes, whRes, auditRes] = await Promise.all([
        api.get('/sales?limit=2000').catch(() => ({ data: { sales: [] } })),
        api.get('/expenses').catch(() => ({ data: [] })),
        api.get('/purchases').catch(() => ({ data: [] })),
        api.get('/sales-returns').catch(() => ({ data: [] })),
        api.get('/warehouses').catch(() => ({ data: [] })),
        api.get('/inventory/audit-logs?limit=200').catch(() => ({ data: { logs: [] } }))
      ]);

      const salesList = Array.isArray(salesRes?.data) ? salesRes.data : salesRes?.data?.sales || [];
      const expList = Array.isArray(expRes?.data) ? expRes.data : [];
      const purList = Array.isArray(purRes?.data) ? purRes.data : purRes?.data?.purchases || [];
      const retList = Array.isArray(retRes?.data) ? retRes.data : [];
      const whList = Array.isArray(whRes?.data) ? whRes.data : [];
      const auditList = Array.isArray(auditRes?.data) ? auditRes.data : (auditRes?.data?.logs || []);

      setSales(salesList);
      setExpenses(expList);
      setPurchases(purList);
      setReturns(retList);
      setWarehouses(whList);
      setAuditLogs(auditList);
    } catch (err) {
      console.error('Error fetching analytics reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Determine Date Range based on timeframe filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (timeframe === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeframe === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (timeframe === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeframe === 'last_30_days') {
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (timeframe === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (timeframe === 'custom' && customStartDate && customEndDate) {
      start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // 'all'
      start = new Date(2020, 0, 1);
      end = new Date(2035, 11, 31);
    }

    return { start, end };
  }, [timeframe, customStartDate, customEndDate]);

  // Filtered Datasets strictly adhering to selected timeframe & warehouse
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = new Date(s.sale_date || s.created_at);
      const inDate = sDate >= dateRange.start && sDate <= dateRange.end;
      const inWh = selectedWarehouse === 'ALL' || String(s.warehouse_id) === String(selectedWarehouse);
      return inDate && inWh;
    });
  }, [sales, dateRange, selectedWarehouse]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const eDate = new Date(e.expense_date || e.created_at);
      return eDate >= dateRange.start && eDate <= dateRange.end;
    });
  }, [expenses, dateRange]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const pDate = new Date(p.purchase_date || p.created_at);
      const inDate = pDate >= dateRange.start && pDate <= dateRange.end;
      const inWh = selectedWarehouse === 'ALL' || String(p.warehouse_id) === String(selectedWarehouse);
      return inDate && inWh;
    });
  }, [purchases, dateRange, selectedWarehouse]);

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const rDate = new Date(r.created_at);
      const inDate = rDate >= dateRange.start && rDate <= dateRange.end;
      const inWh = selectedWarehouse === 'ALL' || String(r.warehouse_id) === String(selectedWarehouse);
      return inDate && inWh;
    });
  }, [returns, dateRange, selectedWarehouse]);

  // Real-time Key Executive Metrics
  const totalGrossRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (parseFloat(s.grand_total) || 0), 0);
  }, [filteredSales]);

  const totalCollectedCash = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (parseFloat(s.paid_amount) || 0), 0);
  }, [filteredSales]);

  const totalOperatingExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalProcurementCost = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
  }, [filteredPurchases]);

  const totalRefundAmount = useMemo(() => {
    return filteredReturns.reduce((sum, r) => sum + (parseFloat(r.total_refund) || 0), 0);
  }, [filteredReturns]);

  const netProfit = totalGrossRevenue - totalOperatingExpenses - totalRefundAmount;
  const netMarginPercentage = totalGrossRevenue > 0 ? ((netProfit / totalGrossRevenue) * 100).toFixed(1) : '0.0';
  const averageOrderValue = filteredSales.length > 0 ? Math.round(totalGrossRevenue / filteredSales.length) : 0;

  // Total Units Sold in Period
  const totalUnitsSold = useMemo(() => {
    let count = 0;
    filteredSales.forEach((s) => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((item) => {
          count += parseInt(item.quantity || 0, 10);
        });
      }
    });
    return count;
  }, [filteredSales]);

  // Dynamic Time Series Trend Data (Grouped intelligently based on timeframe)
  const timelineTrendData = useMemo(() => {
    const map = new Map();

    if (timeframe === 'today') {
      // Hour by Hour (8 AM to 10 PM)
      for (let h = 8; h <= 22; h += 2) {
        const label = `${h > 12 ? h - 12 : h} ${h >= 12 ? 'PM' : 'AM'}`;
        map.set(label, { label, revenue: 0, expenses: 0, profit: 0, orders: 0 });
      }
      filteredSales.forEach((s) => {
        const d = new Date(s.sale_date || s.created_at);
        const h = d.getHours();
        const roundedHour = Math.floor(h / 2) * 2;
        const bucket = Math.max(8, Math.min(22, roundedHour));
        const label = `${bucket > 12 ? bucket - 12 : bucket} ${bucket >= 12 ? 'PM' : 'AM'}`;
        if (map.has(label)) {
          const entry = map.get(label);
          entry.revenue += parseFloat(s.grand_total || 0);
          entry.orders += 1;
        }
      });
      filteredExpenses.forEach((e) => {
        const d = new Date(e.expense_date || e.created_at);
        const h = d.getHours();
        const roundedHour = Math.floor(h / 2) * 2;
        const bucket = Math.max(8, Math.min(22, roundedHour));
        const label = `${bucket > 12 ? bucket - 12 : bucket} ${bucket >= 12 ? 'PM' : 'AM'}`;
        if (map.has(label)) {
          const entry = map.get(label);
          entry.expenses += parseFloat(e.amount || 0);
        }
      });
    } else if (timeframe === 'this_week' || timeframe === 'last_30_days') {
      // Day by Day format
      filteredSales.forEach((s) => {
        const d = new Date(s.sale_date || s.created_at);
        const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (!map.has(label)) {
          map.set(label, { label, rawDate: d, revenue: 0, expenses: 0, profit: 0, orders: 0 });
        }
        const entry = map.get(label);
        entry.revenue += parseFloat(s.grand_total || 0);
        entry.orders += 1;
      });
      filteredExpenses.forEach((e) => {
        const d = new Date(e.expense_date || e.created_at);
        const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        if (!map.has(label)) {
          map.set(label, { label, rawDate: d, revenue: 0, expenses: 0, profit: 0, orders: 0 });
        }
        const entry = map.get(label);
        entry.expenses += parseFloat(e.amount || 0);
      });
    } else {
      // Month by Month format for 'this_month', 'this_year', 'all', 'custom'
      filteredSales.forEach((s) => {
        const d = new Date(s.sale_date || s.created_at);
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        if (!map.has(label)) {
          map.set(label, { label, rawDate: d, revenue: 0, expenses: 0, profit: 0, orders: 0 });
        }
        const entry = map.get(label);
        entry.revenue += parseFloat(s.grand_total || 0);
        entry.orders += 1;
      });
      filteredExpenses.forEach((e) => {
        const d = new Date(e.expense_date || e.created_at);
        const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        if (!map.has(label)) {
          map.set(label, { label, rawDate: d, revenue: 0, expenses: 0, profit: 0, orders: 0 });
        }
        const entry = map.get(label);
        entry.expenses += parseFloat(e.amount || 0);
      });
    }

    const result = Array.from(map.values()).map((row) => ({
      ...row,
      profit: row.revenue - row.expenses
    }));

    if (result.length > 0 && result[0].rawDate) {
      result.sort((a, b) => a.rawDate - b.rawDate);
    }
    return result;
  }, [filteredSales, filteredExpenses, timeframe]);

  // Product-wise Performance Aggregation
  const productPerformance = useMemo(() => {
    const map = new Map();

    filteredSales.forEach((s) => {
      if (s.items && Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const key = item.product_id || item.product_code || item.product_name;
          if (!map.has(key)) {
            map.set(key, {
              id: item.product_id,
              name: item.product_name || 'Product',
              code: item.product_code || 'PRD',
              unitsSold: 0,
              totalRevenue: 0,
              avgUnitPrice: parseFloat(item.unit_price) || 0
            });
          }
          const p = map.get(key);
          p.unitsSold += parseInt(item.quantity || 0, 10);
          p.totalRevenue += parseFloat(item.total_price || (item.quantity * item.unit_price) || 0);
        });
      }
    });

    const arr = Array.from(map.values());
    arr.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return arr;
  }, [filteredSales]);

  // Expense Categories Allocation
  const categoryExpenses = useMemo(() => {
    const map = new Map();
    filteredExpenses.forEach((e) => {
      const cat = e.category || 'OTHER';
      if (!map.has(cat)) {
        map.set(cat, { category: cat, count: 0, amount: 0 });
      }
      const entry = map.get(cat);
      entry.count += 1;
      entry.amount += parseFloat(e.amount || 0);
    });

    const arr = Array.from(map.values());
    arr.sort((a, b) => b.amount - a.amount);
    return arr;
  }, [filteredExpenses]);

  // Payment Methods Breakdown
  const paymentMethodsMix = useMemo(() => {
    const map = new Map();
    filteredSales.forEach((s) => {
      const mode = s.payment_method || 'CASH';
      if (!map.has(mode)) {
        map.set(mode, { method: mode, count: 0, totalAmount: 0 });
      }
      const entry = map.get(mode);
      entry.count += 1;
      entry.totalAmount += parseFloat(s.paid_amount || s.grand_total || 0);
    });

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredSales]);

  // Color Palette
  const THEME_COLORS = ['#7c3aed', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

  // Smart CSV Exporter
  const handleExportCSV = () => {
    let csv = '';
    const dateStamp = new Date().toISOString().slice(0, 10);

    if (activeTableTab === 'timeline') {
      csv = 'Period,Orders / Invoices,Gross Revenue (INR),Operating Expenses (INR),Net Profit (INR),Margin %\n';
      timelineTrendData.forEach((row) => {
        const margin = row.revenue > 0 ? (((row.revenue - row.expenses) / row.revenue) * 100).toFixed(1) : '0';
        csv += `"${row.label}",${row.orders || 0},${row.revenue},${row.expenses},${row.profit},${margin}%\n`;
      });
    } else if (activeTableTab === 'products') {
      csv = 'SKU Code,Product Name,Units Sold,Total Revenue (INR),Avg Unit Price (INR),% Contribution\n';
      productPerformance.forEach((p) => {
        const share = totalGrossRevenue > 0 ? ((p.totalRevenue / totalGrossRevenue) * 100).toFixed(1) : '0';
        csv += `"${p.code}","${p.name}",${p.unitsSold},${p.totalRevenue},${p.avgUnitPrice},${share}%\n`;
      });
    } else if (activeTableTab === 'expenses') {
      csv = 'Expense Category,Vouchers Count,Total Amount (INR),% Share of Overheads\n';
      categoryExpenses.forEach((c) => {
        const share = totalOperatingExpenses > 0 ? ((c.amount / totalOperatingExpenses) * 100).toFixed(1) : '0';
        csv += `"${c.category}",${c.count},${c.amount},${share}%\n`;
      });
    } else if (activeTableTab === 'payment_methods') {
      csv = 'Payment Mode,Invoices Count,Total Amount Collected (INR),% Share\n';
      paymentMethodsMix.forEach((pm) => {
        const share = totalCollectedCash > 0 ? ((pm.totalAmount / totalCollectedCash) * 100).toFixed(1) : '0';
        csv += `"${pm.method}",${pm.count},${pm.totalAmount},${share}%\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StockPilot_Analytics_${activeTableTab}_${dateStamp}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Preloader
        message="Generating Intelligence Reports..."
        submessage="Synthesizing real-time sales curves, margins, and expense logs"
      />
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <h1 className="page-title">Reports & Business Intelligence</h1>
          <p className="page-subtitle">
            Real-time financial analytics, product sales performance, and exportable business audit intelligence
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Refresh All Analytics"
          >
            <RotateCw size={14} className={loading ? 'spin' : ''} /> {loading ? 'Updating...' : 'Sync Live'}
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
          >
            <Download size={14} /> Export {activeTableTab.toUpperCase()} CSV
          </button>
        </div>
      </div>

      {/* Filter Toolbar: Timeframe Selector + Warehouse Outlet + Custom Range */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} /> Timeframe:
          </span>
          <div className="segmented-control" style={{ margin: 0 }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_30_days', label: 'Last 30 Days' },
              { id: 'this_year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' }
            ].map((tf) => (
              <button
                key={tf.id}
                onClick={() => setTimeframe(tf.id)}
                className={`segmented-tab ${timeframe === tf.id ? 'active' : ''}`}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {timeframe === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="date"
                className="form-input"
                style={{ height: '34px', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>to</span>
              <input
                type="date"
                className="form-input"
                style={{ height: '34px', fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={15} color="#94a3b8" />
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="form-input"
              style={{ height: '34px', fontSize: '0.78rem', padding: '0.2rem 0.6rem', minWidth: '160px' }}
            >
              <option value="ALL">All Store Outlets ({warehouses.length})</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-stat-grid">
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>Gross Sales Inflow</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0 0.15rem 0' }}>
            ₹{totalGrossRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            {filteredSales.length} invoice(s) &bull; {totalUnitsSold} units sold
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>Operational Expenses</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626', margin: '0.4rem 0 0.15rem 0' }}>
            - ₹{totalOperatingExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            {filteredExpenses.length} overhead voucher(s) logged
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>Net Operating Margin</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: netProfit >= 0 ? '#dcfce7' : '#fee2e2', color: netProfit >= 0 ? '#166534' : '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: netProfit >= 0 ? '#16a34a' : '#dc2626', margin: '0.4rem 0 0.15rem 0' }}>
            ₹{netProfit.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 700, color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
              {netMarginPercentage}%
            </span>
            <span>net profit margin</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.1rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>Avg Order Value (AOV)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0.4rem 0 0.15rem 0' }}>
            ₹{averageOrderValue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
            Per transaction basket size
          </div>
        </div>
      </div>

      {/* Graphs Section (100% Dynamic with Recharts) */}
      <div className="dashboard-grid-2">
        {/* Main Revenue vs Expenses Financial Bar Chart */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart3 size={17} color="#7c3aed" /> Revenue vs Overhead Trends
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Dynamic inflow vs outflow balance across {timeframe.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%' }}>
            {timelineTrendData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <BarChart3 size={32} style={{ opacity: 0.3, marginBottom: '6px' }} />
                No sales or expense records found for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                  <Tooltip
                    formatter={(val) => [`₹${parseFloat(val).toLocaleString('en-IN')}`, '']}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                      fontSize: '0.8rem',
                      color: '#0f172a'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '8px' }} />
                  <Bar dataKey="revenue" name="Sales Inflow (₹)" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Overhead Expenses (₹)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieIcon size={17} color="#ec4899" /> Operating Overheads Allocation
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Breakdown of {filteredExpenses.length} expense vouchers logged
              </p>
            </div>
          </div>

          <div style={{ height: '280px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {categoryExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <CreditCard size={32} style={{ opacity: 0.3, marginBottom: '6px', margin: '0 auto' }} />
                No expenses logged in this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`₹${parseFloat(val).toLocaleString('en-IN')}`, `${name}`]}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                      fontSize: '0.8rem'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts: Top Products & Payment Modes */}
      <div className="dashboard-grid-2">
        {/* Top 5 Products by Revenue */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={17} color="#0284c7" /> Top-Selling Products (Revenue Contribution)
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Highest earning inventory items sold in this period
              </p>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            {productPerformance.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <ShoppingBag size={32} style={{ opacity: 0.3, marginBottom: '6px' }} />
                No product sales records in this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={productPerformance.slice(0, 5)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} width={100} />
                  <Tooltip
                    formatter={(val) => [`₹${parseFloat(val).toLocaleString('en-IN')}`, 'Revenue']}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  />
                  <Bar dataKey="totalRevenue" name="Revenue (₹)" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment Methods Distribution */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: '1rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={17} color="#10b981" /> Payment Channels Mix
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Cash, UPI, and Card distribution across counter sales
              </p>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {paymentMethodsMix.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                <Receipt size={32} style={{ opacity: 0.3, marginBottom: '6px', margin: '0 auto' }} />
                No sales payment data found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="totalAmount"
                    nameKey="method"
                  >
                    {paymentMethodsMix.map((entry, index) => (
                      <Cell key={`pm-${index}`} fill={THEME_COLORS[(index + 2) % THEME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [`₹${parseFloat(val).toLocaleString('en-IN')}`, `${name}`]}
                    contentStyle={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Tab Data Tables Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <div
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            background: '#ffffff'
          }}
        >
          <div className="segmented-control" style={{ margin: 0 }}>
            <button
              onClick={() => setActiveTableTab('timeline')}
              className={`segmented-tab ${activeTableTab === 'timeline' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              <Calendar size={13} /> Periodic Summary ({timelineTrendData.length})
            </button>
            <button
              onClick={() => setActiveTableTab('products')}
              className={`segmented-tab ${activeTableTab === 'products' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              <Package size={13} /> Product Sales Breakdown ({productPerformance.length})
            </button>
            <button
              onClick={() => setActiveTableTab('expenses')}
              className={`segmented-tab ${activeTableTab === 'expenses' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              <CreditCard size={13} /> Overheads Breakdown ({categoryExpenses.length})
            </button>
            <button
              onClick={() => setActiveTableTab('payment_methods')}
              className={`segmented-tab ${activeTableTab === 'payment_methods' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              <Receipt size={13} /> Payment Channels ({paymentMethodsMix.length})
            </button>
            <button
              onClick={() => setActiveTableTab('audit_logs')}
              className={`segmented-tab ${activeTableTab === 'audit_logs' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem' }}
            >
              <ShieldCheck size={13} /> Audit & Activity Logs ({auditLogs.length})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Download size={13} /> Download Active Table CSV
          </button>
        </div>

        {/* TAB 1: TIMELINE SUMMARY */}
        {activeTableTab === 'timeline' && (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Timeline Period</th>
                  <th style={{ textAlign: 'center' }}>Total Orders</th>
                  <th style={{ textAlign: 'right' }}>Gross Sales Revenue</th>
                  <th style={{ textAlign: 'right' }}>Overhead Expenses</th>
                  <th style={{ textAlign: 'right' }}>Net Operating Profit</th>
                  <th style={{ textAlign: 'right' }}>Net Margin %</th>
                </tr>
              </thead>
              <tbody>
                {timelineTrendData.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No ledger transactions found in the selected date range.
                    </td>
                  </tr>
                ) : (
                  timelineTrendData.map((row, idx) => {
                    const margin = row.revenue > 0 ? (((row.revenue - row.expenses) / row.revenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{row.label}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: '#f1f5f9', color: '#334155', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                            {row.orders || 0} bills
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#7c3aed' }}>
                          ₹{row.revenue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', color: '#dc2626' }}>
                          - ₹{row.expenses.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: row.profit >= 0 ? '#16a34a' : '#dc2626' }}>
                          ₹{row.profit.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={`badge ${row.profit >= 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                            {margin}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: PRODUCT SALES BREAKDOWN */}
        {activeTableTab === 'products' && (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>SKU Code</th>
                  <th>Product Name</th>
                  <th style={{ textAlign: 'center' }}>Units Sold</th>
                  <th style={{ textAlign: 'right' }}>Avg Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total Revenue</th>
                  <th style={{ textAlign: 'right' }}>% Revenue Share</th>
                </tr>
              </thead>
              <tbody>
                {productPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No product sales recorded in this timeframe.
                    </td>
                  </tr>
                ) : (
                  productPerformance.map((p, idx) => {
                    const share = totalGrossRevenue > 0 ? ((p.totalRevenue / totalGrossRevenue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>
                          {p.code}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                            {p.unitsSold} units
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', color: '#64748b' }}>
                          ₹{p.avgUnitPrice.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284c7' }}>
                          ₹{p.totalRevenue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.8rem' }}>
                            {share}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: EXPENSE OVERHEADS BREAKDOWN */}
        {activeTableTab === 'expenses' && (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Expense Category</th>
                  <th style={{ textAlign: 'center' }}>Total Vouchers Logged</th>
                  <th style={{ textAlign: 'right' }}>Total Outflow (₹)</th>
                  <th style={{ textAlign: 'right' }}>% Share of Overheads</th>
                </tr>
              </thead>
              <tbody>
                {categoryExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No expense overheads logged in this timeframe.
                    </td>
                  </tr>
                ) : (
                  categoryExpenses.map((c, idx) => {
                    const share = totalOperatingExpenses > 0 ? ((c.amount / totalOperatingExpenses) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                            {c.category}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                          {c.count} expense bill(s)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                          - ₹{c.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: '#64748b', fontSize: '0.82rem' }}>
                            {share}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: PAYMENT CHANNELS BREAKDOWN */}
        {activeTableTab === 'payment_methods' && (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Payment Mode</th>
                  <th style={{ textAlign: 'center' }}>Invoices Processed</th>
                  <th style={{ textAlign: 'right' }}>Total Collected (₹)</th>
                  <th style={{ textAlign: 'right' }}>Channel Share %</th>
                </tr>
              </thead>
              <tbody>
                {paymentMethodsMix.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No payment data logged in this timeframe.
                    </td>
                  </tr>
                ) : (
                  paymentMethodsMix.map((pm, idx) => {
                    const share = totalCollectedCash > 0 ? ((pm.totalAmount / totalCollectedCash) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {pm.method}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                          {pm.count} transaction(s)
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                          + ₹{pm.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                            {share}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL & ACTIVITY LOGS */}
        {activeTableTab === 'audit_logs' && (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th>Timestamp</th>
                  <th>User / Actor</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Details & Changes</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      <ShieldCheck size={36} style={{ opacity: 0.3, marginBottom: '8px', margin: '0 auto' }} />
                      <p style={{ margin: 0 }}>No audit log records recorded yet.</p>
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at || log.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#6366f1" />
                          <span>{log.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(99, 102, 241, 0.1)',
                          color: '#4f46e5'
                        }}>
                          {log.module}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: log.action.includes('DELETE')
                            ? 'rgba(239, 68, 68, 0.1)'
                            : log.action.includes('CREATE')
                            ? 'rgba(34, 197, 94, 0.1)'
                            : 'rgba(234, 179, 8, 0.1)',
                          color: log.action.includes('DELETE')
                            ? '#dc2626'
                            : log.action.includes('CREATE')
                            ? '#16a34a'
                            : '#d97706'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#475569' }}>
                        {log.entity_id || '—'}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#334155' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
