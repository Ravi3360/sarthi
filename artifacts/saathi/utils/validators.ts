import { z } from 'zod';

export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'सही 10 अंकों का मोबाइल नंबर डालें');

export const otpSchema = z.string().regex(/^\d{6}$/, '6 अंकों का OTP डालें');

export const ifscSchema = z
  .string()
  .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'सही IFSC कोड डालें');

export function isValidMobile(value: string): boolean {
  return mobileSchema.safeParse(value).success;
}

export function isValidOtp(value: string): boolean {
  return otpSchema.safeParse(value).success;
}

export function isValidIfsc(value: string): boolean {
  return ifscSchema.safeParse(value.toUpperCase()).success;
}
