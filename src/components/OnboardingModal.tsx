'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shuffle, Star, ChevronRight, X } from 'lucide-react';

const STORAGE_KEY = 'makanjom_onboarded_v1';

const STEPS = [
  {
    emoji: '🎰',
    title: 'Stop overthinking dinner.',
    body: 'Spin the wheel and let Makanjom pick a restaurant for you. Filter by vibe, cuisine, or price.',
    icon: Shuffle,
    accent: 'from-rose-50 to-orange-50',
    iconColor: 'text-[#ff385c]',
    iconBg: 'bg-rose-100',
  },
  {
    emoji: '⭐',
    title: 'Discover hidden gems.',
    body: 'Browse curated restaurants from Local Expert creators who actually eat there. Real reviews, no fluff.',
    icon: Star,
    accent: 'from-amber-50 to-yellow-50',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  {
    emoji: '🏆',
    title: 'Earn points as you eat.',
    body: 'Spin daily, leave reviews, and play food games to level up your foodie rank and unlock badges.',
    icon: Sparkles,
    accent: 'from-emerald-50 to-teal-50',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only show once per browser — check after hydration
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage not available — skip
    }
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[80] bg-neutral-950/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-[90] overflow-hidden rounded-t-[2.5rem] bg-white shadow-2xl"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-neutral-200" />
            </div>

            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
            >
              <X size={14} />
            </button>

            <div className={`mx-4 mt-2 rounded-[2rem] bg-gradient-to-br ${current.accent} p-6`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-col items-center text-center gap-4"
                >
                  <span className="text-5xl">{current.emoji}</span>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${current.iconBg}`}>
                    <Icon className={`h-6 w-6 ${current.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-neutral-950">
                    {current.title}
                  </h2>
                  <p className="text-sm font-medium leading-relaxed text-neutral-600 max-w-xs">
                    {current.body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step dots */}
            <div className="flex justify-center gap-1.5 mt-5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'w-6 bg-[#ff385c]' : 'w-1.5 bg-neutral-200'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col gap-3 px-4">
              <button
                onClick={next}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#ff385c] py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#ff385c]/20 active:scale-[0.98]"
              >
                {isLast ? (
                  <><Sparkles size={16} /> Start exploring</>
                ) : (
                  <>Next <ChevronRight size={16} /></>
                )}
              </button>
              {!isLast && (
                <button
                  onClick={dismiss}
                  className="py-2 text-xs font-bold text-neutral-400 hover:text-neutral-600"
                >
                  Skip intro
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
