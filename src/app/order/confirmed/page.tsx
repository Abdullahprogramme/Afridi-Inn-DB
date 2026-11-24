'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Copy, Check, ArrowRight, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/constants';

function OrderConfirmedContent() {
  const searchParams = useSearchParams();
  const billNumber = searchParams.get('bill') || 'KHI1-20261124-0042';
  const trackingToken = searchParams.get('token') || '4a7b9c1d2e3f4567890abcdef1234567';
  const total = searchParams.get('total') || '3600';

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <Card className="text-center p-8 space-y-6 shadow-md border-[#E7E0D6]">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
            Order Confirmed!
          </h1>
          <p className="mt-2 text-sm text-[#57534E]">
            Your order has been sent to the Afridi Inn branch cashier for confirmation.
          </p>
        </div>

        {/* Bill & Token Box */}
        <div className="bg-[#FAF7F2] border border-[#E7E0D6] rounded-lg p-5 space-y-4 text-left">
          <div>
            <span className="text-xs font-semibold text-[#57534E] uppercase tracking-wider block">
              Bill Number
            </span>
            <span className="text-lg font-mono font-bold text-[#1C1917]">
              {billNumber}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-[#57534E] uppercase tracking-wider block">
              Live Tracking Token
            </span>
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xs sm:text-sm font-mono font-bold text-[#C2410C] break-all">
                {trackingToken}
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1.5 rounded bg-white border border-[#E7E0D6] text-xs font-semibold text-stone-700 hover:bg-stone-50 shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Save this token to track your order status live or submit feedback when delivered.
            </p>
          </div>

          <div className="pt-3 border-t border-[#E7E0D6] flex justify-between items-center text-sm">
            <span className="font-semibold text-stone-700">Total Amount:</span>
            <span className="font-mono font-bold text-base text-[#1C1917]">
              {formatMoney(total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <Link href={`/track/${trackingToken}`}>
            <Button size="lg" className="w-full">
              Track Order Live <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/menu">
            <Button variant="ghost" size="sm" className="w-full text-stone-500">
              Return to Menu
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function OrderConfirmedPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-stone-500">Loading order confirmation...</div>}>
      <OrderConfirmedContent />
    </Suspense>
  );
}
