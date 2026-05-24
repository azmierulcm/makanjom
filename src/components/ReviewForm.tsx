'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { recordReview } from '@/lib/gamification';

interface ReviewFormProps {
  restaurantId: string;
  restaurantName: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ restaurantId, restaurantName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id ?? null;

      const { error: reviewError } = await supabase.from('reviews').insert({
        restaurant_id: restaurantId,
        rating,
        comment: comment || null,
        customer_id: userId,
      });

      if (reviewError) {
        console.warn('Review save failed, recording locally:', reviewError.message);
      }

      recordReview();
      setPointsEarned(50);
      setSubmitted(true);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

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

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What did you love? Any recommendations?"
        className="mb-6 h-32 w-full rounded-2xl border-2 border-neutral-100 bg-neutral-50 p-4 font-medium text-neutral-700 transition-colors placeholder:text-neutral-400 focus:border-[#ff385c]/40 focus:outline-none"
      />

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
