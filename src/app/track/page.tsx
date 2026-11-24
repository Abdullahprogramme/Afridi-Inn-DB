'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TrackSearchPage() {
  const router = useRouter();
  const [token, setToken] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    router.push(`/track/${token.trim()}`);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <Card className="p-8 shadow-sm border-[#E7E0D6] space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#FFEDD5] text-[#C2410C] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1C1917]">
            Track Your Order
          </h1>
          <p className="text-sm text-[#57534E]">
            Enter the 32-character tracking code provided upon placing your order.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <Input
            placeholder="Paste your tracking token here..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            className="font-mono text-sm"
          />
          <Button type="submit" size="lg" className="w-full">
            <Search className="w-4 h-4 mr-2" /> Track Order
          </Button>
        </form>

        <div className="bg-[#FAF7F2] p-4 rounded-md border border-[#E7E0D6] text-xs text-stone-600 space-y-1">
          <p className="font-semibold text-stone-800">Demo Tokens to Test:</p>
          <p className="font-mono text-[#C2410C] break-all">
            a1b2c3d4e5f6789012345678abcdef12
          </p>
        </div>
      </Card>
    </div>
  );
}
