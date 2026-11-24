'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onChange,
  className,
}: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.id);
  const active = controlledActiveTab !== undefined ? controlledActiveTab : internalTab;

  const handleSelect = (id: string) => {
    if (controlledActiveTab === undefined) {
      setInternalTab(id);
    }
    onChange?.(id);
  };

  return (
    <div
      className={cn(
        'flex border-b border-[#E7E0D6] space-x-4 overflow-x-auto',
        className
      )}
    >
      {tabs.map((tab) => {
        const isSelected = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            className={cn(
              'pb-3 pt-2 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2',
              isSelected
                ? 'border-[#C2410C] text-[#C2410C]'
                : 'border-transparent text-[#57534E] hover:text-[#1C1917] hover:border-[#D6CEC2]'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs',
                  isSelected
                    ? 'bg-[#FFEDD5] text-[#9A3412]'
                    : 'bg-[#F3EEE6] text-[#78716C]'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
