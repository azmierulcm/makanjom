import type { Metadata } from 'next';
import AppShell from '@/components/layout/AppShell';
import CreatorPublicProfile from '@/components/creator/CreatorPublicProfile';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { MOCK_CREATORS } from '@/lib/mock-data';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params;

  let name = username;
  let bio = `Follow ${username} on Makanjom — Malaysia\'s ultimate food discovery app.`;

  try {
    const supabase = await createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('username', username)
      .maybeSingle();

    if (profile?.full_name) {
      name = profile.full_name;
      bio = `Follow ${name} (@${username}) on Makanjom for food reviews, local tips, and restaurant picks across Malaysia.`;
    } else {
      const mock = MOCK_CREATORS.find((c) => c.profiles?.username === username);
      if (mock?.profiles?.full_name) {
        name = mock.profiles.full_name;
        bio = mock.bio ?? bio;
      }
    }
  } catch {
    // Non-fatal
  }

  return {
    title: `${name} (@${username}) — Makanjom Creator`,
    description: bio,
    openGraph: {
      title: `${name} — Makanjom Creator`,
      description: bio,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${name} — Makanjom Creator`,
      description: bio,
    },
  };
}

export default async function CreatorProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <AppShell>
      <CreatorPublicProfile username={username} />
    </AppShell>
  );
}
