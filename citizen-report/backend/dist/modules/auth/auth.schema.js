"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpVerifySchema = exports.otpRequestSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyEmailSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const password = zod_1.z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128)
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number');
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().max(255),
    password,
    displayName: zod_1.z.string().min(1).max(80).optional(),
    captchaToken: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().max(255),
    password: zod_1.z.string().min(1).max(128),
});
exports.verifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(10).max(200),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().max(255),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(10).max(200),
    password,
});
exports.otpRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().max(255),
});
exports.otpVerifySchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().max(255),
    code: zod_1.z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});
//# sourceMappingURL=auth.schema.js.map