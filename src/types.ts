/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

export interface UserStats {
  streak: number;
  currentDay: number;
  lastCheckIn: string | null; // ISO Date 
  checkInHistory: string[];
  lastOpen: string | null;    // ISO Date/Time
  lastMood: string | null;    // Short summary
  totalSessions: number;
  memoryBank: string[];       // Array of short summaries from past sessions
  userStyle?: 'cerita' | 'tanya';
  userAge?: string;
  visualMood?: string;        // The AI determined mood for visual theme
}

export enum AppScreen {
  SPLASH = 'splash',
  ONBOARDING = 'onboarding',
  CHAT = 'chat',
  CLOSING = 'closing',
  REFLECTION = 'reflection',
  ALREADY_CHECKED_IN = 'already_checked_in'
}
