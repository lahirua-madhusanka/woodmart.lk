import env from "../config/env.js";

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

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
  if (!env.brevoApiKey) {
    const error = new Error("Brevo API key is not configured");
    error.statusCode = 502;
    throw error;
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
