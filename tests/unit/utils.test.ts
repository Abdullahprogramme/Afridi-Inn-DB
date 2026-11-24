import { describe, it, expect } from 'vitest';
import { formatMoney, ORDER_STATUS_MAP, TABLE_STATUS_MAP } from '@/lib/constants';
import {
  isValidPakistaniPhone,
  isValidCNIC,
  isValidTableNumber,
} from '@/lib/utils';

describe('formatMoney utility', () => {
  it('formats whole numbers to PKR currency format', () => {
    expect(formatMoney(1250)).toBe('PKR 1,250');
    expect(formatMoney(3400)).toBe('PKR 3,400');
    expect(formatMoney(0)).toBe('PKR 0');
  });

  it('handles string numbers properly', () => {
    expect(formatMoney('850')).toBe('PKR 850');
  });
});

describe('Validation utilities', () => {
  it('validates Pakistani phone numbers correctly', () => {
    expect(isValidPakistaniPhone('03001234567')).toBe(true);
    expect(isValidPakistaniPhone('+923001234567')).toBe(true);
    expect(isValidPakistaniPhone('0312-3456789')).toBe(true);
    expect(isValidPakistaniPhone('12345')).toBe(false);
    expect(isValidPakistaniPhone('02138104700')).toBe(false); // Landline
  });

  it('validates CNIC numbers correctly', () => {
    expect(isValidCNIC('4210112345671')).toBe(true);
    expect(isValidCNIC('42101-1234567-1')).toBe(true);
    expect(isValidCNIC('42101123456')).toBe(false); // 11 digits
    expect(isValidCNIC('42101ABC45671')).toBe(false); // contains letters
  });

  it('validates table numbers (never multiples of 10)', () => {
    expect(isValidTableNumber(1)).toBe(true);
    expect(isValidTableNumber(5)).toBe(true);
    expect(isValidTableNumber(11)).toBe(true);
    expect(isValidTableNumber(10)).toBe(false); // multiple of 10
    expect(isValidTableNumber(20)).toBe(false); // multiple of 10
    expect(isValidTableNumber(0)).toBe(false);  // must be positive
    expect(isValidTableNumber(-5)).toBe(false); // must be positive
  });
});

describe('Status Maps integrity', () => {
  it('has valid labels for all statuses', () => {
    expect(ORDER_STATUS_MAP.PLACED.label).toBe('Placed');
    expect(ORDER_STATUS_MAP.AT_BUTCHER.label).toBe('At Butcher');
    expect(ORDER_STATUS_MAP.COMPLETED.label).toBe('Completed');
    expect(TABLE_STATUS_MAP.Available.label).toBe('Available');
  });
});
