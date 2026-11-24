'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { StaffSidebar } from '@/components/layout/StaffSidebar';
import { MobileTabBar } from '@/components/layout/MobileTabBar';

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/staff/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-[#FAF7F2]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7F2]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <StaffSidebar currentRole="MANAGER" userName="Tariq Mehmood" branchCode="KHI1" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />
    </div>
  );
}
