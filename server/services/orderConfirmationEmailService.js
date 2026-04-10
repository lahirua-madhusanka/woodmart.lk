import env from "../config/env.js";
import { sendBrevoTransactionalEmail } from "./brevoTransactionalEmailService.js";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatOrderDate = (isoDate) => {
  const date = isoDate ? new Date(isoDate) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPaymentMethod = (paymentMethod) => {
  const normalized = String(paymentMethod || "").toLowerCase();
  if (normalized === "cod") return "Cash on Delivery";
  if (normalized === "card") return "Card Payment";
  if (normalized === "other") return "Other";
  return paymentMethod || "N/A";
};

const formatShippingAddress = (shippingAddress = {}) => {
  const lines = [
    shippingAddress.line1,
    shippingAddress.line2,
    [shippingAddress.city, shippingAddress.state].filter(Boolean).join(", "),
    [shippingAddress.postalCode, shippingAddress.country].filter(Boolean).join(", "),
    shippingAddress.phone ? `Phone: ${shippingAddress.phone}` : "",
  ].filter(Boolean);

  return lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
};

const buildItemRows = (items = []) =>
  items
    .map((item) => {
      const lineSubtotal = Number(item.lineSubtotal || Number(item.price || 0) * Number(item.quantity || 0));
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;vertical-align:top">
            <div style="font-weight:600;color:#0f172a">${escapeHtml(item.name || "Product")}</div>
            <div style="font-size:12px;color:#64748b">Unit price: ${formatCurrency(item.price)}</div>
          </td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;color:#334155">${Number(item.quantity || 0)}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#0f172a">${formatCurrency(lineSubtotal)}</td>
        </tr>
      `;
    })
    .join("");

export const buildOrderConfirmationEmailHtml = (orderData = {}) => {
  const brandName = escapeHtml(env.orderEmailBrandName || "Woodmart.lk");
  const customerName = escapeHtml(orderData.customerName || orderData.userId?.name || "Customer");
  const orderId = escapeHtml(orderData.id || orderData._id || "N/A");
  const orderDate = escapeHtml(formatOrderDate(orderData.createdAt));
  const paymentMethod = escapeHtml(formatPaymentMethod(orderData.paymentMethod));
  const paymentStatus = escapeHtml(orderData.paymentStatus || "pending");
  const orderStatus = escapeHtml(orderData.orderStatus || "pending");
  const subtotal = formatCurrency(orderData.subtotalAmount);
  const shippingTotal = formatCurrency(orderData.shippingTotal);
  const discountTotal = formatCurrency(orderData.discountTotal);
  const total = formatCurrency(orderData.totalAmount);
  const orderUrl = `${env.clientUrl}/order-confirmation/${encodeURIComponent(orderData.id || orderData._id || "")}`;
  const continueShoppingUrl = `${env.clientUrl}/shop`;

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="padding:22px 24px;background:linear-gradient(135deg,#0b66bd,#0959a4);color:#ffffff">
          <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.92">${brandName}</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3">Order Confirmed</h1>
        </div>

        <div style="padding:24px">
          <p style="margin:0 0 10px 0">Hi ${customerName},</p>
          <p style="margin:0 0 18px 0;color:#334155">Thank you for your order. We have received your purchase and will begin processing it shortly.</p>

          <div style="margin:0 0 18px 0;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
            <div style="margin-bottom:6px"><strong>Order ID:</strong> ${orderId}</div>
            <div style="margin-bottom:6px"><strong>Order Date:</strong> ${orderDate}</div>
            <div style="margin-bottom:6px"><strong>Payment Method:</strong> ${paymentMethod}</div>
            <div style="margin-bottom:6px"><strong>Payment Status:</strong> ${paymentStatus}</div>
            <div><strong>Order Status:</strong> ${orderStatus}</div>
          </div>

          <h2 style="margin:0 0 10px 0;font-size:18px">Shipping Address</h2>
          <div style="margin:0 0 18px 0;padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:#ffffff;color:#334155">
            ${formatShippingAddress(orderData.shippingAddress || {})}
          </div>

          <h2 style="margin:0 0 10px 0;font-size:18px">Order Items</h2>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <thead>
              <tr style="background:#f1f5f9">
                <th style="text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px">Product</th>
                <th style="text-align:center;padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;width:80px">Qty</th>
                <th style="text-align:right;padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px;width:140px">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${buildItemRows(orderData.items || [])}
            </tbody>
          </table>

          <table style="width:100%;margin-top:16px;border-collapse:collapse">
            <tbody>
              <tr>
                <td style="padding:4px 0;color:#475569">Subtotal</td>
                <td style="padding:4px 0;text-align:right;color:#0f172a">${subtotal}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#475569">Shipping</td>
                <td style="padding:4px 0;text-align:right;color:#0f172a">${shippingTotal}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#475569">Discount</td>
                <td style="padding:4px 0;text-align:right;color:#0f172a">-${discountTotal}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 0 0;font-weight:700;color:#0f172a">Total</td>
                <td style="padding:10px 0 0 0;text-align:right;font-weight:700;color:#0f172a">${total}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
            <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:11px 16px;background:#0959a4;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
              View Order
            </a>
            <a href="${escapeHtml(continueShoppingUrl)}" style="display:inline-block;padding:11px 16px;background:#e2e8f0;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:600">
              Continue Shopping
            </a>
          </div>

          <p style="margin:18px 0 0 0;color:#64748b;font-size:12px">If you need help, reply to this email and our support team will assist you.</p>
        </div>
      </div>
    </div>
  `;
};

export const sendOrderConfirmationEmail = async (orderData = {}) => {
  const toEmail =
    String(orderData.customerEmail || "").trim() ||
    String(orderData.userId?.email || "").trim() ||
    String(orderData.shippingAddress?.email || "").trim();

  if (!toEmail) {
    const error = new Error("Order confirmation recipient email is missing");
    error.statusCode = 400;
    throw error;
  }

  const customerName =
    String(orderData.customerName || "").trim() ||
    String(orderData.userId?.name || "").trim() ||
    String(orderData.shippingAddress?.fullName || "").trim() ||
    "Customer";

  const orderId = String(orderData.id || orderData._id || "").trim();

  // eslint-disable-next-line no-console
  console.log(
    "[ORDER_CONFIRMATION_EMAIL]",
    JSON.stringify({
      event: "send_attempt",
      orderId,
      toEmail,
      timestamp: new Date().toISOString(),
    })
  );

  const response = await sendBrevoTransactionalEmail({
    toEmail,
    toName: customerName,
    subject: `Order Confirmation #${orderId}`,
    htmlContent: buildOrderConfirmationEmailHtml(orderData),
    tag: "order_confirmation",
    logContext: "order_confirmation",
  });

  // eslint-disable-next-line no-console
  console.log(
    "[ORDER_CONFIRMATION_EMAIL]",
    JSON.stringify({
      event: "send_success",
      orderId,
      toEmail,
      response,
      timestamp: new Date().toISOString(),
    })
  );

  return response;
};
