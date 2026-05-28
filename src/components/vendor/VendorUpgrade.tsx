'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Crown, Zap, Store,
  MessageCircle, Copy, ArrowLeft, Star,
} from 'lucide-react';
import ImageUpload from '@/components/ImageUpload';
import type { User } from '@supabase/supabase-js';

// ─── Plan definitions ─────────────────────────────────────────────────────────
// TODO: Update prices and features before going live.

interface Plan {
  id: 'free' | 'basic_order' | 'premium';
  name: string;
  price: number;
  period: string;
  badge: string | null;
  icon: React.ReactNode;
  accentBg: string;
  accentText: string;
  borderActive: string;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Starter',
    price: 0,
    period: 'Free forever',
    badge: null,
    icon: <Store size={22} />,
    accentBg: 'bg-neutral-50',
    accentText: 'text-neutral-500',
    borderActive: 'border-neutral-300',
    features: [
      'Listed on Makanjom',
      'Included in spin wheel',
      'Basic restaurant profile',
      'Up to 10 menu items',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'basic_order',
    name: 'Order+',
    price: 99,
    period: '/ month',
    badge: '🚀 Popular',
    icon: <Zap size={22} />,
    accentBg: 'bg-blue-50',
    accentText: 'text-blue-600',
    borderActive: 'border-blue-400',
    features: [
      'Everything in Starter',
      'Online ordering system',
      'Real-time order notifications',
      'Order management dashboard',
      'Unlimited menu items',
      'Menu photo uploads',
    ],
    cta: 'Upgrade to Order+',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    period: '/ month',
    badge: '⭐ Best Value',
    icon: <Crown size={22} />,
    accentBg: 'bg-rose-50',
    accentText: 'text-[#ff385c]',
    borderActive: 'border-[#ff385c]',
    features: [
      'Everything in Order+',
      'Table reservation system',
      'Priority spin wheel listing',
      'Featured restaurant badge',
      'Analytics & performance insights',
      'Dedicated onboarding support',
    ],
    cta: 'Go Premium',
  },
];

