import nodemailer from "nodemailer";
import env from "../config/env.js";

let transporter = null;

const hasSmtpConfig = () =>
  Boolean(env.smtpHost && env.smtpPort && env.smtpUser && env.smtpPass);

const getTransporter = () => {
  if (transporter) return transporter;
  if (!hasSmtpConfig()) return null;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
};

export const sendVerificationEmail = async ({ toEmail, name, verificationUrl }) => {
  const mailer = getTransporter();

  if (!mailer) {
    // Development fallback when SMTP isn't configured.
    // eslint-disable-next-line no-console
    console.log(`[EMAIL_VERIFICATION_LINK] ${toEmail}: ${verificationUrl}`);
    return;
  }

  await mailer.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to: toEmail,
    subject: "Verify your Woodmart.lk account",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin-bottom:8px">Verify your email</h2>
        <p>Hello ${name || "there"},</p>
        <p>Thanks for signing up. Please verify your email to activate your account.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:10px 16px;background:#0959a4;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">
            Verify Email
          </a>
        </p>
        <p style="font-size:12px;color:#64748b">This link expires in 24 hours.</p>
      </div>
    `,
  });
};
