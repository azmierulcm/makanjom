/**
 * Unit tests for gamification.ts
 * localStorage is auto-mocked via jest-environment-jsdom.
 * Supabase is mocked so DB sync doesn't require a live connection.
 */

// Mock the supabase client before importing gamification
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  },
}));

import {
  getGamificationState,
  addPoints,
  recordSpin,
  recordGamePlayed,
  toggleSavedRestaurant,
  recordReview,
  getLevel,
} from '@/lib/gamification';

beforeEach(() => {
  localStorage.clear();
});

describe('getGamificationState', () => {
  it('returns default state when localStorage is empty', () => {
    const state = getGamificationState();
    expect(state.points).toBe(0);
    expect(state.badges).toHaveLength(0);
    expect(state.spinHistory).toHaveLength(0);
    expect(state.gamesPlayed).toBe(0);
  });
});

describe('addPoints', () => {
  it('accumulates points across calls', () => {
    addPoints(100);
    const state = addPoints(50);
    expect(state.points).toBe(150);
  });

  it('persists to localStorage', () => {
    addPoints(200);
    const state = getGamificationState();
    expect(state.points).toBe(200);
  });
});

describe('recordSpin', () => {
  it('awards 10 points per spin', () => {
    const state = recordSpin('r1', 'Nasi Lemak House', 'Rice');
    expect(state.points).toBe(10);
  });

  it('records spin in history', () => {
    const state = recordSpin('r1', 'Nasi Lemak House', 'Rice');
    expect(state.spinHistory).toHaveLength(1);
    expect(state.spinHistory[0].restaurant_id).toBe('r1');
  });

  it('unlocks first-spin badge on first spin', () => {
    const state = recordSpin('r1', 'Nasi Lemak House', 'Rice');
    expect(state.badges.some((b) => b.id === 'first-spin')).toBe(true);
  });

  it('unlocks spin-master badge after 10 spins', () => {
    let state = getGamificationState();
    for (let i = 0; i < 10; i++) {
      state = recordSpin(`r${i}`, `Restaurant ${i}`, 'Rice');
    }
    expect(state.badges.some((b) => b.id === 'spin-master')).toBe(true);
  });

  it('caps spin history at 50 entries', () => {
    for (let i = 0; i < 55; i++) {
      recordSpin(`r${i}`, `R${i}`, 'Rice');
    }
    const state = getGamificationState();
    expect(state.spinHistory.length).toBeLessThanOrEqual(50);
  });
});

describe('recordGamePlayed', () => {
  it('adds earned points and increments gamesPlayed', () => {
    const state = recordGamePlayed(100);
    expect(state.points).toBe(100);
    expect(state.gamesPlayed).toBe(1);
  });

  it('unlocks game-on badge on first game', () => {
    const state = recordGamePlayed(20);
    expect(state.badges.some((b) => b.id === 'game-on')).toBe(true);
  });

  it('unlocks trivia-ace badge on perfect score', () => {
    const state = recordGamePlayed(100, true);
    expect(state.badges.some((b) => b.id === 'trivia-ace')).toBe(true);
  });

  it('does not unlock trivia-ace without perfect score', () => {
    const state = recordGamePlayed(60, false);
    expect(state.badges.some((b) => b.id === 'trivia-ace')).toBe(false);
  });
});

describe('toggleSavedRestaurant', () => {
  it('saves a restaurant', () => {
    const state = toggleSavedRestaurant('r1');
    expect(state.savedRestaurants).toContain('r1');
  });

  it('unsaves an already-saved restaurant', () => {
    toggleSavedRestaurant('r1');
    const state = toggleSavedRestaurant('r1');
    expect(state.savedRestaurants).not.toContain('r1');
  });

  it('unlocks explorer badge after saving 5 restaurants', () => {
    let state = getGamificationState();
    for (let i = 1; i <= 5; i++) {
      state = toggleSavedRestaurant(`r${i}`);
    }
    expect(state.badges.some((b) => b.id === 'explorer')).toBe(true);
  });
});

describe('recordReview', () => {
  it('awards 50 points', () => {
    const state = recordReview();
    expect(state.points).toBe(50);
  });

  it('unlocks reviewer badge', () => {
    const state = recordReview();
    expect(state.badges.some((b) => b.id === 'reviewer')).toBe(true);
  });

  it('does not duplicate reviewer badge on multiple reviews', () => {
    recordReview();
    const state = recordReview();
    expect(state.badges.filter((b) => b.id === 'reviewer')).toHaveLength(1);
  });
});

describe('getLevel', () => {
  it('returns Newbie Foodie at 0 points', () => {
    expect(getLevel(0).title).toBe('Newbie Foodie');
  });

  it('returns Local Explorer at 500 points', () => {
    expect(getLevel(500).title).toBe('Local Explorer');
  });

  it('returns Gourmet Guide at 1500 points', () => {
    expect(getLevel(1500).title).toBe('Gourmet Guide');
  });

  it('returns Dining Legend at 5000 points', () => {
    expect(getLevel(5000).title).toBe('Dining Legend');
  });

  it('returns 100% progress at max level', () => {
    expect(getLevel(5000).progress).toBe(100);
  });

  it('returns 0 remaining at max level', () => {
    expect(getLevel(5000).remaining).toBe(0);
  });
});
