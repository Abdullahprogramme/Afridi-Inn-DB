import { OrderStatus, LineStatus, TableStatus, PaymentStatus, EmployeeRole } from '@/types';

// =============================================================================
// Business Rules & Shared Constants
// =============================================================================

export const DEFAULT_BRANCH_CODE = 'KHI1';
export const APP_NAME = 'Afridi Inn';

/**
 * Currency formatter: always outputs "PKR 1,250"
 */
export function formatMoney(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'PKR 0';
  return `PKR ${Math.round(num).toLocaleString('en-US')}`;
}

/**
 * Status Badge configuration maps
 * Each entry specifies label, background color, text color, and semantic intent.
 */
export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border?: string }
> = {
  PLACED: {
    label: 'Placed',
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
  AT_BUTCHER: {
    label: 'At Butcher',
    bg: '#FEF9C3',
    text: '#A16207',
    border: '#FEF08A',
  },
  AT_CHEF: {
    label: 'At Chef',
    bg: '#FEF9C3',
    text: '#A16207',
    border: '#FEF08A',
  },
  READY: {
    label: 'Ready',
    bg: '#FFEDD5',
    text: '#9A3412',
    border: '#FED7AA',
  },
  DISPATCHED: {
    label: 'Dispatched',
    bg: '#E0F2FE',
    text: '#0369A1',
    border: '#BAE6FD',
  },
  BILLED: {
    label: 'Billed',
    bg: '#FFEDD5',
    text: '#9A3412',
    border: '#FED7AA',
  },
  COMPLETED: {
    label: 'Completed',
    bg: '#DCFCE7',
    text: '#15803D',
    border: '#BBF7D0',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: '#FEE2E2',
    text: '#B91C1C',
    border: '#FECACA',
  },
};

export const LINE_STATUS_MAP: Record<
  LineStatus,
  { label: string; bg: string; text: string }
> = {
  PENDING: { label: 'Pending', bg: '#F3EEE6', text: '#57534E' },
  AT_BUTCHER: { label: 'At Butcher', bg: '#FEF9C3', text: '#A16207' },
  BUTCHER_DONE: { label: 'Butcher Done', bg: '#DCFCE7', text: '#15803D' },
  COOKING: { label: 'Cooking', bg: '#FEF9C3', text: '#A16207' },
  READY: { label: 'Ready', bg: '#DCFCE7', text: '#15803D' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', text: '#B91C1C' },
};

export const TABLE_STATUS_MAP: Record<
  TableStatus,
  { label: string; bg: string; text: string }
> = {
  Available: { label: 'Available', bg: '#DCFCE7', text: '#15803D' },
  Occupied: { label: 'Occupied', bg: '#FEE2E2', text: '#B91C1C' },
  Reserved: { label: 'Reserved', bg: '#FEF9C3', text: '#A16207' },
  Billing: { label: 'Billing', bg: '#FFEDD5', text: '#9A3412' },
};

export const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  Pending: { label: 'Pending', bg: '#FEF9C3', text: '#A16207' },
  Paid: { label: 'Paid', bg: '#DCFCE7', text: '#15803D' },
  Failed: { label: 'Failed', bg: '#FEE2E2', text: '#B91C1C' },
};

export const ROLE_MAP: Record<EmployeeRole, { title: string; defaultPath: string }> = {
  OWNER: { title: 'Owner', defaultPath: '/staff/reports' },
  MANAGER: { title: 'Manager', defaultPath: '/staff/reports' },
  FB_MANAGER: { title: 'F&B Manager', defaultPath: '/staff/orders' },
  GRO: { title: 'Guest Relations Officer', defaultPath: '/staff/tables' },
  ORDER_TAKER: { title: 'Order Taker', defaultPath: '/staff/orders/new' },
  WAITER: { title: 'Waiter', defaultPath: '/staff/orders/new' },
  CASHIER: { title: 'Cashier', defaultPath: '/staff/orders' },
  CHEF: { title: 'Chef', defaultPath: '/staff/kitchen' },
  BUTCHER: { title: 'Butcher', defaultPath: '/staff/butcher' },
  DISPATCH: { title: 'Dispatch', defaultPath: '/staff/dispatch' },
};
