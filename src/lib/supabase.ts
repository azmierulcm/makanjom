import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.error(
    '[Makanjom] ⚠️  Supabase env vars are missing!\n' +
    'Create .env.local and set:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>\n' +
    'The app will not function correctly without them.'
  );
}

// createBrowserClient stores auth tokens in cookies, making them available
// to the Next.js middleware for server-side auth checks.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
