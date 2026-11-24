'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Utensils,
  Truck,
  Receipt,
  AlertTriangle,
  Star,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { OrderTrackingInfo, OrderStatus } from '@/types';
import { apiClient } from '@/lib/api-client';
import { formatMoney } from '@/lib/constants';
import { formatOrderTime } from '@/lib/utils';

export default function TrackLivePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [order, setOrder] = useState<OrderTrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTracking = async () => {
    try {
      const data = await apiClient.getOrderByTrackingToken(token);
      setOrder(data);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000); // 10s auto-refresh per spec
    return () => clearInterval(interval);
  }, [token]);

  // Stepper definitions
  const steps: { key: string; label: string; icon: React.ElementType }[] = [
    { key: 'RECEIVED', label: 'Received', icon: Clock },
    { key: 'PREPARING', label: 'Preparing', icon: Utensils },
    { key: 'READY', label: 'Ready', icon: CheckCircle2 },
    { key: 'ON_THE_WAY', label: 'On The Way', icon: Truck },
    { key: 'BILLED', label: 'Billed', icon: Receipt },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2 },
  ];

  const getStepIndex = (status?: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return 0;
      case 'AT_BUTCHER':
      case 'AT_CHEF':
        return 1;
      case 'READY':
        return 2;
      case 'DISPATCHED':
        return 3;
      case 'BILLED':
        return 4;
      case 'COMPLETED':
        return 5;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order?.order_status);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-stone-500">
        Loading live order tracking...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-800">Order Not Found</h2>
        <p className="text-sm text-stone-500">
          We could not find an active order matching token: <span className="font-mono">{token}</span>
        </p>
        <Link href="/track">
          <Button variant="secondary" size="sm">Try another code</Button>
        </Link>
      </div>
    );
  }

  const isCancelled = order.order_status === 'CANCELLED';
  const isCompleted = order.order_status === 'COMPLETED';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Top Header Card */}
      <Card className="p-6 border-[#E7E0D6]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E0D6]">
          <div>
            <span className="text-xs font-semibold text-[#57534E] uppercase tracking-wider">
              Live Order Status
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-xl font-bold font-mono text-[#1C1917]">
                {order.bill_number}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 font-semibold text-stone-700">
                {order.order_channel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={order.order_status} type="order" />
            <button
              onClick={() => {
                setIsRefreshing(true);
                fetchTracking();
              }}
              title="Refresh status"
              className="p-2 rounded-md hover:bg-stone-100 text-stone-500"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Cancellation Notice Banner */}
        {isCancelled && (
          <div className="mt-4 p-4 rounded-lg bg-[#FEE2E2] border border-[#FECACA] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-[#B91C1C]">Order Cancelled</p>
              <p className="text-xs text-[#B91C1C] mt-0.5">
                Reason: {order.cancellation_reason || 'Cancelled by branch manager'}
              </p>
            </div>
          </div>
        )}

        {/* Horizontal Status Stepper */}
        {!isCancelled && (
          <div className="pt-8 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStep > idx;
                const isCurrent = currentStep === idx;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 border transition-colors ${
                        isPassed
                          ? 'bg-[#15803D] text-white border-[#15803D]'
                          : isCurrent
                          ? 'bg-[#C2410C] text-white border-[#C2410C] ring-4 ring-[#FFEDD5]'
                          : 'bg-white text-stone-400 border-[#D6CEC2]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? 'text-[#C2410C]'
                          : isPassed
                          ? 'text-[#15803D]'
                          : 'text-[#78716C]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#E7E0D6] flex justify-between text-xs text-stone-500">
          <span>Placed: {formatOrderTime(order.created_at)}</span>
          <span>Auto-refreshes every 10 seconds</span>
        </div>
      </Card>

      {/* Completed Rating Banner */}
      {isCompleted && (
        <Card className="p-6 bg-[#FFEDD5]/30 border-[#FED7AA] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#1C1917]">
                How was your meal?
              </h3>
              <p className="text-xs text-[#57534E]">
                Rate your dining experience to help us maintain authentic quality.
              </p>
            </div>
          </div>
          <Link href={`/feedback/${token}`}>
            <Button size="sm">Rate Your Order</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
