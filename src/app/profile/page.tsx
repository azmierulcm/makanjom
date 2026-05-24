import AppShell from '@/components/layout/AppShell';
import UserProfile from '@/components/profile/UserProfile';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <AppShell>
      <UserProfile />
    </AppShell>
  );
}
