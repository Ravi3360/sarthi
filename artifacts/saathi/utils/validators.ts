import { z } from 'zod';

export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'सही 10 अंकों का मोबाइल नंबर डालें');

export const otpSchema = z.string().regex(/^\d{6}$/, '6 अंकों का OTP डालें');

export const aadhaarSchema = z
  .string()
  .regex(/^\d{12}$/, 'सही 12 अंकों का आधार नंबर डालें');

export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'सही पैन नंबर डालें (जैसे ABCDE1234F)');

export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'सही IFSC कोड डालें');

export function isValidMobile(value: string): boolean {
  return mobileSchema.safeParse(value).success;
}

export function isValidOtp(value: string): boolean {
  return otpSchema.safeParse(value).success;
}

export function isValidAadhaar(value: string): boolean {
  return aadhaarSchema.safeParse(value).success;
}

export function isValidPan(value: string): boolean {
  return panSchema.safeParse(value.toUpperCase()).success;
}

export function isValidIfsc(value: string): boolean {
  return ifscSchema.safeParse(value.toUpperCase()).success;
}
