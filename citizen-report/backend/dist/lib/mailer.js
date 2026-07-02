"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendOtpEmail = sendOtpEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
/**
 * Email delivery. If SMTP is not configured (dev), links are logged to stdout
 * instead of being sent, so the flow still works locally.
 */
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("./logger");
const transporter = env_1.env.SMTP_HOST.length > 0
    ? nodemailer_1.default.createTransport({
        host: env_1.env.SMTP_HOST,
        port: env_1.env.SMTP_PORT,
        secure: env_1.env.SMTP_PORT === 465,
        auth: env_1.env.SMTP_USER ? { user: env_1.env.SMTP_USER, pass: env_1.env.SMTP_PASS } : undefined,
    })
    : null;
async function send(to, subject, html, text) {
    if (!transporter) {
        logger_1.logger.info({ to, subject, text }, '[dev mailer] email not sent (SMTP unconfigured)');
        return;
    }
    await transporter.sendMail({ from: env_1.env.SMTP_FROM, to, subject, html, text });
}
async function sendVerificationEmail(to, token) {
    const url = `${env_1.env.APP_BASE_URL}/verify-email?token=${encodeURIComponent(token)}`;
    await send(to, 'Verify your Citizen Report email', `<p>Welcome to Citizen Report.</p><p>Please verify your email by clicking the link below:</p>
     <p><a href="${url}">Verify my email</a></p>
     <p>This link expires in 24 hours. If you did not create an account, ignore this email.</p>`, `Verify your email: ${url}`);
}
async function sendOtpEmail(to, code) {
    await send(to, 'Your Citizen Report sign-in code', `<p>Your one-time sign-in code is:</p>
     <p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:12px 0">${code}</p>
     <p>This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>`, `Your Citizen Report sign-in code is ${code}. It expires in 10 minutes.`);
}
async function sendPasswordResetEmail(to, token) {
    const url = `${env_1.env.APP_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await send(to, 'Reset your Citizen Report password', `<p>We received a request to reset your password.</p>
     <p><a href="${url}">Reset password</a></p>
     <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>`, `Reset your password: ${url}`);
}
//# sourceMappingURL=mailer.js.map