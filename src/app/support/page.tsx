'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { HelpCircle, Mail, MessageCircle, ChevronDown, BookOpen, User, Store, ChefHat } from 'lucide-react';

const FAQS = [
    {
        category: 'General',
        items: [
            {
                q: 'What is Makanjom?',
                a: 'Makanjom is Malaysia\'s premier food discovery platform. Spin for restaurant picks, play food games, earn badges, and follow creator reviews — all in one place.',
            },
            {
                q: 'Is Makanjom free to use?',
                a: 'Yes! Discovering restaurants, spinning, playing games, and reading creator reviews are all free. We offer optional premium features for power users.',
            },
            {
                q: 'Which cities does Makanjom cover?',
                a: 'We currently cover 12+ cities across Malaysia including Kuala Lumpur, Petaling Jaya, Cyberjaya, Putrajaya, Johor Bahru, Penang, and more — with new cities added regularly.',
            },
        ],
    },
    {
        category: 'Account',
        items: [
            {
                q: 'How do I reset my password?',
                a: 'Go to the Sign In page and tap "Forgot password?". Enter your email and we\'ll send you a reset link within a few minutes. Check your spam folder if it doesn\'t appear.',
            },
            {
                q: 'Can I change my account role after signing up?',
                a: 'Role changes (e.g. from Customer to Vendor) require manual verification. Email us at support@makanjom.com with your account email and desired role.',
            },
            {
                q: 'How do I delete my account?',
                a: 'Email support@makanjom.com from your registered address with the subject "Account Deletion Request". We\'ll process it within 7 business days per PDPA requirements.',
            },
        ],
    },
    {
        category: 'Vendors',
        items: [
            {
                q: 'How do I list my restaurant on Makanjom?',
                a: 'Register for a Vendor account, then complete your restaurant profile in the Vendor Dashboard. Our team reviews submissions within 2–3 business days.',
            },
            {
                q: 'How do I manage orders and bookings?',
                a: 'All orders and reservations appear in real-time in your Vendor Dashboard under the Orders tab. You\'ll receive in-app notifications for new activity.',
            },
        ],
    },
    {
        category: 'Creators',
        items: [
            {
                q: 'How do I become a Makanjom creator?',
                a: 'Register with the Creator role and complete your creator profile. Once verified, you can publish reviews, articles, and build your food brand on Makanjom.',
            },
            {
                q: 'Can I monetise my creator profile?',
                a: 'Yes. Creators can partner with restaurants via our Sponsored Content programme. Contact ads@makanjom.com to learn more about creator partnerships.',
            },
        ],
    },
];

const CONTACT_OPTIONS = [
    {
        icon: Mail,
        title: 'Email Support',
        desc: 'For account issues, billing, and general enquiries.',
        action: 'support@makanjom.com',
        href: 'mailto:support@makanjom.com',
        badge: 'Replies within 24h',
    },
    {
        icon: MessageCircle,
        title: 'WhatsApp',
        desc: 'Quick help for urgent restaurant or vendor issues.',
        action: 'Chat on WhatsApp',
        href: 'https://wa.me/60123456789',
        badge: 'Mon–Fri 9am–6pm',
    },
];

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full text-left bg-white border border-neutral-100 rounded-2xl px-5 py-4 transition-all hover:border-neutral-200"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="font-bold text-sm text-neutral-900 leading-snug">{q}</span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-neutral-400 mt-0.5 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </div>
            {open && (
                <p className="mt-3 text-sm text-neutral-500 font-medium leading-relaxed border-t border-neutral-50 pt-3">
                    {a}
                </p>
            )}
        </button>
    );
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
    General: <BookOpen size={14} />,
    Account: <User size={14} />,
    Vendors: <Store size={14} />,
    Creators: <ChefHat size={14} />,
};

export default function SupportPage() {
    const [activeCategory, setActiveCategory] = useState('General');
    const active = FAQS.find((f) => f.category === activeCategory)!;

    return (
        <AppShell>
            <div className="min-h-screen bg-[#faf9f7]">
                {/* Hero */}
                <section className="px-4 pt-16 pb-10 text-center max-w-xl mx-auto">
                    <div className="w-14 h-14 bg-[#ff385c] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#ff385c]/20">
                        <HelpCircle size={26} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-950 mb-3">How can we help?</h1>
                    <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                        Find answers to common questions, or reach out and we&apos;ll get back to you fast.
                    </p>
                </section>

                {/* Contact cards */}
                <section className="px-4 pb-10 max-w-2xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CONTACT_OPTIONS.map(({ icon: Icon, title, desc, action, href, badge }) => (
                            <a
                                key={title}
                                href={href}
                                className="bg-white border border-neutral-100 rounded-3xl p-6 flex flex-col gap-3 hover:border-[#ff385c]/30 hover:shadow-md transition-all group"
                            >
                                <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center text-[#ff385c]">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <p className="font-black text-neutral-950 text-sm">{title}</p>
                                    <p className="text-xs text-neutral-400 font-medium mt-0.5">{desc}</p>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-xs font-bold text-[#ff385c] group-hover:underline">{action}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300 bg-neutral-50 px-2 py-1 rounded-full">{badge}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="px-4 pb-20 max-w-2xl mx-auto">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 text-center mb-6">Frequently Asked Questions</h2>

                    {/* Category pills */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                        {FAQS.map(({ category }) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setActiveCategory(category)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === category ? 'bg-neutral-950 text-white' : 'bg-white border border-neutral-100 text-neutral-500 hover:border-neutral-200'}`}
                            >
                                {ROLE_ICONS[category]} {category}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        {active.items.map((item) => (
                            <FAQItem key={item.q} q={item.q} a={item.a} />
                        ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
