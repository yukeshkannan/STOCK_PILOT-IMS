import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import PrintInvoiceModal from '../../components/PrintInvoiceModal';
import Preloader from '../../components/Preloader';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  ArrowRightLeft,
  PlusCircle,
  FileText,
  Warehouse,
  Clock,
  ArrowRight,
  CheckCircle2,
  Box,
  Building,
  Layers,
  Truck,
  CheckCheck,
  ShoppingBag,
  Receipt
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Role & Branch scoping flags
  const userRole = (user?.roleName || user?.role || 'ADMIN').toUpperCase();
  const isSuperAdmin = Boolean(user?.isSuperAdmin) || userRole === 'SUPER_ADMIN';
  const assignedWhId = user?.warehouseId || user?.warehouse_id ? String(user.warehouseId || user.warehouse_id) : null;
  const assignedWhName = user?.warehouseName || user?.warehouse_name || null;
  const isGlobalAdmin = isSuperAdmin || (userRole === 'ADMIN' && !assignedWhId);
  const isBranchScoped = Boolean(assignedWhId) && !isGlobalAdmin;
  const isStaff = userRole === 'STAFF';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [repRes, salesRes, stockRes, whRes, invRes, transRes] = await Promise.all([
        !isStaff ? api.get('/reports/dashboard').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
        api.get('/sales?limit=50').catch(() => ({ data: [] })),
        api.get('/inventory?lowStockOnly=true&limit=20').catch(() => ({ data: [] })),
        api.get('/warehouses').catch(() => ({ data: [] })),
        api.get('/inventory?limit=500').catch(() => ({ data: { stocks: [] } })),
        api.get('/transfers').catch(() => ({ data: [] }))
      ]);

      // Normalize array data safely
      const parseList = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.stocks)) return res.stocks;
        if (Array.isArray(res.data?.stocks)) return res.data.stocks;
        if (Array.isArray(res.data?.sales)) return res.data.sales;
        return [];
      };

      setReportData(repRes?.data || repRes || null);
      setRecentSales(parseList(salesRes));
      setLowStockItems(parseList(stockRes));
      setWarehouses(parseList(whRes));
      setAllStocks(parseList(invRes));
      setTransfers(parseList(transRes));
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Scoped Sales Records
  const scopedSales = useMemo(() => {
    if (isBranchScoped && assignedWhId) {
      const filtered = recentSales.filter((s) => String(s.warehouse_id) === String(assignedWhId));
      return filtered.length > 0 ? filtered : recentSales;
    }
    return recentSales;
  }, [recentSales, isBranchScoped, assignedWhId]);

  // Scoped Stock Records
  const scopedStocks = useMemo(() => {
    if (isBranchScoped && assignedWhId) {
      const filtered = allStocks.filter((s) => String(s.warehouse_id) === String(assignedWhId));
      return filtered.length > 0 ? filtered : allStocks;
    }
    return allStocks;
  }, [allStocks, isBranchScoped, assignedWhId]);

  // Scoped Low Stock Items
  const scopedLowStock = useMemo(() => {
    if (isBranchScoped && assignedWhId) {
      const filtered = lowStockItems.filter((s) => String(s.warehouse_id) === String(assignedWhId));
      return filtered.length > 0 ? filtered : lowStockItems;
    }
    return lowStockItems;
  }, [lowStockItems, isBranchScoped, assignedWhId]);

  // Scoped Transfers (inbound vs outbound for branch)
  const scopedTransfers = useMemo(() => {
    if (isBranchScoped && assignedWhId) {
      return transfers.filter(
        (t) => String(t.from_warehouse_id) === String(assignedWhId) || String(t.to_warehouse_id) === String(assignedWhId)
      );
    }
    return transfers;
  }, [transfers, isBranchScoped, assignedWhId]);

  const inboundTransfers = useMemo(() => {
    if (!assignedWhId) return [];
    return scopedTransfers.filter(
      (t) => String(t.to_warehouse_id) === String(assignedWhId) && (t.status === 'IN_TRANSIT' || t.status === 'APPROVED')
    );
  }, [scopedTransfers, assignedWhId]);

  // Real-time Revenue & Valuations
  const totalSalesRevenue = useMemo(() => {
    return scopedSales.reduce((sum, s) => {
      const amt = parseFloat(s.grand_total) || parseFloat(s.total_amount) || parseFloat(s.subtotal) || 0;
      return sum + amt;
    }, 0);
  }, [scopedSales]);

  // Today's Sales Calculation
  const todaySalesRevenue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return scopedSales
      .filter((s) => (s.sale_date && s.sale_date.slice(0, 10) === today) || (s.created_at && s.created_at.slice(0, 10) === today))
      .reduce((sum, s) => {
        const amt = parseFloat(s.grand_total) || parseFloat(s.total_amount) || parseFloat(s.subtotal) || 0;
        return sum + amt;
      }, 0);
  }, [scopedSales]);

  const realTotalUnits = useMemo(() => {
    return scopedStocks.reduce((sum, s) => sum + Number(s.current_stock || 0), 0);
  }, [scopedStocks]);

  const realValuation = useMemo(() => {
    return scopedStocks.reduce((sum, s) => {
      const qty = Number(s.current_stock || 0);
      const price = Number(s.unit_cost || s.cost_price || s.price || 0);
      return sum + qty * price;
    }, 0);
  }, [scopedStocks]);

  const isFreshWorkspace = scopedSales.length === 0 && scopedStocks.length === 0;

  const kpis = {
    totalRevenue: totalSalesRevenue > 0 ? totalSalesRevenue : (reportData?.kpis?.totalRevenue || 0),
    todayRevenue: todaySalesRevenue > 0 ? todaySalesRevenue : totalSalesRevenue,
    totalExpenses: reportData?.kpis?.totalExpenses || 0,
    grossProfit: reportData?.kpis?.grossProfit !== undefined ? reportData.kpis.grossProfit : Math.round(totalSalesRevenue * 0.3),
    netProfit: reportData?.kpis?.netProfit !== undefined ? reportData.kpis.netProfit : Math.round(totalSalesRevenue * 0.25),
    inventoryValuation: realValuation,
    inStockUnits: realTotalUnits
  };

  // Dynamic 6-Month Monthly Trends computed from real sales
  const monthlyTrends = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    const map = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(currentMonthIdx - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = {
        month: monthNames[d.getMonth()],
        revenue: 0,
        profit: 0
      };
    }

    scopedSales.forEach((s) => {
      const date = new Date(s.sale_date || s.created_at);
      if (!isNaN(date.getTime())) {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (map[key]) {
          const amt = parseFloat(s.grand_total) || parseFloat(s.total_amount) || 0;
          map[key].revenue += amt;
          map[key].profit += Math.round(amt * 0.25);
        }
      }
    });

    return Object.values(map);
  }, [scopedSales]);

  // Dynamic Top Selling Products computed from real sales line items or catalog
  const topProducts = useMemo(() => {
    const productMap = {};

    scopedSales.forEach((s) => {
      const items = s.items || [];
      items.forEach((it) => {
        const pId = it.product_id || it.productId || it.product_name;
        if (!productMap[pId]) {
          productMap[pId] = {
            id: pId,
            name: it.product_name || `Item ${pId}`,
            sku: it.product_code || `SKU-${pId}`,
            category: 'Retail',
            sold: 0,
            stock: 0,
            revenueNum: 0
          };
        }
        productMap[pId].sold += Number(it.quantity || 1);
        productMap[pId].revenueNum += parseFloat(it.total_price || (it.unit_price * (it.quantity || 1)) || 0);
      });
    });

    // Populate current stock from inventory
    scopedStocks.forEach((st) => {
      const pId = st.product_id || st.id;
      if (productMap[pId]) {
        productMap[pId].stock = Number(st.current_stock || 0);
        if (st.category_name) productMap[pId].category = st.category_name;
      }
    });

    const list = Object.values(productMap).sort((a, b) => b.revenueNum - a.revenueNum);
    return list.slice(0, 5).map((p) => ({
      ...p,
      revenue: `₹${p.revenueNum.toLocaleString()}`
    }));
  }, [scopedSales, scopedStocks]);

  // Multi-Warehouse Stock Distribution
  const warehouseDistribution = useMemo(() => {
    return warehouses.map((w, idx) => {
      const whStock = allStocks
        .filter((s) => String(s.warehouse_id) === String(w.id))
        .reduce((sum, s) => sum + Number(s.current_stock || 0), 0);
      return {
        name: w.name || `Warehouse ${idx + 1}`,
        value: whStock
      };
    });
  }, [warehouses, allStocks]);

  const DONUT_COLORS = ['#982A86', '#0284c7', '#059669', '#d97706', '#6366f1'];
  const totalStockUnits = warehouseDistribution.reduce((acc, curr) => acc + curr.value, 0);

  // Dynamic Activity Stream from real events
  const dynamicActivities = useMemo(() => {
    const acts = [];

    // Recent Sales
    scopedSales.slice(0, 5).forEach((s) => {
      const amt = parseFloat(s.grand_total) || 0;
      const invNum = s.invoice_number || `INV-${s.id}`;
      const timeStr = s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today';
      acts.push({
        id: `sale-${s.id}`,
        text: `Invoice #${invNum} completed for ${s.customer_name || 'Walk-in'} (₹${amt.toLocaleString()}) by ${s.created_by || 'Staff'}`,
        time: timeStr,
        type: 'sale'
      });
    });

    // Recent Transfers
    scopedTransfers.slice(0, 3).forEach((t) => {
      acts.push({
        id: `trf-${t.id}`,
        text: `Stock Transfer #${t.transfer_number || t.id} (${t.status})`,
        time: 'Recent',
        type: 'transfer'
      });
    });

    // Low stock warnings
    scopedLowStock.slice(0, 2).forEach((l) => {
      acts.push({
        id: `low-${l.id}`,
        text: `Low stock alert: ${l.product_name} (${l.current_stock} remaining)`,
        time: 'Active Alert',
        type: 'alert'
      });
    });

    if (acts.length === 0) {
      acts.push({
        id: 'workspace-init',
        text: `${user?.companyName || 'StockPilot'} workspace online and ready for operations`,
        time: 'Active now',
        type: 'system'
      });
    }

    return acts;
  }, [scopedSales, scopedTransfers, scopedLowStock, user]);

  if (loading) {
    return (
      <Preloader
        message="Loading workspace..."
        submessage="Syncing live inventory, POS counters, and revenue streams"
      />
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      {/* Top Header & Operational Actions */}
      <div
        className="page-header"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isBranchScoped && assignedWhName ? `${assignedWhName} Hub Dashboard` : `${user?.companyName || 'Business'} Dashboard`}
            </h1>
            {isBranchScoped && assignedWhName ? (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Building size={12} /> Branch Operations
              </span>
            ) : isStaff ? (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShoppingBag size={12} /> POS Terminal Console
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Layers size={12} /> Global Enterprise
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            {isStaff
              ? 'Point-of-sale retail counter, live stock lookup, and fast billing console'
              : isBranchScoped
              ? `Operational metrics and physical inventory oversight for ${assignedWhName}`
              : 'Consolidated overview of multi-warehouse inventory, logistics, and company finances'}
          </p>
        </div>

        {/* Action Buttons tailored by role */}
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <Link
            to="/sales/new"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', fontWeight: 700 }}
          >
            <PlusCircle size={15} /> New POS Sale
          </Link>
          {!isStaff && (
            <>
              <Link
                to="/purchases"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', fontWeight: 600 }}
              >
                <ShoppingCart size={15} /> Purchase Order
              </Link>
              <Link
                to="/warehouses"
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.825rem', fontWeight: 600 }}
              >
                <ArrowRightLeft size={15} /> Stock Transfers
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Fresh Workspace Setup Guide (Only if no stock and no sales) */}
      {isFreshWorkspace && isGlobalAdmin && (
        <div
          className="card"
          style={{
            padding: '1.5rem 1.75rem',
            marginBottom: '1.5rem',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ marginBottom: '1.1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
              Getting Started with {user?.companyName || 'Your Workspace'}
            </h2>
            <p style={{ fontSize: '0.825rem', color: '#64748b', margin: 0 }}>
              Complete these steps to set up your product catalog, record stock quantities, and begin point-of-sale billing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#982A86', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Step 1</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '4px' }}>Add Products & Items</div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.45 }}>Configure your SKUs, categories, purchase costs, and retail prices.</p>
              </div>
              <Link to="/products" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}>
                Add Products <ArrowRight size={13} style={{ marginLeft: '4px' }} />
              </Link>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Step 2</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '4px' }}>Record Initial Stock</div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.45 }}>Assign initial stock counts to your warehouses or facilities.</p>
              </div>
              <Link to="/inventory" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}>
                Manage Stock <ArrowRight size={13} style={{ marginLeft: '4px' }} />
              </Link>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>Step 3</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', marginBottom: '4px' }}>Create First POS Sale</div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px', lineHeight: 1.45 }}>Open the billing terminal to process customer sales and generate tax invoices.</p>
              </div>
              <Link to="/sales/new" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem' }}>
                Open POS Terminal <ArrowRight size={13} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core KPI Cards Grid */}
      <div className="kpi-stat-grid">
        {isStaff ? (
          <>
            <StatCard
              title="Today's Counter Sales"
              value={`₹${kpis.todayRevenue.toLocaleString()}`}
              subtitle={`${scopedSales.length} Total Sales Invoices`}
              icon={DollarSign}
              color="#982A86"
            />
            <StatCard
              title="Assigned Facility"
              value={assignedWhName || 'Store Counter'}
              subtitle="Active billing station"
              icon={Building}
              color="#0284c7"
            />
            <StatCard
              title="Available Stock in Store"
              value={`${kpis.inStockUnits.toLocaleString()} Units`}
              subtitle="Ready for counter billing"
              icon={Package}
              color="#10b981"
            />
            <StatCard
              title="Low Stock Alerts"
              value={scopedLowStock.length > 0 ? `${scopedLowStock.length} Items Low` : 'Stock Healthy'}
              subtitle={scopedLowStock.length > 0 ? 'Notify Manager for Restock' : 'All items optimal'}
              icon={AlertTriangle}
              color={scopedLowStock.length > 0 ? '#ef4444' : '#10b981'}
            />
          </>
        ) : isBranchScoped ? (
          <>
            <StatCard
              title="Branch Inventory Value"
              value={`₹${kpis.inventoryValuation.toLocaleString()}`}
              subtitle={`${kpis.inStockUnits.toLocaleString()} units in ${assignedWhName || 'Facility'}`}
              icon={Package}
              color="#982A86"
            />
            <StatCard
              title="Inbound Goods Pipeline"
              value={`${inboundTransfers.length} Shipments`}
              subtitle={inboundTransfers.length > 0 ? 'Goods arriving to be received' : 'No incoming transfers'}
              icon={Truck}
              color="#0284c7"
            />
            <StatCard
              title="Branch Low Stock Items"
              value={scopedLowStock.length > 0 ? `${scopedLowStock.length} SKUs Below Threshold` : 'All Stock Healthy'}
              subtitle={scopedLowStock.length > 0 ? 'Raise transfer or purchase' : 'Safety buffer intact'}
              icon={AlertTriangle}
              color={scopedLowStock.length > 0 ? '#ef4444' : '#10b981'}
            />
            <StatCard
              title="Branch Sales Revenue"
              value={`₹${kpis.totalRevenue.toLocaleString()}`}
              subtitle={`${scopedSales.length} orders processed`}
              icon={TrendingUp}
              color="#10b981"
            />
          </>
        ) : (
          <>
            <StatCard
              title="Total Gross Revenue"
              value={`₹${kpis.totalRevenue.toLocaleString()}`}
              subtitle={`${scopedSales.length} Total Sales Orders`}
              icon={DollarSign}
              color="#982A86"
            />
            <StatCard
              title="Estimated Gross Profit"
              value={`₹${kpis.grossProfit.toLocaleString()}`}
              subtitle="Based on completed sales orders"
              icon={TrendingUp}
              color="#10b981"
            />
            <StatCard
              title="Consolidated Stock Valuation"
              value={`₹${kpis.inventoryValuation.toLocaleString()}`}
              subtitle={`${kpis.inStockUnits.toLocaleString()} units across ${warehouses.length || 1} facilities`}
              icon={Package}
              color="#0284c7"
            />
            <StatCard
              title="Global Low Stock Alerts"
              value={lowStockItems.length > 0 ? `${lowStockItems.length} Items Below Min` : 'Stock Healthy'}
              subtitle={lowStockItems.length > 0 ? 'Reordering required across hubs' : 'All hubs above safety threshold'}
              icon={AlertTriangle}
              color={lowStockItems.length > 0 ? '#ef4444' : '#10b981'}
            />
          </>
        )}
      </div>

      {/* Grid 1: Analytics / Inbound Pipeline & Warehouse Distribution */}
      <div className="dashboard-grid-2">
        {/* Revenue Trends */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Revenue & Sales Trajectory
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Monthly sales revenue and operating profit trends
              </p>
            </div>
          </div>

          <div style={{ height: '240px', width: '100%', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#982A86" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#982A86" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val, name) => [`₹${Number(val).toLocaleString()}`, name === 'revenue' ? 'Revenue' : 'Profit']}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    fontSize: '0.8rem'
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#982A86" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right side: Stock allocation / Branch transfers */}
        {isBranchScoped ? (
          <div className="card">
            <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Truck size={16} color="#982A86" />
                  <span>{assignedWhName} Logistics Movements</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Inbound and outbound stock transfers for this branch
                </p>
              </div>
              <Link to="/warehouses" style={{ fontSize: '0.78rem', color: '#982A86', fontWeight: 600 }}>
                Manage Transfers →
              </Link>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              {scopedTransfers.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', flexDirection: 'column', color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>
                  <Truck size={36} strokeWidth={1.5} color="#cbd5e1" style={{ marginBottom: '0.65rem' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>No Active Branch Transfers</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Inter-facility goods transfers involving {assignedWhName} will appear here.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {scopedTransfers.slice(0, 4).map((t) => {
                    const isInbound = String(t.to_warehouse_id) === String(assignedWhId);
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '0.75rem 0.95rem',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.8rem' }}>
                              {t.transfer_number}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: isInbound ? '#ecfdf5' : '#eff6ff',
                                color: isInbound ? '#059669' : '#1d4ed8'
                              }}
                            >
                              {isInbound ? '⬇ Inbound to Branch' : '⬆ Outbound from Branch'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                            {isInbound ? `From: ${t.fromWarehouse?.name || 'Origin'}` : `To: ${t.toWarehouse?.name || 'Destination'}`} • {(t.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0)} Units
                          </div>
                        </div>

                        <div>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              background: t.status === 'COMPLETED' ? '#ecfdf5' : t.status === 'IN_TRANSIT' ? '#eff6ff' : '#fffbeb',
                              color: t.status === 'COMPLETED' ? '#059669' : t.status === 'IN_TRANSIT' ? '#1d4ed8' : '#b45309'
                            }}
                          >
                            {t.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Warehouse size={16} color="#982A86" />
                  <span>Warehouse Stock Allocation</span>
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                  Physical stock distribution across facilities
                </p>
              </div>
              <Link to="/warehouses" style={{ fontSize: '0.78rem', color: '#982A86', fontWeight: 600 }}>
                Manage Facilities →
              </Link>
            </div>

            {totalStockUnits === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '260px', flexDirection: 'column', color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>
                <Box size={36} strokeWidth={1.5} color="#cbd5e1" style={{ marginBottom: '0.65rem' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>0 Total Units in Stock</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.25rem', maxWidth: '280px' }}>
                  Add inventory items to view allocation across locations
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '260px', gap: '1rem', padding: '0 0.5rem' }}>
                <div style={{ width: '48%', height: '100%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warehouseDistribution}
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {warehouseDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => `${val} units`}
                        contentStyle={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                          fontSize: '0.8rem'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'block', lineHeight: 1.1 }}>
                      {totalStockUnits}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      Total Units
                    </span>
                  </div>
                </div>

                {/* Warehouse Breakdown */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                  {warehouseDistribution.map((wh, idx) => {
                    const percent = Math.round((wh.value / (totalStockUnits || 1)) * 100);
                    const color = DONUT_COLORS[idx % DONUT_COLORS.length];
                    return (
                      <div key={wh.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
                            {wh.name}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {wh.value} <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>({percent}%)</span>
                          </span>
                        </div>
                        <div style={{ height: '5px', width: '100%', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '9999px' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid 2: Top Selling Products & Critical Low Stock */}
      <div className="dashboard-grid-2">
        {/* Top Products Table */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <TrendingUp size={16} color="#982A86" />
                <span>Top Selling Products</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Highest volume products from completed sales
              </p>
            </div>
            <Link to="/products" style={{ fontSize: '0.78rem', color: '#982A86', fontWeight: 600 }}>
              Full Catalog →
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>#</th>
                  <th>Product & SKU</th>
                  <th>Units Sold</th>
                  <th>Remaining</th>
                  <th style={{ textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                      No product sales recorded yet. Completed sales will automatically populate rankings.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={p.id}>
                      <td>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: idx === 0 ? '#fdf2fb' : '#f8fafc',
                            color: idx === 0 ? '#982A86' : '#64748b',
                            border: idx === 0 ? '1px solid #f3c7ec' : '1px solid #e2e8f0'
                          }}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.825rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {p.sku} • {p.category}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.sold}</span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}> units</span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            background: p.stock <= 10 ? '#fef2f2' : '#f0fdf4',
                            color: p.stock <= 10 ? '#991b1b' : '#166534',
                            border: p.stock <= 10 ? '1px solid #fecaca' : '1px solid #bbf7d0'
                          }}
                        >
                          {p.stock} in stock
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{p.revenue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock & Reorder Alerts */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertTriangle size={16} color="#d97706" />
                <span>{isBranchScoped ? `${assignedWhName} Low Stock Alerts` : 'Low Stock & Reorder Alerts'}</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Items below threshold requiring stock replenishment
              </p>
            </div>
            <Link to="/inventory" style={{ fontSize: '0.78rem', color: '#982A86', fontWeight: 600 }}>
              Inventory Hub →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {scopedLowStock.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#059669' }}>
                <CheckCircle2 size={32} color="#059669" style={{ marginBottom: '0.4rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Inventory Quantities Healthy</div>
                <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {isBranchScoped ? `All items stored in ${assignedWhName} are above safety thresholds.` : 'All items across your warehouses are above minimum threshold quantities.'}
                </p>
              </div>
            ) : (
              scopedLowStock.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.75rem 0.95rem',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.825rem', color: '#0f172a' }}>
                      {item.product_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      SKU: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.product_code}</span> • {item.warehouse_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span className="badge badge-danger" style={{ fontWeight: 700, fontSize: '0.72rem' }}>
                      {item.current_stock} / Min {item.minimum_stock}
                    </span>
                    {!isStaff && (
                      <Link
                        to={`/purchases?action=new&productId=${item.product_id || item.id || ''}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}
                      >
                        + Reorder
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid 3: Recent Invoices & Operational Activity Stream */}
      <div className="dashboard-grid-2" style={{ marginBottom: 0 }}>
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                Recent Sales Invoices
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Latest customer billing transactions
              </p>
            </div>
            <Link to="/sales" style={{ fontSize: '0.78rem', color: '#982A86', fontWeight: 600 }}>
              All Invoices →
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {scopedSales.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.825rem' }}>
                      No sales recorded yet. Use the POS Terminal to start billing.
                    </td>
                  </tr>
                ) : (
                  scopedSales.slice(0, 10).map((s) => {
                    const amt = parseFloat(s.grand_total) || parseFloat(s.total_amount) || 0;
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 700, color: '#982A86', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {s.invoice_number}
                        </td>
                        <td style={{ fontWeight: 500, color: '#0f172a', fontSize: '0.825rem' }}>
                          {s.customer_name}
                        </td>
                        <td style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.825rem' }}>
                          ₹{amt.toLocaleString()}
                        </td>
                        <td>
                          <Badge status={s.payment_status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedInvoice(s)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            title="View & Print Invoice"
                          >
                            <FileText size={12} /> Print
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Log Stream */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: '0.85rem' }}>
            <div>
              <h3 className="card-title" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={16} color="#982A86" />
                <span>Operational Activity</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                Live inventory and sales event logs
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {dynamicActivities.map((act) => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #f1f5f9'
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    background: act.type === 'sale' ? '#fdf2fb' : act.type === 'alert' ? '#fffbeb' : '#f1f5f9',
                    color: act.type === 'sale' ? '#982A86' : act.type === 'alert' ? '#d97706' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '1px'
                  }}
                >
                  {act.type === 'sale' ? <Receipt size={13} /> : act.type === 'alert' ? <AlertTriangle size={13} /> : <Package size={13} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.35 }}>
                    {act.text}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <PrintInvoiceModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          sale={selectedInvoice}
          tenant={user}
        />
      )}
    </div>
  );
}
