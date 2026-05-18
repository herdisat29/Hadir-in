import { UserStats } from './types';

export const STORAGE_KEYS = {
  STATS: 'hadir_stats',
  MESSAGES: 'hadir_messages',
};

export const getTodayKey = () => new Date().toISOString().split('T')[0];

export const isSameDay = (d1: string, d2: string) => d1 === d2;

export const getDaysBetween = (d1: string, d2: string) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const loadStats = (): UserStats => {
  const saved = localStorage.getItem(STORAGE_KEYS.STATS);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        streak: parsed.streak || 0,
        currentDay: parsed.currentDay || 1,
        lastCheckIn: parsed.lastCheckIn || null,
        checkInHistory: parsed.checkInHistory || [],
        lastOpen: parsed.lastOpen || new Date().toISOString(),
        lastMood: parsed.lastMood || null,
        totalSessions: parsed.totalSessions || 0,
        memoryBank: parsed.memoryBank || [],
        userStyle: parsed.userStyle || 'cerita',
        userAge: parsed.userAge,
        visualMood: parsed.visualMood || 'neutral'
      };
    } catch (e) {
      console.error("Failed to parse stats", e);
    }
  }
  return {
    streak: 0,
    currentDay: 1,
    lastCheckIn: null,
    checkInHistory: [],
    lastOpen: new Date().toISOString(),
    lastMood: null,
    totalSessions: 0,
    memoryBank: [],
    userStyle: 'cerita',
    userAge: undefined,
    visualMood: 'neutral'
  };
};

export const saveStats = (stats: UserStats) => {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
};

export const updateStreak = (stats: UserStats): UserStats => {
  const today = getTodayKey();
  if (stats.lastCheckIn === today) return stats;
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = stats.streak;
  
  if (stats.lastCheckIn === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }
  
  return {
    ...stats,
    streak: newStreak,
    lastCheckIn: today,
  };
};
