import { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { STORAGE_KEYS } from '../constants';
import { getTodayKey } from '../utils';

export const useStats = () => {
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window === 'undefined') return {
      streak: 0,
      currentDay: 1,
      lastCheckIn: null,
      checkInHistory: [],
      lastOpen: null,
      lastMood: null,
      totalSessions: 0,
      memoryBank: []
    };
    
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          memoryBank: parsed.memoryBank || [],
          checkInHistory: parsed.checkInHistory || [],
          totalSessions: parsed.totalSessions || 0,
          userAge: parsed.userAge,
        };
      } catch (e) {
        console.error("Failed to parse initial stats", e);
      }
    }
    return {
      streak: 0,
      currentDay: 1,
      lastCheckIn: null,
      checkInHistory: [],
      lastOpen: null,
      lastMood: null,
      totalSessions: 0,
      memoryBank: [],
      userAge: undefined
    };
  });

  const [hasLongBreak, setHasLongBreak] = useState(false);

  useEffect(() => {
    const today = getTodayKey();
    
    // Update session count and last open ONLY ONCE on mount
    const newStats = {
      ...stats,
      totalSessions: (stats.totalSessions || 0) + 1,
      lastOpen: new Date().toISOString()
    };

    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));

    // Check for long break (>= 5 days)
    if (stats.lastCheckIn) {
      const last = new Date(stats.lastCheckIn);
      const now = new Date(today);
      const diffTime = now.getTime() - last.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 5) {
        setHasLongBreak(true);
      }
    }
  }, []);

  const updateStats = (update: Partial<UserStats>) => {
    const newStats = { ...stats, ...update };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  };

  const addDay = () => {
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const alreadyCheckedInToday = stats.lastCheckIn === today;
    const isConsecutive = stats.lastCheckIn === yesterday;

    let newStreak = stats.streak || 0;
    if (isConsecutive) {
      newStreak += 1;
    } else if (!alreadyCheckedInToday) {
      newStreak = 1;
    }

    const newStats = { 
      ...stats, 
      currentDay: alreadyCheckedInToday ? stats.currentDay : (stats.currentDay || 0) + 1, 
      streak: newStreak,
      lastCheckIn: today 
    };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  };

  const resetToday = () => {
    const newStats = { ...stats, lastCheckIn: null };
    setStats(newStats);
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(newStats));
  };

  const fullReset = () => {
     setStats({
       streak: 0,
       lastCheckIn: null,
       totalSessions: 0,
       currentDay: 1,
       lastMood: 'neutral',
       memoryBank: [],
       checkInHistory: [],
       userStyle: 'cerita',
       userAge: 'unknown',
       lastOpen: new Date().toISOString()
    });
    localStorage.clear();
  };

  return {
    stats,
    updateStats,
    hasLongBreak,
    addDay,
    resetToday,
    fullReset
  };
};
