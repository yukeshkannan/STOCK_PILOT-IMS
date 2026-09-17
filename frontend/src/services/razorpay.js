// Utility to dynamically load official Razorpay Checkout SDK
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const openRazorpayCheckout = async ({
  key,
  amount, // in Rupees (e.g. 1500.50)
  poNumber,
  supplierName,
  description,
  userEmail,
  userPhone,
  companyName = 'StockPilot',
  notes = {},
  themeColor = '#982A86',
  onSuccess,
  onDismiss
}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Could not connect to Razorpay Gateway SDK. Please check your internet connection.');
  }

  let razorpayKey = (key || localStorage.getItem('stockpilot_rzp_key') || '').trim();
  if (!razorpayKey || razorpayKey === 'rzp_test_51b7Z0wZ4N3F8C') {
    razorpayKey = 'rzp_test_TZszoYWU51JmHM';
    localStorage.setItem('stockpilot_rzp_key', razorpayKey);
  }

  const rawAmount = parseFloat(amount) || 0;
  const isTestMode = razorpayKey.startsWith('rzp_test_');

  // Razorpay Test/Sandbox gateway enforces a maximum limit of ₹50,000 per transaction.
  const payableAmount = (isTestMode && rawAmount > 50000) ? 50000 : rawAmount;
  const amountInPaise = Math.round(payableAmount * 100);

  const defaultDesc = description || (poNumber
    ? (isTestMode && rawAmount > 50000
        ? `PO #${poNumber} • Total: ₹${rawAmount.toLocaleString('en-IN')} (Sandbox Test: ₹50,000)`
        : `PO #${poNumber} • Total: ₹${rawAmount.toLocaleString('en-IN')}`)
    : `StockPilot Subscription Upgrade • Total: ₹${rawAmount.toLocaleString('en-IN')}`);

  const combinedNotes = {
    ...(poNumber ? { po_number: poNumber } : {}),
    ...(supplierName ? { supplier_name: supplierName } : {}),
    actual_order_total: `₹${rawAmount}`,
    ...notes
  };

  const options = {
    key: razorpayKey,
    amount: amountInPaise,
    currency: 'INR',
    name: companyName,
    description: defaultDesc,
    prefill: {
      ...(userEmail ? { email: userEmail } : {}),
      ...(userPhone ? { contact: userPhone } : {})
    },
    notes: combinedNotes,
    theme: {
      color: themeColor || '#982A86'
    },
    modal: {
      ondismiss: function () {
        if (onDismiss) onDismiss();
      }
    },
    handler: function (response) {
      if (onSuccess) {
        onSuccess(response);
      }
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response) {
    console.error('Razorpay Payment Failed:', response.error);
    if (onDismiss) onDismiss(response.error);
  });
  rzp.open();
};
