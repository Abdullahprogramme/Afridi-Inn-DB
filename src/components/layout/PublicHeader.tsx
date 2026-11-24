'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Utensils, Menu, X, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If on a staff page, the public header is not rendered
  if (pathname.startsWith('/staff')) {
    return null;
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
    { href: '/order', label: 'Order Online' },
    { href: '/track', label: 'Track Order' },
  ];

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-white border-b border-[#E7E0D6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 text-[#C2410C] font-bold text-xl tracking-tight">
          <div className="w-9 h-9 rounded-md bg-[#C2410C] text-white flex items-center justify-center">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-[#1C1917] font-extrabold">Afridi Inn</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-semibold transition-colors duration-150',
                  isActive
                    ? 'text-[#C2410C]'
                    : 'text-[#57534E] hover:text-[#C2410C]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/staff/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#57534E] border border-[#E7E0D6] rounded-md hover:bg-[#F3EEE6] transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Staff Portal</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#57534E] hover:text-[#1C1917]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E7E0D6] bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block py-2 text-base font-semibold',
                pathname === link.href ? 'text-[#C2410C]' : 'text-[#57534E]'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#E7E0D6]">
            <Link
              href="/staff/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-medium text-[#78716C]"
            >
              <ShieldAlert className="w-4 h-4" />
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
