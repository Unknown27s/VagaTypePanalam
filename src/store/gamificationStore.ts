import { create } from 'zustand';
import type { Rank, Badge, Event } from '@prisma/client';
import { setGamificationConfig } from '@/engine/gamification';

export interface GamificationState {
  ranks: Rank[];
  badges: Badge[];
  events: Event[];
  loading: boolean;
  fetchGamification: () => Promise<void>;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  ranks: [],
  badges: [],
  events: [],
  loading: true,
  fetchGamification: async () => {
    if (process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true') {
      set({ loading: false });
      return;
    }
    try {
      const response = await fetch('/api/gamification');
      if (!response.ok) throw new Error('Failed to fetch gamification data');
      const data = await response.json();
      
      // Update pure functions in engine
      setGamificationConfig(data.ranks || [], data.badges || [], data.events || []);

      set({
        ranks: data.ranks || [],
        badges: data.badges || [],
        events: data.events || [],
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching gamification config:', error);
      set({ loading: false });
    }
  },
}));
