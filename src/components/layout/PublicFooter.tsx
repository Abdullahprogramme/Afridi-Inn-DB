'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MapPin, Phone } from 'lucide-react';
import { mockBranches } from '@/lib/mocks';

export function PublicFooter() {
  const pathname = usePathname();

  // If on a staff page, footer is hidden
  if (pathname.startsWith('/staff')) {
    return null;
  }

  return (
    <footer className="bg-[#1C1917] text-[#A8A29E] pt-12 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Afridi Inn</h3>
            <p className="text-sm leading-relaxed text-stone-400">
              Traditional Shinwari, Karahi, and Charcoal BBQ cooked fresh to order.
              Experience authentic taste crafted with time-honoured heritage.
            </p>
          </div>

          {/* Locations */}
          <div className="md:col-span-2">
            <h4 className="text-white font-semibold text-sm mb-3">Our Branches</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockBranches.map((branch) => (
                <div key={branch.branch_id} className="text-xs space-y-1">
                  <p className="font-semibold text-white">{branch.branch_name}</p>
                  <p className="flex items-center gap-1.5 text-stone-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#C2410C]" />
                    {branch.address}
                  </p>
                  <p className="flex items-center gap-1.5 text-stone-400">
                    <Phone className="w-3.5 h-3.5 shrink-0 text-[#C2410C]" />
                    {branch.phone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-800 text-xs flex flex-col sm:flex-row items-center justify-between text-stone-500 gap-2">
          <p>© {new Date().getFullYear()} Afridi Inn. All rights reserved.</p>
          <p>CS 341 Database Systems Project — IBA Karachi</p>
        </div>
      </div>
    </footer>
  );
}
