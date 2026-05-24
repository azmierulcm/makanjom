import AppShell from '@/components/layout/AppShell';
import MakanjomSpinner from '@/components/MakanjomSpinner';

export default function Home() {
  return (
    <AppShell>
      <div className="py-8 sm:py-12">
        <MakanjomSpinner />
      </div>
    </AppShell>
  );
}
