import type { Badge, SpinRecord } from './types';

const STORAGE_KEY = 'makanjom_gamification';

export interface GamificationState {
  points: number;
  badges: Badge[];
  spinHistory: SpinRecord[];
  savedRestaurants: string[];
  gamesPlayed: number;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-spin', name: 'First Spin', description: 'Spun the wheel for the first time', icon: '🎰' },
  { id: 'spin-master', name: 'Spin Master', description: 'Completed 10 spins', icon: '🌀' },
  { id: 'explorer', name: 'Neighborhood Explorer', description: 'Visited 5 different restaurants', icon: '🗺️' },
  { id: 'reviewer', name: 'Trusted Reviewer', description: 'Posted your first review', icon: '⭐' },
  { id: 'game-on', name: 'Game On', description: 'Played your first mini-game', icon: '🎮' },
  { id: 'trivia-ace', name: 'Trivia Ace', description: 'Scored 100% on food trivia', icon: '🧠' },
];

export function getGamificationState(): GamificationState {
  if (typeof window === 'undefined') {
    return { points: 0, badges: [], spinHistory: [], savedRestaurants: [], gamesPlayed: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { points: 0, badges: [], spinHistory: [], savedRestaurants: [], gamesPlayed: 0 };
}

function saveState(state: GamificationState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function unlockBadge(state: GamificationState, badgeId: string): GamificationState {
  if (state.badges.some((b) => b.id === badgeId)) return state;
  const badge = DEFAULT_BADGES.find((b) => b.id === badgeId);
  if (!badge) return state;
  return {
    ...state,
    badges: [...state.badges, { ...badge, unlocked_at: new Date().toISOString() }],
  };
}

export function addPoints(amount: number, reason?: string): GamificationState {
  const state = getGamificationState();
  const updated = { ...state, points: state.points + amount };
  saveState(updated);
  if (reason) console.debug(`+${amount} pts: ${reason}`);
  return updated;
}

export function recordSpin(restaurantId: string, restaurantName: string, craving: string): GamificationState {
  let state = getGamificationState();
  const record: SpinRecord = {
    id: crypto.randomUUID(),
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    craving,
    created_at: new Date().toISOString(),
  };
  state = {
    ...state,
    spinHistory: [record, ...state.spinHistory].slice(0, 50),
    points: state.points + 10,
  };
  state = unlockBadge(state, 'first-spin');
  if (state.spinHistory.length >= 10) state = unlockBadge(state, 'spin-master');
  saveState(state);
  return state;
}

export function recordGamePlayed(pointsEarned: number, perfectScore = false): GamificationState {
  let state = getGamificationState();
  state = {
    ...state,
    gamesPlayed: state.gamesPlayed + 1,
    points: state.points + pointsEarned,
  };
  state = unlockBadge(state, 'game-on');
  if (perfectScore) state = unlockBadge(state, 'trivia-ace');
  saveState(state);
  return state;
}

export function toggleSavedRestaurant(restaurantId: string): GamificationState {
  let state = getGamificationState();
  const saved = state.savedRestaurants.includes(restaurantId)
    ? state.savedRestaurants.filter((id) => id !== restaurantId)
    : [...state.savedRestaurants, restaurantId];
  state = { ...state, savedRestaurants: saved };
  if (saved.length >= 5) state = unlockBadge(state, 'explorer');
  saveState(state);
  return state;
}

export function recordReview(): GamificationState {
  let state = getGamificationState();
  state = { ...state, points: state.points + 50 };
  state = unlockBadge(state, 'reviewer');
  saveState(state);
  return state;
}

export function getLevel(points: number): { title: string; next: string; progress: number; remaining: number } {
  const tiers = [
    { min: 0, title: 'Newbie Foodie', next: 'Local Explorer' },
    { min: 500, title: 'Local Explorer', next: 'Gourmet Guide' },
    { min: 1500, title: 'Gourmet Guide', next: 'Dining Legend' },
    { min: 5000, title: 'Dining Legend', next: 'Dining Legend' },
  ];
  const current = [...tiers].reverse().find((t) => points >= t.min) ?? tiers[0];
  const nextTier = tiers.find((t) => t.min > points);
  const nextMin = nextTier?.min ?? current.min;
  const prevMin = tiers.find((t) => t.title === current.title)?.min ?? 0;
  const range = nextMin - prevMin;
  const progress = nextTier ? Math.min(100, ((points - prevMin) / range) * 100) : 100;
  return {
    title: current.title,
    next: current.next,
    progress,
    remaining: nextTier ? nextMin - points : 0,
  };
}

export { DEFAULT_BADGES };
