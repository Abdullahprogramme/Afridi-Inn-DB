'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Utensils, Eye, EyeOff, Lock, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function StaffLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('tariq_mgr');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Step F5: Mock until Person 3 passes Step 10
      if (!username || !password) {
        throw new Error('Please enter both username and password.');
      }

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Successfully authenticated
      router.push('/staff');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FAF7F2]">
      <Card className="w-full max-w-md shadow-md border-[#E7E0D6]">
        <CardHeader className="text-center items-center pb-2">
          <div className="w-12 h-12 rounded-lg bg-[#C2410C] text-white flex items-center justify-center mb-2">
            <Utensils className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-[#1C1917]">
            Staff Portal
          </CardTitle>
          <CardDescription className="text-stone-500">
            Sign in with your employee credentials to manage orders and kitchen operations.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#FEE2E2] border border-[#FECACA] text-sm text-[#B91C1C]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. tariq_mgr"
            />

            <div className="relative">
              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to Staff Portal
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-md bg-[#F3EEE6] text-xs text-[#57534E] text-center">
            <p className="font-semibold text-stone-700">Sample Credentials (Demo):</p>
            <p className="mt-0.5">Username: <span className="font-mono">tariq_mgr</span> · Password: <span className="font-mono">password123</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
