'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Send, CheckCircle2, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { recordReview } from '@/lib/gamification';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit, formatResetTime } from '@/lib/rateLimit';
import Link from 'next/link';

interface ReviewFormProps {
  restaurantId: string;
  restaurantName: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ restaurantId, restaurantName, onSuccess }: ReviewFormProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const COMMENT_MAX = 1000;

  // Check auth once on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setAuthChecked(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !userId) return;

    // Rate limit: 3 reviews per hour per browser
    const rl = checkRateLimit('review', 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      setFormError(`Too many reviews recently. Try again in ${formatResetTime(rl.resetInMs)}.`);
      return;
    }

    const sanitizedComment = sanitizeText(comment);
    if (sanitizedComment.length > COMMENT_MAX) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const { error: reviewError } = await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        rating,
        comment: sanitizedComment || null,
        customer_id: userId,
      });

      if (reviewError) throw reviewError;

      // Only award local gamification points when the DB insert succeeded.
      // The DB trigger also fires on insert — recordReview() keeps localStorage
      // in sync so the UI updates immediately without waiting for a DB sync.
      recordReview();
      setPointsEarned(50);
      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review. Please try again.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Auth gate — show sign-in prompt for unauthenticated users
  if (authChecked && !userId) {
    return (
      <div className="w-full max-w-lg rounded-3xl border border-neutral-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
          <Star size={24} className="text-neutral-400" />
        </div>
        <h3 className="mb-2 text-xl font-black text-neutral-900">Sign in to leave a review</h3>
        <p className="mb-6 text-sm font-medium text-neutral-500">
          Help the community discover great food at <span className="text-neutral-700">{restaurantName}</span>.
          Sign in to share your experience and earn points.
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '')}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#ff385c] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#ff385c]/20 hover:bg-[#e93252]"
        >
          <LogIn size={16} /> Sign in to review
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border-2 border-green-100 bg-green-50 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-200">
          <CheckCircle2 className="text-white" size={32} />
        </div>
        <h3 className="mb-2 text-2xl font-black text-green-900">Review Shared!</h3>
        <p className="mb-2 font-medium text-green-700">Thanks for helping the community discover great food.</p>
        <p className="text-sm font-bold text-green-600">+{pointsEarned} points earned</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-neutral-100 bg-white p-8 shadow-xl">
      <h3 className="mb-1 text-2xl font-black text-neutral-900">Rate your experience</h3>
      <p className="mb-6 font-medium text-neutral-500">
        How was your meal at <span className="text-neutral-900">{restaurantName}</span>?
      </p>

      <div className="mb-8 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform active:scale-90"
          >
            <Star
              size={40}
              className={`transition-colors ${
                star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-200'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="mb-6">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="What did you love? Any recommendations?"
          className="h-32 w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 font-medium text-neutral-700 transition-colors placeholder:text-neutral-400 focus:border-[#ff385c]/40 focus:outline-none"
        />
        <p className={`mt-1 text-right text-xs font-medium ${comment.length > 900 ? 'text-orange-500' : 'text-neutral-400'}`}>
          {comment.length}/1000
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">
          {formError}
        </div>
      )}

      <button
        type="submit"
        disabled={rating === 0 || submitting}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-lg font-black transition-all ${
          rating === 0 || submitting
            ? 'cursor-not-allowed bg-neutral-100 text-neutral-400'
            : 'bg-neutral-900 text-white shadow-lg shadow-neutral-200 hover:bg-black'
        }`}
      >
        {submitting ? 'Submitting...' : (
          <>
            Post Review <Send size={20} />
          </>
        )}
      </button>
    </form>
  );
}
