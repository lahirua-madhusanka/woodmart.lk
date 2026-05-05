import env from "../config/env.js";
import { isSmtpConfigured, sendSmtpEmail } from "../utils/email.js";

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

const isRestApiKey = (key) => String(key || "").trim().startsWith("xkeysib-");

const parseResponsePayload = async (response) => {
  const responseText = await response.text();
  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};

const resolveSender = () => {
  const email = env.brevoSenderEmail || env.smtpFrom || env.smtpUser;
  const name = env.brevoSenderName || env.orderEmailBrandName || "Woodmart.lk";

  if (!email) {
    const error = new Error("Brevo sender email is not configured");
    error.statusCode = 502;
    throw error;
  }

  return { email, name };
};

export const sendBrevoTransactionalEmail = async ({
  toEmail,
  toName,
  subject,
  htmlContent,
  tag = "transactional",
  logContext = "brevo_transactional",
}) => {
  // Use SMTP fallback when the configured key is not a v3 REST key.
  if (!isRestApiKey(env.brevoApiKey)) {
    if (!isSmtpConfigured()) {
      const error = new Error(
        "Email is not configured: provide a Brevo v3 REST API key (xkeysib-...) or SMTP credentials"
      );
      error.statusCode = 502;
      throw error;
    }

    // eslint-disable-next-line no-console
    console.log(
      "[EMAIL_PROVIDER]",
      JSON.stringify({
        event: "smtp_fallback_attempt",
        context: logContext,
        toEmail,
        tag,
        reason: env.brevoApiKey ? "non_rest_key" : "missing_key",
        timestamp: new Date().toISOString(),
      })
    );

    try {
      const result = await sendSmtpEmail({ toEmail, toName, subject, htmlContent });
      // eslint-disable-next-line no-console
      console.log(
        "[EMAIL_PROVIDER]",
        JSON.stringify({
          event: "smtp_fallback_success",
          context: logContext,
          toEmail,
          tag,
          messageId: result?.messageId || null,
          timestamp: new Date().toISOString(),
        })
      );
      return { messageId: result?.messageId || null, transport: "smtp" };
    } catch (smtpError) {
      // eslint-disable-next-line no-console
      console.error(
        "[EMAIL_PROVIDER]",
        JSON.stringify({
          event: "smtp_fallback_failed",
          context: logContext,
          toEmail,
          tag,
          message: smtpError?.message || "Unknown error",
          code: smtpError?.code || null,
          response: smtpError?.response || null,
          timestamp: new Date().toISOString(),
        })
      );
      const error = new Error("Failed to send transactional email via SMTP");
      error.statusCode = 502;
      throw error;
    }
  }

  const sender = resolveSender();

  // eslint-disable-next-line no-console
  console.log(
    "[EMAIL_PROVIDER]",
    JSON.stringify({
      event: "send_attempt",
      context: logContext,
      provider: "brevo_api",
      toEmail,
      tag,
      timestamp: new Date().toISOString(),
    })
  );

  const response = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": env.brevoApiKey,
    },
    body: JSON.stringify({
      sender,
      to: [
        {
          email: String(toEmail || "").trim(),
          name: String(toName || "").trim() || undefined,
        },
      ],
      subject,
      htmlContent,
      tags: [tag],
    }),
  });

  const providerPayload = await parseResponsePayload(response);

  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.error(
      "[EMAIL_PROVIDER]",
      JSON.stringify({
        event: "send_failed",
        context: logContext,
        provider: "brevo_api",
        toEmail,
        tag,
        status: response.status,
        providerPayload,
        timestamp: new Date().toISOString(),
      })
    );

    if (isSmtpConfigured()) {
      try {
        const result = await sendSmtpEmail({ toEmail, toName, subject, htmlContent });
        // eslint-disable-next-line no-console
        console.log(
          "[EMAIL_PROVIDER]",
          JSON.stringify({
            event: "smtp_fallback_success",
            context: logContext,
            toEmail,
            tag,
            messageId: result?.messageId || null,
            timestamp: new Date().toISOString(),
          })
        );
        return { messageId: result?.messageId || null, transport: "smtp" };
      } catch (smtpError) {
        // eslint-disable-next-line no-console
        console.error(
          "[EMAIL_PROVIDER]",
          JSON.stringify({
            event: "smtp_fallback_failed",
            context: logContext,
            toEmail,
            tag,
            message: smtpError?.message || "Unknown error",
            code: smtpError?.code || null,
            timestamp: new Date().toISOString(),
          })
        );
      }
    }

    const error = new Error("Failed to send transactional email");
    error.statusCode = response.status >= 500 ? 502 : response.status;
    error.providerStatus = response.status;
    error.providerPayload = providerPayload;
    throw error;
  }

  // eslint-disable-next-line no-console
  console.log(
    "[EMAIL_PROVIDER]",
    JSON.stringify({
      event: "send_success",
      context: logContext,
      provider: "brevo_api",
      toEmail,
      tag,
      status: response.status,
      providerPayload,
      timestamp: new Date().toISOString(),
    })
  );

  return providerPayload;
};

const buildPasswordResetEmailHtml = ({ name, resetUrl }) => {
  const safeName = String(name || "there");
  const safeUrl = String(resetUrl || "");
  const brandName = env.brevoSenderName || env.orderEmailBrandName || "Woodmart.lk";

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:580px;margin:0 auto;border:1px solid #e2e8f0;border-radius:8px;padding:24px;background:#ffffff">
      <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b">${brandName}</p>
      <h2 style="margin:0 0 10px 0;font-size:22px;color:#0f172a">Reset your password</h2>
      <p style="margin:0 0 12px 0">Hello ${safeName},</p>
      <p style="margin:0 0 18px 0">We received a request to reset your account password. Click the button below to set a new password.</p>
      <p style="margin:0 0 18px 0">
        <a href="${safeUrl}" style="display:inline-block;padding:11px 18px;background:#0959a4;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
          Reset Password
        </a>
      </p>
      <p style="margin:0 0 10px 0;font-size:13px;color:#475569">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 16px 0;font-size:13px;word-break:break-all;color:#0f172a">${safeUrl}</p>
      <p style="margin:0;font-size:12px;color:#64748b">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
};

export const sendPasswordResetEmail = async ({ toEmail, name, resetUrl }) => {
  const htmlContent = buildPasswordResetEmailHtml({ name, resetUrl });

  return sendBrevoTransactionalEmail({
    toEmail,
    toName: name,
    subject: "Reset your password",
    htmlContent,
    tag: "password-reset",
    logContext: "password_reset",
  });
};
