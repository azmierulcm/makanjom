import AppShell from '@/components/layout/AppShell';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const SECTIONS = [
    {
        title: '1. Information We Collect',
        body: `We collect information you provide directly — such as your name, email address, password, and role (customer, vendor, or creator) when you create an account.

We also collect information automatically when you use Makanjom, including:
• Usage data (pages visited, features used, spin history, games played)
• Device information (browser type, operating system, screen size)
• Location data if you grant permission (used to find nearby restaurants)
• Cookies and similar tracking technologies`,
    },
    {
        title: '2. How We Use Your Information',
        body: `We use your information to:
• Provide and improve the Makanjom platform
• Personalise restaurant recommendations and spinner results
• Track and display your badges, points, and game scores
• Send transactional emails (account verification, password reset)
• Process vendor orders and bookings
• Display relevant promotional content from our advertising partners
• Comply with applicable laws, including Malaysia's Personal Data Protection Act 2010 (PDPA)`,
    },
    {
        title: '3. Sharing Your Information',
        body: `We do not sell your personal data. We may share it with:
• Restaurants and vendors only to fulfil your bookings or orders
• Service providers who operate on our behalf (hosting, analytics, email delivery) under strict confidentiality agreements
• Law enforcement or regulatory authorities when required by law
• A successor entity in the event of a merger, acquisition, or sale of assets`,
    },
    {
        title: '4. Data Retention',
        body: `We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion at any time (see Your Rights below). Certain data may be retained longer where required by law or for legitimate business purposes such as fraud prevention.`,
    },
    {
        title: '5. Cookies',
        body: `Makanjom uses cookies and similar technologies to maintain your session, remember preferences, and analyse usage. You can control cookies through your browser settings. Disabling cookies may affect some features of the platform.`,
    },
    {
        title: '6. Security',
        body: `We implement industry-standard security measures including TLS encryption in transit and row-level security on our database. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password and to log out when using shared devices.`,
    },
    {
        title: '7. Your Rights (PDPA)',
        body: `Under Malaysia's Personal Data Protection Act 2010, you have the right to:
• Access the personal data we hold about you
• Correct inaccurate or outdated data
• Withdraw consent for processing (which may limit your access to some features)
• Request deletion of your account and associated data

To exercise these rights, email us at privacy@makanjom.com from your registered email address.`,
    },
    {
        title: '8. Children\'s Privacy',
        body: `Makanjom is not directed at children under 13. We do not knowingly collect personal data from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.`,
    },
    {
        title: '9. Changes to This Policy',
        body: `We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date above and, for material changes, notify you by email or prominent notice on the platform. Continued use of Makanjom after changes take effect constitutes acceptance of the updated policy.`,
    },
    {
        title: '10. Contact Us',
        body: `For privacy-related questions or requests:\n\nEmail: privacy@makanjom.com\nAddress: Cyberjaya, Selangor, Malaysia`,
    },
];

export default function PrivacyPage() {
    return (
        <AppShell>
            <div className="min-h-screen bg-[#faf9f7]">
                {/* Hero */}
                <section className="px-4 pt-16 pb-10 text-center max-w-xl mx-auto">
                    <div className="w-14 h-14 bg-neutral-950 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                        <ShieldCheck size={26} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-950 mb-3">Privacy Policy</h1>
                    <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">Last updated: 30 May 2026</p>
                    <p className="text-neutral-500 text-sm font-medium leading-relaxed mt-3">
                        Your privacy matters to us. This policy explains what data we collect, why, and how you can control it.
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
                            <a href="mailto:privacy@makanjom.com" className="text-[#ff385c] font-bold hover:underline">
                                privacy@makanjom.com
                            </a>
                        </p>
                    </div>
                </section>
            </div>
        </AppShell>
    );
}
