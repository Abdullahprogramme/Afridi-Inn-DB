'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function CustomerFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setSubmitted(true);
      toast.success('Thank you! Your feedback has been received.');
    } catch {
      toast.error('Could not submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Card className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900">Thank You!</h2>
          <p className="text-sm text-stone-600">
            We value your thoughts and appreciate you dining with Afridi Inn.
          </p>
          <div className="pt-2">
            <Link href="/">
              <Button size="sm">Return Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="p-6 space-y-6">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-extrabold text-[#1C1917]">
            Rate Your Dining Experience
          </CardTitle>
          <p className="text-xs text-stone-500 font-mono mt-1">
            Order Ref: {token.substring(0, 16)}...
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating Group */}
          <div className="text-center">
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Overall Rating
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 text-stone-300 hover:text-amber-400 focus:outline-none transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-stone-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-stone-600 mt-2">
              {rating === 5 && 'Outstanding!'}
              {rating === 4 && 'Very Good'}
              {rating === 3 && 'Average'}
              {rating === 2 && 'Disappointing'}
              {rating === 1 && 'Poor'}
            </p>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Comments & Suggestions (Optional, max 500 chars)
            </label>
            <textarea
              maxLength={500}
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us about the meat quality, taste, or service speed..."
              className="w-full rounded-md border border-[#D6CEC2] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
            />
            <span className="text-[11px] text-stone-400 block text-right">
              {comments.length} / 500
            </span>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
            Submit Feedback
          </Button>
        </form>
      </Card>
    </div>
  );
}
