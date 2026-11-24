import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-[#E7E0D6] bg-white">
      <div className="w-12 h-12 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#C2410C] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-[#1C1917]">{title}</h4>
      <p className="mt-1 text-sm text-[#57534E] max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
