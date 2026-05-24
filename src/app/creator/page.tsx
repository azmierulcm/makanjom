import AppShell from '@/components/layout/AppShell';
import CreatorDashboard from '@/components/creator/CreatorDashboard';

export const dynamic = 'force-dynamic';

export default function CreatorHubPage() {
  return (
    <AppShell>
      <CreatorDashboard />
    </AppShell>
  );
}
