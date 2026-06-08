import { z } from 'zod';

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const registerSchema = z.object({
  email: z.string().email().toLowerCase().max(255),
  password,
  displayName: z.string().min(1).max(80).optional(),
  captchaToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().max(255),
  password: z.string().min(1).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10).max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase().max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