// ─── Payment details ─────────────────────────────────────────────────────────
const PAYMENT = {
  bankName: 'CIMB',
  accountName: 'Muhammad Azmierul Bin Che Mat',
  // Add your CIMB account number here if you want to show it for manual transfer
  accountNumber: '',
  whatsapp: '+60173110057',
  // Place your DuitNow QR screenshot at /public/qr-payment.png
  qrImage: '/qr-payment.png',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface VendorUpgradeProps {
  currentTier: 'free' | 'basic_order' | 'premium';
  restaurant: { name: string };
  user: User;
}

export default function VendorUpgrade({ currentTier, restaurant, user }: VendorUpgradeProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [waSent, setWaSent] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const openWhatsApp = () => {
    const lines = [
      `Hai Makanjom! Saya ingin menaik taraf plan restoran saya. 🙏`,
      ``,
      `🏪 *Restoran:* ${restaurant.name}`,
      `📧 *Email:* ${user.email}`,
      `📦 *Plan dipilih:* ${selectedPlan!.name} — RM${selectedPlan!.price}${selectedPlan!.period}`,
      ``,
      screenshotUrl
        ? `🧾 *Bukti bayaran:* ${screenshotUrl}`
        : `🧾 *Bukti bayaran:* (Sila lampirkan screenshot bersama mesej ini)`,
      ``,
      `Sila aktifkan akaun saya. Terima kasih!`,
    ];
    const msg = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${PAYMENT.whatsapp.replace(/\D/g, '')}?text=${msg}`, '_blank');
    setWaSent(true);
  };

  // ── Plan selection screen ──
  if (!selectedPlan) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full mb-4">
            <Crown size={12} className="text-[#ff385c]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ff385c]">Upgrade Your Plan</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-950">
            Unlock your restaurant&apos;s full potential
          </h2>
          <p className="mt-2 text-neutral-500 font-medium">
            Simple, transparent pricing. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PLANS.map((plan) => {
            const isCurrentTier = plan.id === currentTier;
            const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentTier);

            return (
              <motion.div
                key={plan.id}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col rounded-[2.5rem] border-2 bg-white shadow-sm overflow-hidden transition-all
                  ${isCurrentTier
                    ? 'border-neutral-200 opacity-70'
                    : plan.id === 'premium'
                      ? 'border-[#ff385c] shadow-lg shadow-[#ff385c]/10'
                      : 'border-neutral-100 hover:border-neutral-300'
                  }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white rounded-full text-[10px] font-black shadow-sm border border-neutral-100">
                    {plan.badge}
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-black text-neutral-500">
                    Current
                  </div>
                )}

                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  {/* Icon + Name */}
                  <div className={`w-12 h-12 rounded-2xl ${plan.accentBg} ${plan.accentText} flex items-center justify-center mb-4`}>
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-black text-neutral-950">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2 mb-6">
                    <span className="text-4xl font-black text-neutral-950">
                      {plan.price === 0 ? 'Free' : `RM${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm font-medium text-neutral-400">{plan.period}</span>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm font-medium text-neutral-600">
                        <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" strokeWidth={3} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      if (!isCurrentTier && !isDowngrade) setSelectedPlan(plan);
                    }}
                    disabled={isCurrentTier || isDowngrade || plan.price === 0}
                    className={`mt-8 w-full py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all
                      ${isCurrentTier || isDowngrade || plan.price === 0
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : plan.id === 'premium'
                          ? 'bg-[#ff385c] text-white shadow-lg shadow-[#ff385c]/20 hover:bg-[#e93252] active:scale-95'
                          : 'bg-neutral-950 text-white hover:bg-neutral-800 active:scale-95'
                      }`}
                  >
                    {isCurrentTier ? 'Your current plan' : isDowngrade ? 'Contact support to downgrade' : plan.cta}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs font-medium text-neutral-400">
          All plans are billed monthly via manual bank transfer. Prices are in Malaysian Ringgit (MYR).
          <br />Need help? WhatsApp us at{' '}
          <a href={`https://wa.me/${PAYMENT.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="text-[#ff385c] font-bold hover:underline">
            {PAYMENT.whatsapp}
          </a>
        </p>
      </div>
    );
  }

  // ── Checkout screen ──
  return (
    <div className="max-w-lg mx-auto">
      {/* Back */}
      <button
        onClick={() => { setSelectedPlan(null); setScreenshotUrl(''); setWaSent(false); }}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-700 transition-colors mb-8"
      >
        <ArrowLeft size={14} /> Back to plans
      </button>

      <div className="bg-white rounded-[3rem] border border-neutral-100 shadow-sm overflow-hidden">
        {/* Plan summary banner */}
        <div className={`px-8 py-6 ${selectedPlan.id === 'premium' ? 'bg-rose-50' : 'bg-blue-50'} flex items-center justify-between`}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">You&apos;re upgrading to</p>
            <h3 className="text-2xl font-black text-neutral-950">{selectedPlan.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-neutral-950">RM{selectedPlan.price}</p>
            <p className="text-xs font-medium text-neutral-400">{selectedPlan.period}</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">

          {/* ── Step 1: Scan & Transfer ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[11px] font-black shrink-0">1</div>
              <h4 className="font-bold text-neutral-900">Scan QR to transfer payment</h4>
            </div>

            <div className="rounded-[2rem] overflow-hidden border border-neutral-100 shadow-md bg-white">
              {/* QR card image — already contains CIMB + DuitNow branding, pink border, name */}
              <img
                src={PAYMENT.qrImage}
                alt="CIMB DuitNow QR — Muhammad Azmierul Bin Che Mat"
                className="w-full object-contain"
              />

              {/* Payment reference row */}
              <div className="px-5 py-4 border-t border-neutral-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Payment Reference</p>
                    <p className="text-sm font-bold text-neutral-900 mt-0.5 truncate">{user.email}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Use your email as transfer reference</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(user.email ?? '', 'ref')}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full bg-neutral-50 border border-neutral-200 text-[10px] font-black uppercase text-neutral-500 hover:border-[#F7378A] hover:text-[#F7378A] transition-all"
                  >
                    {copied === 'ref' ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    {copied === 'ref' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Step 2: Upload proof ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[11px] font-black shrink-0">2</div>
              <h4 className="font-bold text-neutral-900">Upload payment screenshot</h4>
            </div>
            <ImageUpload
              value={screenshotUrl}
              onChange={setScreenshotUrl}
              folder="payment-proofs"
              label="Upload your payment screenshot"
            />
            {screenshotUrl && (
              <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <Check size={12} strokeWidth={3} /> Screenshot uploaded successfully
              </p>
            )}
          </div>

          {/* ── Step 3: Notify via WhatsApp ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 rounded-full bg-neutral-950 text-white flex items-center justify-center text-[11px] font-black shrink-0">3</div>
              <h4 className="font-bold text-neutral-900">Send us your details</h4>
            </div>

            <p className="text-sm font-medium text-neutral-500 mb-4">
              Tap below to open WhatsApp with a pre-filled message. Your plan will be activated within <strong className="text-neutral-700">24 hours</strong> after we verify your payment.
            </p>

            <button
              onClick={openWhatsApp}
              className="w-full flex items-center justify-center gap-3 py-5 rounded-full bg-[#25D366] text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-[#25D366]/20 hover:bg-[#1ebe5d] active:scale-95 transition-all"
            >
              <MessageCircle size={20} />
              {waSent ? 'Resend on WhatsApp' : 'Notify us on WhatsApp'}
            </button>

            <AnimatePresence>
              {waSent && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100"
                >
                  <div className="flex items-start gap-3">
                    <Star size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Message sent! 🎉</p>
                      <p className="text-xs font-medium text-emerald-600 mt-0.5">
                        We&apos;ll review your payment and activate your <strong>{selectedPlan.name}</strong> plan within 24 hours. Look out for our WhatsApp confirmation.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
