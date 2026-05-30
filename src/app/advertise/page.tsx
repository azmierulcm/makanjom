import AppShell from '@/components/layout/AppShell';
import { Sparkles, Star, Megaphone, Target, TrendingUp, Users, BarChart3, CheckCircle2, Mail } from 'lucide-react';

const PACKAGES = [
    {
        icon: Star,
        title: 'Featured Listing',
        price: 'RM 149',
        period: '/month',
        desc: 'Stand out in search results and the Explore feed. Perfect for restaurants wanting steady visibility.',
        features: [
            'Top placement in Explore',
            'Highlighted restaurant card',
            'Priority in MakanjomSpinner',
            'Monthly analytics report',
        ],
        accent: 'from-rose-50 to-white border-rose-100',
        iconBg: 'bg-[#ff385c]',
    },
    {
        icon: Megaphone,
        title: 'Banner Campaign',
        price: 'RM 299',
        period: '/month',
        desc: 'Full-width banners on high-traffic pages. Best for promotions, grand openings, and seasonal deals.',
        features: [
            'Homepage hero banner',
            'Explore & Games page banners',
            'Mobile-optimised creatives',
            'Click-through reporting',
        ],
        accent: 'from-amber-50 to-white border-amber-100',
        iconBg: 'bg-amber-500',
        popular: true,
    },
    {
        icon: Target,
        title: 'Sponsored Content',
        price: 'RM 499',
        period: '/month',
        desc: 'Partner with our creators for authentic food reviews, photography, and social coverage.',
        features: [
            '1 creator review article',
            'Social media coverage',
            'Professional menu photography',
            'SEO-optimised post',
        ],
        accent: 'from-emerald-50 to-white border-emerald-100',
        iconBg: 'bg-emerald-500',
    },
];

const STATS = [
    { icon: Users, value: '50K+', label: 'Monthly active foodies' },
    { icon: TrendingUp, value: '3×', label: 'Average click-through lift' },
    { icon: BarChart3, value: '12+', label: 'Cities across Malaysia' },
];

export default function AdvertisePage() {
    return (
        <AppShell>
            <div className="min-h-screen bg-[#faf9f7]">
                {/* Hero */}
                <section className="px-4 pt-16 pb-12 text-center max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full text-[#ff385c] text-xs font-black uppercase tracking-widest mb-6">
                        <Sparkles size={14} /> Advertise with Makanjom
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-950 leading-tight mb-4">
                        Reach thousands of<br />
                        <span className="text-[#ff385c]">hungry foodies</span>
                    </h1>
                    <p className="text-neutral-500 text-base leading-relaxed font-medium">
                        Put your restaurant in front of Malaysia&apos;s most engaged food discovery community. Flexible packages for every budget.
                    </p>
                </section>

                {/* Stats */}
                <section className="px-4 pb-12 max-w-3xl mx-auto">
                    <div className="grid grid-cols-3 gap-4">
                        {STATS.map(({ icon: Icon, value, label }) => (
                            <div key={label} className="bg-white rounded-3xl p-5 border border-neutral-100 text-center shadow-sm">
                                <Icon size={20} className="text-[#ff385c] mx-auto mb-2" />
                                <p className="text-2xl font-black text-neutral-950">{value}</p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-1 leading-snug">{label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Packages */}
                <section className="px-4 pb-16 max-w-3xl mx-auto">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 text-center mb-8">Ad Packages</h2>
                    <div className="space-y-4">
                        {PACKAGES.map(({ icon: Icon, title, price, period, desc, features, accent, iconBg, popular }) => (
                            <div key={title} className={`relative bg-gradient-to-br ${accent} border rounded-[2rem] p-6 md:p-8`}>
                                {popular && (
                                    <span className="absolute top-5 right-5 px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                                        Most Popular
                                    </span>
                                )}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-11 h-11 ${iconBg} rounded-2xl flex items-center justify-center shrink-0 shadow-sm`}>
                                        <Icon size={20} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-neutral-950 text-lg leading-tight">{title}</h3>
                                        <p className="text-neutral-500 text-sm font-medium mt-1">{desc}</p>
                                    </div>
                                </div>
                                <ul className="space-y-2 mb-6">
                                    {features.map((f) => (
                                        <li key={f} className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                                            <CheckCircle2 size={15} className="text-[#ff385c] shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <span className="text-3xl font-black text-neutral-950">{price}</span>
                                        <span className="text-sm font-bold text-neutral-400 ml-1">{period}</span>
                                    </div>
                                    <a
                                        href={`mailto:ads@makanjom.com?subject=${encodeURIComponent(title + ' Inquiry')}`}
                                        className="px-5 py-3 bg-neutral-950 text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-neutral-800 transition-colors"
                                    >
                                        Get Started
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="px-4 pb-20 max-w-xl mx-auto text-center">
                    <div className="bg-[#ff385c] rounded-[2rem] p-8 text-white">
                        <Mail size={28} className="mx-auto mb-4 opacity-80" />
                        <h2 className="text-2xl font-black tracking-tight mb-2">Custom package?</h2>
                        <p className="text-sm font-medium opacity-80 mb-6 leading-relaxed">
                            Got a bigger campaign in mind? We&apos;ll build a tailored plan for chains, franchises, and events.
                        </p>
                        <a
                            href="mailto:ads@makanjom.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#ff385c] text-xs font-black uppercase tracking-widest rounded-full hover:bg-neutral-50 transition-colors"
                        >
                            <Mail size={14} /> ads@makanjom.com
                        </a>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
