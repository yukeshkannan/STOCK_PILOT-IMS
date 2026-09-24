import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { updateProfile } from '../../app/authSlice';
import { openRazorpayCheckout } from '../../services/razorpay';
import { toast } from 'react-toastify';
import {
  Check,
  CheckCircle2,
  X,
  CreditCard,
  Building,
  RefreshCw,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function SubscriptionPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [currentPlan, setCurrentPlan] = useState(user?.plan || 'TRIAL');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [loadingPlanId, setLoadingPlanId] = useState(null);

  const [activationModal, setActivationModal] = useState({
    isOpen: false,
    plan: null,
    txnId: '',
    amount: 0
  });

  // Sync latest plan from tenant settings on mount
  useEffect(() => {
    if (user?.tenantId && !user?.isSuperAdmin) {
      api.get('/tenants/settings')
        .then((res) => {
          if (res?.data?.plan) {
            setCurrentPlan(res.data.plan);
            if (user && user.plan !== res.data.plan) {
              dispatch(updateProfile({ plan: res.data.plan }));
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch tenant settings for plan:', err.message);
        });
    }
  }, [user?.tenantId, user?.isSuperAdmin]);

  const plans = [
    {
      id: 'TRIAL',
      name: 'Free Trial',
      description: 'Full exploratory access for 14 days',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        '1 Warehouse location',
        'Up to 2 staff accounts',
        'Live inventory tracking',
        'Standard POS counter billing',
        'Basic stock alerts'
      ]
    },
    {
      id: 'STARTER',
      name: 'Starter',
      description: 'For growing retail stores and small shops',
      priceMonthly: 499,
      priceYearly: 4990,
      features: [
        '2 Warehouse facilities',
        'Up to 5 staff accounts',
        'Stock transfers & approvals',
        'Purchase orders & supplier tracking',
        'Tax invoices & thermal receipts'
      ]
    },
    {
      id: 'PRO',
      name: 'Pro',
      description: 'For scaling retail chains & wholesalers',
      priceMonthly: 1499,
      priceYearly: 14990,
      isPopular: true,
      features: [
        '5 Warehouses & stores',
        'Up to 15 team members',
        'High-speed POS & instant billing',
        'Purchase return (RMA) workflow',
        'Financial analytics & GST reports',
        'Priority support'
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      description: 'For multi-hub businesses & large operations',
      priceMonthly: 3999,
      priceYearly: 39990,
      features: [
        'Unlimited warehouses & hubs',
        'Unlimited team members',
        'Multi-branch GSTIN support',
        'Audit logs & advanced security',
        'Custom integrations & SLA'
      ]
    }
  ];

  const handleUpgradeSuccess = async (plan, txnId, amt) => {
    try {
      setLoadingPlanId(plan.id);
      const res = await api.post('/tenants/subscription/upgrade', {
        plan: plan.id,
        paymentId: txnId,
        paymentMethod: 'RAZORPAY'
      });

      if (res?.success || res?.data) {
        const newPlan = plan.id;
        setCurrentPlan(newPlan);

        // Update Redux state and localStorage
        dispatch(updateProfile({ plan: newPlan }));
        const storedUser = JSON.parse(localStorage.getItem('stockpilot_user') || '{}');
        storedUser.plan = newPlan;
        localStorage.setItem('stockpilot_user', JSON.stringify(storedUser));

        // Dispatch window event so Navbar & Sidebar update live
        window.dispatchEvent(new Event('stockpilot_plan_changed'));

        setActivationModal({
          isOpen: true,
          plan: plan,
          txnId: txnId,
          amount: amt
        });
        toast.success(`${plan.name} plan activated!`);
      }
    } catch (err) {
      console.error('Subscription upgrade failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update plan');
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan.id === currentPlan) {
      return;
    }

    if (plan.id === 'TRIAL') {
      handleUpgradeSuccess(plan, `trial_${Date.now()}`, 0);
      return;
    }

    const amountToPay = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

    let rzpKey = (localStorage.getItem('stockpilot_rzp_key') || '').trim();
    if (!rzpKey || rzpKey === 'rzp_test_51b7Z0wZ4N3F8C') {
      rzpKey = 'rzp_test_TZszoYWU51JmHM';
      localStorage.setItem('stockpilot_rzp_key', rzpKey);
    }

    setLoadingPlanId(plan.id);

    openRazorpayCheckout({
      key: rzpKey,
      amount: amountToPay,
      companyName: 'StockPilot',
      description: `${plan.name} Plan Upgrade (${billingCycle})`,
      userEmail: user?.email || '',
      userPhone: user?.phone || '',
      themeColor: '#982A86',
      onSuccess: (response) => {
        const txnId = response.razorpay_payment_id || `pay_${Date.now()}`;
        handleUpgradeSuccess(plan, txnId, amountToPay);
      },
      onDismiss: () => {
        setLoadingPlanId(null);
      }
    }).catch((err) => {
      console.error('Razorpay launch error:', err);
      setLoadingPlanId(null);
      toast.error('Could not open payment window. Please try again.');
    });
  };

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.6rem' }}>
            Subscription & Plans
          </h1>
          <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
            Choose a plan that fits your business needs. Upgrade or switch anytime.
          </p>
        </div>

        {/* Current Plan Card */}
        <div
          style={{
            background: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '12px',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Current Plan
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary, #982A86)' }}>
              {currentPlan === 'TRIAL' ? '14-Day Free Trial' : `${currentPlan} Plan`}
            </div>
          </div>
          <span
            style={{
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '999px'
            }}
          >
            Active
          </span>
        </div>
      </div>

      {/* Monthly / Annual Toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: billingCycle === 'monthly' ? '#ffffff' : 'transparent',
              color: billingCycle === 'monthly' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            style={{
              padding: '0.45rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: billingCycle === 'yearly' ? '#ffffff' : 'transparent',
              color: billingCycle === 'yearly' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: billingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            Yearly
            <span
              style={{
                background: '#ecfdf5',
                color: '#059669',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '4px'
              }}
            >
              20% off
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          alignItems: 'stretch'
        }}
      >
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const price = plan.id === 'TRIAL'
            ? 0
            : billingCycle === 'monthly'
            ? plan.priceMonthly
            : Math.round(plan.priceYearly / 12);

          return (
            <div
              key={plan.id}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                border: plan.isPopular
                  ? '2px solid #982A86'
                  : '1px solid #e2e8f0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                boxShadow: plan.isPopular
                  ? '0 8px 24px -4px rgba(152, 42, 134, 0.12)'
                  : '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              {plan.isPopular && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-11px',
                    left: '1.25rem',
                    background: '#982A86',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    letterSpacing: '0.03em'
                  }}
                >
                  POPULAR
                </span>
              )}

              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1.25rem 0', minHeight: '34px', lineHeight: 1.4 }}>
                  {plan.description}
                </p>

                {/* Price */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                      {plan.id === 'TRIAL' ? '/ 14 days' : '/ month'}
                    </span>
                  </div>
                  {plan.id !== 'TRIAL' && billingCycle === 'yearly' && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Billed ₹{plan.priceYearly.toLocaleString('en-IN')} annually
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.82rem', color: '#334155' }}>
                        <Check size={15} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <button
                    disabled
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'default'
                    }}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={loadingPlanId === plan.id}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: plan.isPopular ? '#982A86' : '#0f172a',
                      color: '#ffffff',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {loadingPlanId === plan.id ? (
                      <RefreshCw size={14} className="spin" />
                    ) : (
                      plan.id === 'TRIAL' ? 'Switch to Trial' : 'Upgrade Plan'
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust note */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
        <ShieldCheck size={16} color="#059669" />
        <span>Secure payments processed via Razorpay Test Sandbox. Instant activation with GST invoices.</span>
      </div>

      {/* Success Modal */}
      {activationModal.isOpen && activationModal.plan && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '1rem'
          }}
          onClick={() => setActivationModal({ isOpen: false, plan: null, txnId: '', amount: 0 })}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '420px',
              width: '100%',
              padding: '2rem 1.75rem',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
              Plan Updated!
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem 0', lineHeight: 1.4 }}>
              Your workspace is now on the <b>{activationModal.plan.name}</b> tier.
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                padding: '0.85rem 1rem',
                textAlign: 'left',
                fontSize: '0.8rem',
                marginBottom: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Plan:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{activationModal.plan.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Transaction ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{activationModal.txnId}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActivationModal({ isOpen: false, plan: null, txnId: '', amount: 0 });
                navigate('/dashboard');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                background: '#982A86',
                color: '#ffffff',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
