import env from "../config/env.js";
import { sendBrevoTransactionalEmail } from "./brevoTransactionalEmailService.js";

const PRONTO_TRACKING_URL = "https://www.prontolanka.lk/";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatStatus = (value) =>
  String(value || "pending")
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const buildOrderShippedEmailHtml = (orderData = {}) => {
  const orderId = String(orderData.id || orderData._id || "N/A").trim();
  const customerName = escapeHtml(orderData.customerName || orderData.userId?.name || "Customer");
  const trackingNumber = escapeHtml(orderData.trackingNumber || "Not available");
  const courierName = escapeHtml(orderData.courierName || "Pronto Lanka");
  const shippedAt = escapeHtml(formatDateTime(orderData.shippedAt || orderData.updatedAt));
  const orderStatus = escapeHtml(formatStatus(orderData.orderStatus || "shipped"));
  const brandName = escapeHtml(env.orderEmailBrandName || "Woodmart.lk");
  const supportEmail = escapeHtml(env.orderEmailSupportEmail || env.brevoSenderEmail || "");
  const orderUrl = `${env.clientUrl}/order-confirmation/${encodeURIComponent(orderId)}`;

  return `
    <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="padding:22px 24px;background:linear-gradient(135deg,#0b66bd,#0959a4);color:#ffffff">
          <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.92">${brandName}</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3">Your order has been shipped</h1>
        </div>

        <div style="padding:24px">
          <p style="margin:0 0 10px 0">Hi ${customerName},</p>
          <p style="margin:0 0 16px 0;color:#334155">Your order has been shipped. You can use the tracking number below to track your package.</p>

          <div style="margin:0 0 18px 0;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
            <div style="margin-bottom:6px"><strong>Order ID:</strong> ${escapeHtml(orderId)}</div>
            <div style="margin-bottom:6px"><strong>Status:</strong> ${orderStatus}</div>
            <div style="margin-bottom:6px"><strong>Shipped Date:</strong> ${shippedAt}</div>
            <div><strong>Courier:</strong> ${courierName}</div>
          </div>

          <div style="margin:0 0 18px 0;padding:14px;border:2px dashed #93c5fd;border-radius:10px;background:#eff6ff;text-align:center">
            <div style="margin:0 0 6px 0;font-size:12px;color:#475569;letter-spacing:0.08em;text-transform:uppercase">Tracking Number</div>
            <div style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#0b66bd;word-break:break-word">${trackingNumber}</div>
            <p style="margin:8px 0 0 0;font-size:12px;color:#64748b">Tip: Tap and hold the tracking number to copy it if your email app does not support copy buttons.</p>
          </div>

          <div style="margin-top:8px;display:flex;gap:10px;flex-wrap:wrap">
            <a href="${PRONTO_TRACKING_URL}" style="display:inline-block;padding:11px 16px;background:#0959a4;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
              Track Order
            </a>
            <a href="${escapeHtml(orderUrl)}" style="display:inline-block;padding:11px 16px;background:#e2e8f0;color:#0f172a;text-decoration:none;border-radius:8px;font-weight:600">
              Copy Tracking Number
            </a>
          </div>

          <p style="margin:16px 0 0 0;color:#64748b;font-size:12px">The Copy Tracking Number button opens your order page where a full copy button is available.</p>
          ${supportEmail ? `<p style="margin:10px 0 0 0;color:#64748b;font-size:12px">Need help? Contact us at ${supportEmail}.</p>` : ""}
        </div>
      </div>
    </div>
  `;
};

export const sendOrderShippedEmail = async (orderData = {}) => {
  const orderId = String(orderData.id || orderData._id || "").trim();
  const toEmail =
    String(orderData.customerEmail || "").trim() ||
    String(orderData.userId?.email || "").trim() ||
    String(orderData.shippingAddress?.email || "").trim();

  if (!toEmail) {
    const error = new Error("Order shipped email recipient is missing");
    error.statusCode = 400;
    throw error;
  }

  if (!String(orderData.trackingNumber || "").trim()) {
    const error = new Error("Tracking number is required for shipped email");
    error.statusCode = 400;
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log(
    "[ORDER_SHIPPED_EMAIL]",
    JSON.stringify({
      event: "send_attempt",
      orderId,
      toEmail,
      trackingNumber: String(orderData.trackingNumber || ""),
      courierName: String(orderData.courierName || ""),
      timestamp: new Date().toISOString(),
    })
  );

  const response = await sendBrevoTransactionalEmail({
    toEmail,
    toName: String(orderData.customerName || orderData.userId?.name || "Customer").trim(),
    subject: `Shipping Update for Order #${orderId}`,
    htmlContent: buildOrderShippedEmailHtml(orderData),
    tag: "order_shipped",
    logContext: "order_shipped",
  });

  // eslint-disable-next-line no-console
  console.log(
    "[ORDER_SHIPPED_EMAIL]",
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
