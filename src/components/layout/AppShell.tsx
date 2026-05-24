import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[100dvh] bg-[#faf9f7] pb-safe-nav md:pb-12">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
