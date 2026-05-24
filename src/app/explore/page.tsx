import AppShell from '@/components/layout/AppShell';
import ExplorePage from '@/components/ExplorePage';

export const dynamic = 'force-dynamic';

export default function Explore() {
  return (
    <AppShell>
      <ExplorePage />
    </AppShell>
  );
}
