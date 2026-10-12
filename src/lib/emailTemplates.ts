/**
 * Production-Ready Server-Side Email Template Engine
 * Clean, lightweight, responsive, accessible, mobile-friendly HTML & plaintext templates.
 */

const getAppBaseUrl = () => {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
};

export interface EmailTemplateData {
  customerName?: string;
  orderNumber?: string;
  orderId?: string;
  orderDate?: string;
  items?: Array<{
    title: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal?: number;
  discount?: number;
  tax?: number;
  shippingCharge?: number;
  grandTotal?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentId?: string;
  shippingAddress?: {
    fullName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
  };
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  deliveredDate?: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundId?: string;
  refundReason?: string;
  securityDetails?: string;
  invoiceUrl?: string;
  orderUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
}

const BRAND_NAME = 'ELECTRO STORE';
const PRIMARY_COLOR = '#2563eb';
const BG_COLOR = '#f8fafc';
const CARD_BG = '#ffffff';
const TEXT_COLOR = '#1e293b';
const MUTED_TEXT = '#64748b';

function wrapLayout(title: string, bodyContent: string, actionButton?: { text: string; url: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${TEXT_COLOR}; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .card { background-color: ${CARD_BG}; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background-color: #0f172a; padding: 24px; text-align: center; }
    .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; text-decoration: none; }
    .logo-accent { color: #3b82f6; }
    .content { padding: 32px 24px; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: ${MUTED_TEXT}; }
    .btn { display: inline-block; background-color: ${PRIMARY_COLOR}; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .table th { text-align: left; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: ${MUTED_TEXT}; text-transform: uppercase; }
    .table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background-color: #dbeafe; color: #1e40af; }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .badge-alert { background-color: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <span class="logo"><span class="logo-accent">ELECTRO</span>STORE</span>
      </div>
      <div class="content">
        ${bodyContent}
        ${actionButton ? `<div style="text-align: center; margin-top: 24px;"><a href="${actionButton.url}" class="btn">${actionButton.text}</a></div>` : ''}
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">Need assistance? Contact our customer support team directly from your account dashboard.</p>
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

export const emailTemplates = {
  // 1. Order Placed / Confirmation
  order_confirmation: (data: EmailTemplateData) => {
    const itemsHtml = (data.items || []).map(item => `
      <tr>
        <td style="font-weight: 500;">${item.title} <span style="color: ${MUTED_TEXT}; font-size: 12px;">&times; ${item.quantity}</span></td>
        <td style="text-align: right; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const body = `
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Thank You for Your Order!</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px;">Hello ${data.customerName || 'Customer'}, your order <strong>#${data.orderNumber || data.orderId}</strong> has been confirmed and is being processed.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 12px; color: ${MUTED_TEXT}; margin-bottom: 4px;">ORDER DETAILS</div>
        <div style="font-size: 14px;"><strong>Date:</strong> ${data.orderDate || new Date().toLocaleDateString('en-IN')}</div>
        <div style="font-size: 14px;"><strong>Payment Status:</strong> <span class="badge ${data.paymentStatus === 'captured' ? 'badge-success' : ''}">${(data.paymentStatus || 'confirmed').toUpperCase()}</span></div>
        ${data.estimatedDelivery ? `<div style="font-size: 14px;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</div>` : ''}
      </div>

      <h3 style="font-size: 14px; text-transform: uppercase; color: ${MUTED_TEXT}; margin: 20px 0 8px 0;">Items Ordered</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="2">Standard Electronic Items</td></tr>'}
        </tbody>
      </table>

      <div style="margin-top: 16px; border-top: 2px solid #e2e8f0; padding-top: 12px;">
        <table style="width: 100%; font-size: 14px;">
          ${data.subtotal ? `<tr><td>Subtotal:</td><td style="text-align: right;">₹${Number(data.subtotal || 0).toLocaleString('en-IN')}</td></tr>` : ''}
          ${data.discount ? `<tr><td>Discount:</td><td style="text-align: right; color: #16a34a;">-₹${Number(data.discount || 0).toLocaleString('en-IN')}</td></tr>` : ''}
          ${data.tax ? `<tr><td>GST / Tax:</td><td style="text-align: right;">₹${Number(data.tax || 0).toLocaleString('en-IN')}</td></tr>` : ''}
          ${data.shippingCharge !== undefined ? `<tr><td>Shipping:</td><td style="text-align: right;">${data.shippingCharge === 0 ? '<span style="color: #16a34a;">FREE</span>' : `₹${Number(data.shippingCharge || 0).toLocaleString('en-IN')}`}</td></tr>` : ''}
          <tr style="font-size: 16px; font-weight: 700; color: #0f172a;"><td style="padding-top: 8px;">Grand Total:</td><td style="text-align: right; padding-top: 8px;">₹${Number(data.grandTotal || 0).toLocaleString('en-IN')}</td></tr>
        </table>
      </div>

      ${data.shippingAddress ? `
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: ${MUTED_TEXT};">Delivery Address</h4>
        <p style="margin: 0; font-size: 14px; line-height: 1.5;">
          ${data.shippingAddress.fullName || ''}<br/>
          ${data.shippingAddress.addressLine1 || ''} ${data.shippingAddress.addressLine2 || ''}<br/>
          ${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} - ${data.shippingAddress.pincode || ''}<br/>
          Phone: ${data.shippingAddress.phone || 'N/A'}
        </p>
      </div>` : ''}
    `;

    return {
      subject: `Order Confirmed: #${data.orderNumber || data.orderId} - ELECTRO STORE`,
      html: wrapLayout('Order Confirmed', body, { text: 'Track Your Order', url: data.orderUrl || `${getAppBaseUrl()}/orders` })
    };
  },

  // 2. Payment Successful
  payment_success: (data: EmailTemplateData) => {
    const body = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 24px; background-color: #dcfce7; color: #16a34a; font-size: 28px; line-height: 48px; font-weight: bold;">&#10003;</div>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Payment Verified & Captured</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px; text-align: center;">Hello ${data.customerName || 'Customer'}, your payment for order <strong>#${data.orderNumber || data.orderId}</strong> was processed successfully.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Amount Paid:</td><td style="text-align: right; font-weight: 700; color: #0f172a;">₹${(data.grandTotal || 0).toLocaleString('en-IN')}</td></tr>
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Payment Status:</td><td style="text-align: right;"><span class="badge badge-success">CAPTURED</span></td></tr>
          ${data.paymentId ? `<tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Gateway Reference:</td><td style="text-align: right; font-family: monospace;">${data.paymentId}</td></tr>` : ''}
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Transaction Date:</td><td style="text-align: right;">${data.orderDate || new Date().toLocaleString('en-IN')}</td></tr>
        </table>
      </div>

      <p style="font-size: 13px; color: ${MUTED_TEXT};">Your official GST tax invoice is now available for download in your customer account.</p>
    `;

    return {
      subject: `Payment Successful: ₹${(data.grandTotal || 0).toLocaleString('en-IN')} for Order #${data.orderNumber || data.orderId}`,
      html: wrapLayout('Payment Successful', body, { text: 'View Invoice & Order', url: data.orderUrl || `${getAppBaseUrl()}/orders` })
    };
  },

  // 3. Payment Failed
  payment_failure: (data: EmailTemplateData) => {
    const body = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 24px; background-color: #fee2e2; color: #dc2626; font-size: 28px; line-height: 48px; font-weight: bold;">&#10005;</div>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #991b1b; text-align: center;">Payment Authorization Failed</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px; text-align: center;">Hello ${data.customerName || 'Customer'}, we could not process the payment for order <strong>#${data.orderNumber || data.orderId}</strong>.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #991b1b;">
        <strong>Reason:</strong> ${data.cancellationReason || 'The issuing bank or card network declined the transaction. No funds were debited.'}
      </div>

      <p style="font-size: 14px; color: ${TEXT_COLOR};">You can safely retry the payment using another payment method (UPI, NetBanking, Debit/Credit Card) without recreating your cart.</p>
    `;

    return {
      subject: `Payment Incomplete for Order #${data.orderNumber || data.orderId} - ELECTRO STORE`,
      html: wrapLayout('Payment Incomplete', body, { text: 'Retry Payment', url: data.orderUrl || `${getAppBaseUrl()}/orders` })
    };
  },

  // 4. Order Shipped / In-Transit
  order_shipped: (data: EmailTemplateData) => {
    const body = `
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Your Order Is On the Way!</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px;">Hello ${data.customerName || 'Customer'}, your package for order <strong>#${data.orderNumber || data.orderId}</strong> has been shipped and is in transit.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Courier Partner:</td><td style="text-align: right; font-weight: 600;">${data.carrier || 'Express Logistics'}</td></tr>
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Tracking AWB:</td><td style="text-align: right; font-family: monospace; font-weight: 600; color: #2563eb;">${data.trackingNumber || 'Available in portal'}</td></tr>
          ${data.estimatedDelivery ? `<tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Estimated Delivery:</td><td style="text-align: right; font-weight: 600;">${data.estimatedDelivery}</td></tr>` : ''}
        </table>
      </div>

      ${data.shippingAddress ? `
      <div style="font-size: 13px; color: ${MUTED_TEXT};">
        <strong>Delivering to:</strong> ${data.shippingAddress.fullName}, ${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.pincode}
      </div>` : ''}
    `;

    return {
      subject: `Your Order #${data.orderNumber || data.orderId} Has Shipped! - Track Shipment`,
      html: wrapLayout('Order Shipped', body, { text: 'Track Live Shipment', url: data.trackingUrl || data.orderUrl || `${getAppBaseUrl()}/orders` })
    };
  },

  // 5. Order Delivered
  order_delivered: (data: EmailTemplateData) => {
    const body = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 24px; background-color: #dcfce7; color: #16a34a; font-size: 28px; line-height: 48px; font-weight: bold;">&#10003;</div>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Order Delivered!</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px; text-align: center;">Hello ${data.customerName || 'Customer'}, package for order <strong>#${data.orderNumber || data.orderId}</strong> has been successfully delivered on ${data.deliveredDate || new Date().toLocaleDateString('en-IN')}.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; text-align: center;">
        We hope you enjoy your new electronics! If you have any questions or require warranty support, your invoice is saved in your account.
      </div>
    `;

    return {
      subject: `Delivered: Your ELECTRO STORE Order #${data.orderNumber || data.orderId}`,
      html: wrapLayout('Order Delivered', body, { text: 'Review Your Order', url: data.orderUrl || `${getAppBaseUrl()}/orders` })
    };
  },

  // 6. Order Cancelled
  order_cancelled: (data: EmailTemplateData) => {
    const body = `
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #991b1b;">Order Cancellation Notice</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px;">Hello ${data.customerName || 'Customer'}, your order <strong>#${data.orderNumber || data.orderId}</strong> has been cancelled.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
        <div><strong>Reason:</strong> ${data.cancellationReason || 'Requested by customer or order review'}</div>
        ${data.refundAmount ? `<div style="margin-top: 8px;"><strong>Refund Status:</strong> A refund of ₹${Number(data.refundAmount || 0).toLocaleString('en-IN')} has been initiated to your original payment method.</div>` : ''}
      </div>
    `;

    return {
      subject: `Order #${data.orderNumber || data.orderId} Cancelled - ELECTRO STORE`,
      html: wrapLayout('Order Cancelled', body, { text: 'View Account', url: `${getAppBaseUrl()}/orders` })
    };
  },

  // 7. Refund Processed
  refund_processed: (data: EmailTemplateData) => {
    const body = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; width: 48px; height: 48px; border-radius: 24px; background-color: #dcfce7; color: #16a34a; font-size: 28px; line-height: 48px; font-weight: bold;">₹</div>
      </div>
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center;">Refund Successfully Processed</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px; text-align: center;">Hello ${data.customerName || 'Customer'}, a refund of <strong>₹${(data.refundAmount || 0).toLocaleString('en-IN')}</strong> has been credited for Order <strong>#${data.orderNumber || data.orderId}</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 14px;">
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Refund Amount:</td><td style="text-align: right; font-weight: 700; color: #16a34a;">₹${(data.refundAmount || 0).toLocaleString('en-IN')}</td></tr>
          ${data.refundId ? `<tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Gateway Refund ID:</td><td style="text-align: right; font-family: monospace;">${data.refundId}</td></tr>` : ''}
          <tr><td style="color: ${MUTED_TEXT}; padding: 4px 0;">Estimated Bank Credit:</td><td style="text-align: right;">5-7 Business Days</td></tr>
        </table>
      </div>
    `;

    return {
      subject: `Refund Processed: ₹${(data.refundAmount || 0).toLocaleString('en-IN')} for Order #${data.orderNumber || data.orderId}`,
      html: wrapLayout('Refund Processed', body, { text: 'View Order History', url: data.orderUrl || `${getAppBaseUrl()}/orders` })
    };
  },

  // 8. Account Security / Verification
  account_security: (data: EmailTemplateData) => {
    const body = `
      <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Account Security Notification</h2>
      <p style="margin: 0 0 20px 0; color: ${MUTED_TEXT}; font-size: 14px;">Hello ${data.customerName || 'Customer'}, important security update on your ELECTRO STORE account.</p>
      
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
        ${data.securityDetails || 'A security event or preference update was recorded on your account.'}
      </div>
    `;

    return {
      subject: `Security Alert: ELECTRO STORE Account Activity`,
      html: wrapLayout('Security Alert', body, { text: 'Review Account Settings', url: `${getAppBaseUrl()}/account` })
    };
  }
};
