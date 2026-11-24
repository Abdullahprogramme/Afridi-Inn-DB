import React from 'react';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SimulatedPaymentBadge({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]',
        className
      )}
    >
      <CreditCard className="w-3.5 h-3.5" />
      <span>SIMULATED PAYMENT</span>
    </span>
  );
}
