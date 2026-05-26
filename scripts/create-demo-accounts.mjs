/**
 * Creates one demo account per role for local testing.
 * Requires email confirmations to be DISABLED in Supabase Auth settings.
 *
 * Usage: node scripts/create-demo-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

// Parse .env.local manually
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const ACCOUNTS = [
  { email: 'customer@makanjom.demo', password: 'Demo1234!', role: 'customer',  label: 'Customer' },
  { email: 'vendor@makanjom.demo',   password: 'Demo1234!', role: 'vendor',    label: 'Vendor' },
  { email: 'creator@makanjom.demo',  password: 'Demo1234!', role: 'creator',   label: 'Creator' },
  { email: 'admin@makanjom.demo',    password: 'Demo1234!', role: 'admin',     label: 'Admin' },
];

for (const account of ACCOUNTS) {
  process.stdout.write(`Creating ${account.label} (${account.email})... `);

  const { data, error } = await supabase.auth.signUp({
    email: account.email,
    password: account.password,
    options: {
      data: {
        role: account.role,
        full_name: account.label,
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      console.log('already exists — skipped');
    } else {
      console.log(`FAILED: ${error.message}`);
    }
    continue;
  }

  console.log(`created (id: ${data.user?.id?.slice(0, 8)}...)`);
}

console.log('\nDone! All demo accounts use password: Demo1234!');
console.log('\nRole → Dashboard:');
console.log('  customer@makanjom.demo → /profile');
console.log('  vendor@makanjom.demo   → /vendor');
console.log('  creator@makanjom.demo  → /creator');
console.log('  admin@makanjom.demo    → /admin');
