/** Masks sensitive numbers for on-screen display. Never log unmasked values. */

export function maskAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  return `XXXXXXXX${digits.slice(-4)}`;
}
