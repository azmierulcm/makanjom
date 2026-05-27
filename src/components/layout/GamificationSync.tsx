'use client';

import { useEffect } from 'react';
import { syncFromDb } from '@/lib/gamification';

// Fires syncFromDb once on mount so points/badges are up-to-date regardless
// of which page the user lands on first (not just the Spinner page).
export default function GamificationSync() {
  useEffect(() => {
    syncFromDb().catch(() => {});
  }, []);
  return null;
}
