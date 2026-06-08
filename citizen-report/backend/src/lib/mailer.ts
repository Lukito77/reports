/**
 * Email delivery. If SMTP is not configured (dev), links are logged to stdout
 * instead of being sent, so the flow still works locally.
 */
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const transporter =
  env.SMTP_HOST.length > 0
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      })
    : null;

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!transporter) {
    logger.info({ to, subject, text }, '[dev mailer] email not sent (SMTP unconfigured)');
    return;
  }
  await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html, text });
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${env.APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await send(
    to,
    'Verify your Citizen Report email',
    `<p>Welcome to Citizen Report.</p><p>Please verify your email by clicking the link below:</p>
     <p><a href="${url}">Verify my email</a></p>
     <p>This link expires in 24 hours. If you did not create an account, ignore this email.</p>`,
    `Verify your email: ${url}`,
  );
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${env.APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await send(
    to,
    'Reset your Citizen Report password',
    `<p>We received a request to reset your password.</p>
     <p><a href="${url}">Reset password</a></p>
     <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`,
    `Reset your password: ${url}`,
  );
}
