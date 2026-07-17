/** Masks sensitive numbers for on-screen display. Never log unmasked values. */

export function maskAadhaar(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 12) return value;
  return `XXXX XXXX ${digits.slice(8)}`;
}

export function maskPan(value: string): string {
  const v = value.toUpperCase();
  if (v.length !== 10) return value;
  return `${v.slice(0, 2)}XXXXX${v.slice(7)}`;
}

export function maskAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `XXXXXXXX${digits.slice(-4)}`;
}
