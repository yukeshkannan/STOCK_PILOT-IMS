/**
 * Brevo (Sendinblue) Transactional Email Service
 * Production-ready customer order status & notification engine.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || 'yukesh785.in@gmail.com';
    this.senderName = process.env.BREVO_SENDER_NAME || 'StockPilot Store';
  }

  /**
   * Core sender helper for Brevo REST API
   */
  async sendEmail({ toEmail, toName, subject, htmlContent }) {
    if (!toEmail || !toEmail.includes('@')) {
      console.warn('[EmailService] Skipped sending: invalid recipient email:', toEmail);
      return { success: false, reason: 'Invalid recipient email' };
    }

    const payload = {
      sender: {
        name: this.senderName,
        email: this.senderEmail
      },
      to: [
        {
          email: toEmail.trim(),
          name: (toName || 'Customer').trim()
        }
      ],
      subject,
      htmlContent
    };

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok || response.status === 201) {
        console.log(`[EmailService] [Brevo] Order email sent to ${toEmail} (MessageId: ${data.messageId || 'N/A'})`);
        return { success: true, messageId: data.messageId };
      } else {
        console.error('[EmailService] [Brevo API Error]:', response.status, data);
        return { success: false, error: data.message || `Brevo returned HTTP ${response.status}` };
      }
    } catch (err) {
      console.error('[EmailService] Network/Dispatch error:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Status theme configuration
   */
  getStatusTheme(status) {
    switch (status) {
      case 'CONFIRMED':
        return {
          title: 'Order Confirmed',
          color: '#2563eb',
          bg: '#eff6ff',
          badgeText: 'CONFIRMED',
          tagline: 'Your order has been verified and is scheduled for fulfillment.'
        };
      case 'PACKED':
        return {
          title: 'Order Packed & Sealed',
          color: '#0d9488',
          bg: '#f0fdfa',
          badgeText: 'PACKED & READY',
          tagline: 'Your items have been carefully picked, inspected, and safely packed.'
        };
      case 'SHIPPED':
        return {
          title: 'Order Dispatched & In Transit',
          color: '#7c3aed',
          bg: '#f5f3ff',
          badgeText: 'DISPATCHED',
          tagline: 'Your package is on its way with our trusted logistics courier partner.'
        };
      case 'OUT_FOR_DELIVERY':
        return {
          title: 'Out for Delivery Today',
          color: '#ea580c',
          bg: '#fff7ed',
          badgeText: 'ARRIVING TODAY',
          tagline: 'The courier executive is nearby with your delivery parcel.'
        };
      case 'DELIVERED':
        return {
          title: 'Order Delivered Successfully',
          color: '#16a34a',
          bg: '#f0fdf4',
          badgeText: 'DELIVERED',
          tagline: 'Your package has been successfully delivered. Thank you for your purchase!'
        };
      case 'CANCELLED':
        return {
          title: 'Order Cancelled',
          color: '#dc2626',
          bg: '#fef2f2',
          badgeText: 'CANCELLED',
          tagline: 'This order has been cancelled. Any pre-paid payments will be refunded.'
        };
      case 'PLACED':
      default:
        return {
          title: 'Order Placed Successfully',
          color: '#982A86',
          bg: '#fdf4ff',
          badgeText: 'ORDER PLACED',
          tagline: 'We have received your order and our store team is processing it.'
        };
    }
  }

  /**
   * Generates a modern, clean HTML transactional email
   */
  generateOrderEmailHtml({ order, tenantInfo, newStatus, trackingNumber, courierName, notes }) {
    const storeName = tenantInfo?.companyName || 'StockPilot Store';
    const storeCode = tenantInfo?.companyCode || '';
    const invoiceNum = order.invoice_number || `INV-${order.id}`;
    const customerName = order.customer_name || 'Valued Customer';
    const theme = this.getStatusTheme(newStatus);
    const trackingUrl = storeCode
      ? `https://app.stockpilot.store/store/${encodeURIComponent(storeCode)}?invoice=${encodeURIComponent(invoiceNum)}`
      : `https://app.stockpilot.store/track?invoice=${encodeURIComponent(invoiceNum)}`;

    const items = Array.isArray(order.items) ? order.items : [];
    const itemsHtml = items.map((item) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; color: #0f172a; font-size: 14px; font-weight: 600;">
          ${item.product_name || item.name || 'Catalog Item'}
          ${item.product_code ? `<span style="display: block; font-size: 11px; color: #94a3b8; font-weight: 500;">SKU: ${item.product_code}</span>` : ''}
        </td>
        <td style="padding: 12px 0; text-align: center; color: #475569; font-size: 14px;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 12px 0; text-align: right; color: #0f172a; font-size: 14px; font-weight: 700;">
          ₹${(parseFloat(item.total || (item.unit_price * item.quantity)) || 0).toLocaleString('en-IN')}
        </td>
      </tr>
    `).join('');

    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const courierSection = (courierName || trackingNumber) ? `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Courier & Shipment Details
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          ${courierName ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">Courier Partner:</td>
              <td style="padding: 4px 0; color: #0f172a; font-weight: 700;">${courierName}</td>
            </tr>
          ` : ''}
          ${trackingNumber ? `
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 140px;">AWB Tracking No:</td>
              <td style="padding: 4px 0; color: #7c3aed; font-weight: 700; font-family: monospace; font-size: 15px;">${trackingNumber}</td>
            </tr>
          ` : ''}
        </table>
      </div>
    ` : '';

    const notesSection = notes ? `
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <span style="font-size: 12px; font-weight: 700; color: #b45309; text-transform: uppercase;">Store Note:</span>
        <p style="margin: 4px 0 0; color: #92400e; font-size: 13px;">${notes}</p>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - ${invoiceNum}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table style="width: 100%; background-color: #f1f5f9; padding: 30px 15px;" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <table style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;" cellpadding="0" cellspacing="0">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background: #0f172a; padding: 24px 32px; text-align: left;">
                    <table style="width: 100%;">
                      <tr>
                        <td>
                          <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                            ${storeName}
                          </h1>
                          <span style="font-size: 12px; color: #94a3b8; font-weight: 500;">
                            Live Order Notification
                          </span>
                        </td>
                        <td align="right">
                          <span style="background: rgba(255,255,255,0.12); color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; font-family: monospace;">
                            #${invoiceNum}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Status Banner -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; background: ${theme.bg}; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: inline-block; background: ${theme.color}; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 10px; border-radius: 12px; margin-bottom: 12px;">
                      ${theme.badgeText}
                    </div>
                    <h2 style="margin: 0 0 6px 0; color: #0f172a; font-size: 22px; font-weight: 800;">
                      ${theme.title}
                    </h2>
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      Hello ${customerName}, ${theme.tagline}
                    </p>
                    <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
                      Status Updated: <strong>${formattedDate}</strong>
                    </div>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 28px 32px;">
                    ${courierSection}
                    ${notesSection}

                    <!-- Action Button -->
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: #0f172a; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(15,23,42,0.15);">
                        Track Your Order Live &rarr;
                      </a>
                    </div>

                    <!-- Items Summary -->
                    ${items.length > 0 ? `
                      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">
                          Items in this Order
                        </h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <thead>
                            <tr style="border-bottom: 2px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">
                              <th align="left" style="padding-bottom: 8px;">Product</th>
                              <th align="center" style="padding-bottom: 8px;">Qty</th>
                              <th align="right" style="padding-bottom: 8px;">Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsHtml}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colspan="2" style="padding-top: 14px; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right;">
                                Total Amount:
                              </td>
                              <td style="padding-top: 14px; font-size: 16px; font-weight: 800; color: #0f172a; text-align: right;">
                                ₹${parseFloat(order.grand_total || order.subtotal || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ` : ''}

                    <!-- Delivery Address -->
                    ${order.delivery_address ? `
                      <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 20px;">
                        <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                          Delivery Address
                        </div>
                        <div style="font-size: 13px; color: #334155; line-height: 1.4;">
                          ${order.delivery_address}
                        </div>
                      </div>
                    ` : ''}

                  </td>
                </tr>

                <!-- Store Support Footer -->
                <tr>
                  <td style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.6;">
                    Have questions about your order? Reach out directly to <strong>${storeName}</strong>.<br/>
                    ${tenantInfo?.phone ? `Phone: <strong>${tenantInfo.phone}</strong> | ` : ''}
                    ${tenantInfo?.email ? `Email: <strong>${tenantInfo.email}</strong>` : ''}
                    <div style="margin-top: 10px; font-size: 11px; color: #94a3b8;">
                      Powered by StockPilot Multi-Tenant Business Management Engine
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Main order status trigger called on every status update
   */
  async sendOrderStatusNotification({ order, tenantInfo, newStatus, trackingNumber, courierName, notes }) {
    const customerEmail = order.customer_email || order.email;
    if (!customerEmail) {
      console.log(`[EmailService] Order #${order.invoice_number} has no customer email recorded; notification skipped.`);
      return { success: false, reason: 'No email address on order' };
    }

    const storeName = tenantInfo?.companyName || 'StockPilot Store';
    const invoiceNum = order.invoice_number || `INV-${order.id}`;
    const statusSubjectMap = {
      CONFIRMED: `Order Confirmed: #${invoiceNum} from ${storeName}`,
      PACKED: `Packed & Ready: #${invoiceNum} from ${storeName}`,
      SHIPPED: `Dispatched: #${invoiceNum} from ${storeName} (In Transit)`,
      OUT_FOR_DELIVERY: `Out for Delivery: #${invoiceNum} arriving today!`,
      DELIVERED: `Delivered: #${invoiceNum} from ${storeName}`,
      CANCELLED: `Order Cancellation: #${invoiceNum} from ${storeName}`,
      PLACED: `Order Placed: #${invoiceNum} at ${storeName}`
    };

    const subject = statusSubjectMap[newStatus] || `Order Update: #${invoiceNum} is now ${newStatus}`;
    const htmlContent = this.generateOrderEmailHtml({
      order,
      tenantInfo,
      newStatus,
      trackingNumber,
      courierName,
      notes
    });

    return await this.sendEmail({
      toEmail: customerEmail,
      toName: order.customer_name || 'Customer',
      subject,
      htmlContent
    });
  }

  /**
   * OTP Verification Email
   */
  async sendOtpEmail({ toEmail, customerName, otp, storeName }) {
    const subject = `Your Verification Code for ${storeName || 'Online Store'}: ${otp}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; margin-top: 0;">${storeName || 'Store'} Verification Code</h2>
        <p style="color: #475569; font-size: 14px;">Hello ${customerName || 'there'},</p>
        <p style="color: #475569; font-size: 14px;">Use the verification code below to confirm your checkout / login:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #7c3aed; background: #f5f3ff; padding: 12px 24px; border-radius: 8px; border: 1px solid #ddd6fe;">
            ${otp}
          </span>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">This code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    return await this.sendEmail({
      toEmail,
      toName: customerName,
      subject,
      htmlContent
    });
  }
}

module.exports = new EmailService();
