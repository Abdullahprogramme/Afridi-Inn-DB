'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  ClipboardList,
  UtensilsCrossed,
  ChefHat,
  Truck,
  Armchair,
  Receipt,
  BarChart3,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatMoney } from '@/lib/constants';
import { mockOrders } from '@/lib/mocks';
import { formatOrderTime } from '@/lib/utils';

export default function StaffHomePage() {
  const statCards = [
    {
      label: "Today's Orders",
      value: '24',
      icon: ShoppingBag,
      color: 'text-[#C2410C]',
      bg: 'bg-orange-50',
    },
    {
      label: 'Active in Kitchen',
      value: '7',
      icon: Clock,
      color: 'text-[#A16207]',
      bg: 'bg-amber-50',
    },
    {
      label: 'Completed Today',
      value: '16',
      icon: CheckCircle2,
      color: 'text-[#15803D]',
      bg: 'bg-green-50',
    },
    {
      label: 'Simulated Revenue',
      value: formatMoney(48650),
      icon: TrendingUp,
      color: 'text-[#0369A1]',
      bg: 'bg-sky-50',
    },
  ];

  const quickShortcuts = [
    {
      title: 'New Dine-In Order',
      description: 'Take guest order and send straight to kitchen',
      href: '/staff/orders/new',
      icon: PlusCircle,
    },
    {
      title: 'Active Orders',
      description: 'View active tables and online takeaway queue',
      href: '/staff/orders',
      icon: ClipboardList,
    },
    {
      title: 'Butcher Queue',
      description: 'Process meat cuts for Shinwari & BBQ dishes',
      href: '/staff/butcher',
      icon: UtensilsCrossed,
    },
    {
      title: 'Kitchen & Grill',
      description: 'Live grill and handi cooking stations',
      href: '/staff/kitchen',
      icon: ChefHat,
    },
    {
      title: 'Dispatch Station',
      description: 'Hand over ready orders for tables or takeaway',
      href: '/staff/dispatch',
      icon: Truck,
    },
    {
      title: 'Floor Tables',
      description: 'View table seating and capacity status',
      href: '/staff/tables',
      icon: Armchair,
    },
    {
      title: 'Sales & Reports',
      description: 'Daily revenue, dish popularity, and ratings',
      href: '/staff/reports',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917]">
          Manager Workspace
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">
          Overview of live floor activity, kitchen queues, and daily branch performance.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-[#57534E] uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-[#1C1917] mt-1 font-mono">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Workflow Shortcuts Grid */}
      <div>
        <h2 className="text-lg font-bold text-[#1C1917] mb-3">Workflow Stations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickShortcuts.map((s, idx) => {
            const Icon = s.icon;
            return (
              <Link
                key={idx}
                href={s.href}
                className="group p-4 bg-white border border-[#E7E0D6] rounded-lg shadow-sm hover:border-[#C2410C] hover:shadow-md transition-all flex items-start gap-3.5"
              >
                <div className="p-2.5 rounded-md bg-[#FAF7F2] text-[#C2410C] group-hover:bg-[#FFEDD5] transition-colors shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[#1C1917] text-sm group-hover:text-[#C2410C] transition-colors">
                      {s.title}
                    </p>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#C2410C] transition-colors" />
                  </div>
                  <p className="text-xs text-[#57534E] mt-0.5 line-clamp-1">
                    {s.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#E7E0D6] pb-3 mb-3">
          <CardTitle className="text-base font-bold">Recent Branch Orders</CardTitle>
          <Link
            href="/staff/orders"
            className="text-xs font-semibold text-[#C2410C] hover:underline"
          >
            View all orders &rarr;
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F3EEE6] text-[#57534E] text-xs font-semibold uppercase">
                <tr>
                  <th className="px-4 py-2.5">Bill Number</th>
                  <th className="px-4 py-2.5">Channel</th>
                  <th className="px-4 py-2.5">Table / Customer</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E0D6]">
                {mockOrders.map((order) => (
                  <tr key={order.order_id} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-xs text-[#1C1917]">
                      <Link href={`/staff/orders/${order.order_id}`} className="hover:underline text-[#C2410C]">
                        {order.bill_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium text-xs">
                        {order.order_channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#57534E]">
                      {order.order_channel === 'DINE_IN'
                        ? `Table ${order.table_no}`
                        : order.customer_name || 'Online Guest'}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500 font-mono">
                      {formatOrderTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.order_status} type="order" />
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-xs text-[#1C1917]">
                      {formatMoney(order.totals?.grand_total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
