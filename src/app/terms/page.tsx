import AppShell from '@/components/layout/AppShell';
import { ScrollText } from 'lucide-react';
import Link from 'next/link';

const SECTIONS = [
    {
        title: '1. Acceptance of Terms',
        body: `By accessing or using Makanjom ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all users — customers, vendors, and creators.`,
    },
    {
        title: '2. Eligibility',
        body: `You must be at least 13 years old to use Makanjom. By creating an account, you confirm that all information you provide is accurate and that you have the legal capacity to enter into these Terms.`,
    },
    {
        title: '3. Accounts',
        body: `You are responsible for:
• Keeping your password confidential and not sharing account credentials
• All activity that occurs under your account
• Notifying us immediately at support@makanjom.com if you suspect unauthorised access

We reserve the right to suspend or terminate accounts that violate these Terms.`,
    },
    {
        title: '4. User Conduct',
        body: `You agree not to:
• Post false, misleading, or defamatory content
• Upload malicious code, spam, or unsolicited commercial messages
• Scrape, crawl, or harvest data from the Platform without written permission
• Impersonate another person or entity
• Circumvent any security or authentication measures
• Use the Platform for any unlawful purpose under Malaysian law`,
    },
    {
        title: '5. User-Generated Content',
        body: `By submitting reviews, articles, photos, or other content ("Content"), you grant Makanjom a non-exclusive, royalty-free, worldwide licence to use, display, reproduce, and distribute your Content in connection with operating the Platform.

You retain ownership of your Content. You are solely responsible for ensuring it does not infringe third-party rights or violate applicable laws.`,
    },
    {
        title: '6. Vendor Terms',
        body: `Vendors who list restaurants on Makanjom agree to:
• Provide accurate and up-to-date restaurant information, menus, and pricing
• Honour bookings and orders confirmed through the Platform
• Comply with all applicable food safety and business licensing laws in Malaysia
• Not engage in deceptive promotions or fake reviews

Makanjom reserves the right to remove listings that violate these requirements.`,
    },
    {
        title: '7. Creator Terms',
        body: `Creators agree to:
• Publish only authentic, first-hand reviews and food content
• Disclose any paid partnerships or sponsored content clearly
• Not accept compensation from vendors in exchange for falsely positive reviews
• Comply with Malaysia's Consumer Protection Act and Communications and Multimedia Act

Violation of these terms may result in creator status revocation.`,
    },
    {
        title: '8. Intellectual Property',
        body: `All Platform content, design, logos, and code not created by users are the property of Makanjom or its licensors. You may not copy, modify, distribute, or create derivative works without our prior written consent.`,
    },
    {
        title: '9. Third-Party Services',
        body: `Makanjom integrates with third-party services (e.g. Supabase for authentication, Vercel for hosting). These services have their own terms and privacy policies. We are not responsible for their practices.`,
    },
    {
        title: '10. Disclaimers',
        body: `The Platform is provided "as is" without warranties of any kind. We do not guarantee the accuracy of restaurant information, availability of listings, or uninterrupted service. Restaurant quality, food safety, and service are the sole responsibility of the respective vendors.`,
    },
    {
        title: '11. Limitation of Liability',
        body: `To the fullest extent permitted by Malaysian law, Makanjom shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to food quality, unfulfilled orders, or data loss.`,
    },
    {
        title: '12. Governing Law',
        body: `These Terms are governed by the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Malaysia.`,
    },
    {
        title: '13. Changes to These Terms',
        body: `We may update these Terms from time to time. We will notify you of material changes via email or a prominent notice on the Platform. Continued use after changes take effect constitutes your acceptance of the revised Terms.`,
    },
    {
        title: '14. Contact',
        body: `For questions about these Terms:\n\nEmail: legal@makanjom.com\nAddress: Cyberjaya, Selangor, Malaysia`,
    },
];

export default function TermsPage() {
    return (
        <AppShell>
            <div className="min-h-screen bg-[#faf9f7]">
                {/* Hero */}
                <section className="px-4 pt-16 pb-10 text-center max-w-xl mx-auto">
                    <div className="w-14 h-14 bg-neutral-950 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                        <ScrollText size={26} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-950 mb-3">Terms of Service</h1>
                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Last updated: 30 May 2026</p>
                    <p className="text-neutral-500 text-sm font-medium leading-relaxed mt-3">
                        Please read these terms carefully before using Makanjom. They govern your rights and responsibilities on the platform.
                    </p>
                </section>

                {/* Content */}
                <section className="px-4 pb-20 max-w-2xl mx-auto">
                    <div className="space-y-4">
                        {SECTIONS.map(({ title, body }) => (
                            <div key={title} className="bg-white border border-neutral-100 rounded-3xl p-6 md:p-8">
                                <h2 className="font-black text-neutral-950 mb-3">{title}</h2>
                                <p className="text-sm text-neutral-500 font-medium leading-relaxed whitespace-pre-line">{body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-neutral-400 font-medium">
                            Questions?{' '}
                            <Link href="/support" className="text-[#ff385c] font-bold hover:underline">
                                Visit our Support page
                            </Link>{' '}
                            or email{' '}
                            <a href="mailto:legal@makanjom.com" className="text-[#ff385c] font-bold hover:underline">
                                legal@makanjom.com
                            </a>
                        </p>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
