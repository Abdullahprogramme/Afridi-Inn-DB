/**
 * Utility functions for styling, formatting, and validation.
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Validates Pakistani mobile numbers (e.g. 03001234567 or +923001234567)
 */
export function isValidPakistaniPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^((\+92)|(0092)|(92)|(0))?3[0-9]{9}$/.test(cleaned);
}

/**
 * Validates 13-digit Pakistani Computerized National Identity Card (CNIC)
 */
export function isValidCNIC(nic: string): boolean {
  const cleaned = nic.replace(/[\s-]/g, '');
  return /^[0-9]{13}$/.test(cleaned);
}

/**
 * Formats a Date or timestamp string into a friendly localized display.
 */
export function formatOrderTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-PK', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Validates table numbers: must be positive and not a multiple of 10.
 */
export function isValidTableNumber(num: number): boolean {
  return num > 0 && num % 10 !== 0;
}
