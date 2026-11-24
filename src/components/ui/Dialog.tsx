'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 transition-opacity backdrop-blur-xs"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Body */}
      <div className="relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl border border-[#E7E0D6]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1C1917]">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-[#57534E]">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
