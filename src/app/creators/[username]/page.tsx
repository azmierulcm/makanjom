import AppShell from '@/components/layout/AppShell';
import CreatorPublicProfile from '@/components/creator/CreatorPublicProfile';

export const dynamic = 'force-dynamic';

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <AppShell>
      <CreatorPublicProfile username={username} />
    </AppShell>
  );
}
