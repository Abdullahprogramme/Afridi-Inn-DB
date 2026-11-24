import React from 'react';
import {
  Clock,
  UtensilsCrossed,
  ChefHat,
  CheckCircle2,
  Truck,
  Receipt,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { OrderStatus, TableStatus, PaymentStatus, LineStatus } from '@/types';
import {
  ORDER_STATUS_MAP,
  TABLE_STATUS_MAP,
  PAYMENT_STATUS_MAP,
  LINE_STATUS_MAP,
} from '@/lib/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: OrderStatus | TableStatus | PaymentStatus | LineStatus | string;
  type?: 'order' | 'table' | 'payment' | 'line';
  className?: string;
}

export function StatusBadge({
  status,
  type = 'order',
  className,
}: StatusBadgeProps) {
  let label = String(status);
  let bg = '#F3EEE6';
  let text = '#57534E';
  let border = '#E7E0D6';
  let Icon = HelpCircle;

  if (type === 'order' && status in ORDER_STATUS_MAP) {
    const config = ORDER_STATUS_MAP[status as OrderStatus];
    label = config.label;
    bg = config.bg;
    text = config.text;
    border = config.border || config.bg;

    switch (status as OrderStatus) {
      case 'PLACED':
        Icon = Clock;
        break;
      case 'AT_BUTCHER':
        Icon = UtensilsCrossed;
        break;
      case 'AT_CHEF':
        Icon = ChefHat;
        break;
      case 'READY':
        Icon = CheckCircle2;
        break;
      case 'DISPATCHED':
        Icon = Truck;
        break;
      case 'BILLED':
        Icon = Receipt;
        break;
      case 'COMPLETED':
        Icon = CheckCircle2;
        break;
      case 'CANCELLED':
        Icon = XCircle;
        break;
    }
  } else if (type === 'table' && status in TABLE_STATUS_MAP) {
    const config = TABLE_STATUS_MAP[status as TableStatus];
    label = config.label;
    bg = config.bg;
    text = config.text;
    Icon = status === 'Available' ? CheckCircle2 : Clock;
  } else if (type === 'payment' && status in PAYMENT_STATUS_MAP) {
    const config = PAYMENT_STATUS_MAP[status as PaymentStatus];
    label = config.label;
    bg = config.bg;
    text = config.text;
    Icon = status === 'Paid' ? CheckCircle2 : status === 'Pending' ? Clock : XCircle;
  } else if (type === 'line' && status in LINE_STATUS_MAP) {
    const config = LINE_STATUS_MAP[status as LineStatus];
    label = config.label;
    bg = config.bg;
    text = config.text;
    Icon = status === 'READY' ? CheckCircle2 : Clock;
  }

  return (
    <span
      style={{ backgroundColor: bg, color: text, borderColor: border }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
}
