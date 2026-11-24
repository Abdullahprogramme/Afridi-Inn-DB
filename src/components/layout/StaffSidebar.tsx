'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  UtensilsCrossed,
  ChefHat,
  Truck,
  Armchair,
  Receipt,
  BarChart3,
  BookOpen,
  Layers,
  Users,
  Store,
  LogOut,
} from 'lucide-react';
import { EmployeeRole } from '@/types';
import { ROLE_MAP } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function StaffSidebar({
  currentRole = 'MANAGER',
  userName = 'Tariq Mehmood',
  branchCode = 'KHI1',
}: {
  currentRole?: EmployeeRole;
  userName?: string;
  branchCode?: string;
}) {
  const pathname = usePathname();

  const allNavItems = [
    {
      href: '/staff',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['OWNER', 'MANAGER', 'FB_MANAGER', 'GRO', 'CASHIER'],
    },
    {
      href: '/staff/orders',
      label: 'Orders List',
      icon: ClipboardList,
      roles: ['OWNER', 'MANAGER', 'FB_MANAGER', 'CASHIER', 'GRO'],
    },
    {
      href: '/staff/orders/new',
      label: 'New Dine-In Order',
      icon: PlusCircle,
      roles: ['OWNER', 'MANAGER', 'ORDER_TAKER', 'WAITER', 'CASHIER'],
    },
    {
      href: '/staff/butcher',
      label: 'Butcher Queue',
      icon: UtensilsCrossed,
      roles: ['OWNER', 'MANAGER', 'BUTCHER', 'FB_MANAGER'],
    },
    {
      href: '/staff/kitchen',
      label: 'Kitchen Queue',
      icon: ChefHat,
      roles: ['OWNER', 'MANAGER', 'CHEF', 'FB_MANAGER'],
    },
    {
      href: '/staff/dispatch',
      label: 'Dispatch Queue',
      icon: Truck,
      roles: ['OWNER', 'MANAGER', 'DISPATCH', 'FB_MANAGER'],
    },
    {
      href: '/staff/tables',
      label: 'Table Management',
      icon: Armchair,
      roles: ['OWNER', 'MANAGER', 'GRO', 'FB_MANAGER'],
    },
    {
      href: '/staff/reports',
      label: 'Sales & Reports',
      icon: BarChart3,
      roles: ['OWNER', 'MANAGER'],
    },
    {
      href: '/staff/menu',
      label: 'Menu Admin',
      icon: BookOpen,
      roles: ['OWNER'],
    },
    {
      href: '/staff/add-ons',
      label: 'Add-Ons Admin',
      icon: Layers,
      roles: ['OWNER'],
    },
    {
      href: '/staff/employees',
      label: 'Staff Roster',
      icon: Users,
      roles: ['OWNER'],
    },
    {
      href: '/staff/branches',
      label: 'Branches Admin',
      icon: Store,
      roles: ['OWNER'],
    },
  ];

  const visibleItems = allNavItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <aside className="w-64 bg-[#1C1917] text-[#D6CEC2] flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-stone-800">
        <div>
          <span className="font-extrabold text-white text-lg tracking-tight">
            Afridi Inn
          </span>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-stone-800 text-[#C2410C] font-mono">
            {branchCode}
          </span>
        </div>
      </div>

      {/* User profile strip */}
      <div className="px-6 py-4 border-b border-stone-800/80">
        <p className="text-sm font-semibold text-white truncate">{userName}</p>
        <p className="text-xs text-[#C2410C] font-medium">
          {ROLE_MAP[currentRole]?.title || currentRole}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-[#292524] text-white font-semibold'
                  : 'text-[#D6CEC2] hover:bg-[#292524] hover:text-white'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#C2410C] rounded-r" />
              )}
              <Icon className={cn('w-4 h-4', isActive ? 'text-[#C2410C]' : 'text-stone-400')} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-stone-800">
        <Link
          href="/staff/login"
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-stone-400 hover:text-rose-400 rounded-md hover:bg-stone-900 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
