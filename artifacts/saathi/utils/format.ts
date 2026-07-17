/** Formats a number using Indian digit grouping, e.g. 123456 -> "1,23,456". */
export function formatIndianNumber(value: number): string {
  const rounded = Math.round(value);
  const isNegative = rounded < 0;
  const digits = Math.abs(rounded).toString();

  if (digits.length <= 3) return (isNegative ? '-' : '') + digits;

  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${isNegative ? '-' : ''}${grouped},${lastThree}`;
}

export function formatCurrency(value: number): string {
  return `₹${formatIndianNumber(value)}`;
}

export function formatDateHi(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const months = [
    'जन',
    'फ़र',
    'मार्च',
    'अप्रैल',
    'मई',
    'जून',
    'जुलाई',
    'अग',
    'सित',
    'अक्तू',
    'नव',
    'दिस',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Duration between two ISO dates in whole years and months (for work history). */
export function durationBetween(
  start: string,
  end: string | null,
): { years: number; months: number } {
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date();
  let months =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());
  if (endDate.getDate() < startDate.getDate()) months--;
  if (months < 0) months = 0;
  return { years: Math.floor(months / 12), months: months % 12 };
}
