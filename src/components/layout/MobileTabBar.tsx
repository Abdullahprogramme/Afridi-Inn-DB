'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const pathname = usePathname();

  // Show only on staff pages on mobile
  if (!pathname.startsWith('/staff') || pathname === '/staff/login') {
    return null;
  }

  const navItems = [
    { href: '/staff', label: 'Home', icon: LayoutDashboard },
    { href: '/staff/orders', label: 'Orders', icon: ClipboardList },
    { href: '/staff/orders/new', label: 'New', icon: PlusCircle },
    { href: '/staff/reports', label: 'Reports', icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1C1917] border-t border-stone-800 flex justify-around items-center h-16 px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-full py-1 text-xs',
              isActive ? 'text-[#C2410C] font-bold' : 'text-stone-400'
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
