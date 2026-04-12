/**
 * VaagaTypePanalam — UI Zustand Store
 *
 * Manages global UI state: theme, language, modals.
 */

import { create } from 'zustand';
import type { Language, KeyboardLayout, Theme } from '@/db/schema';

interface UIState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Language
  language: Language;
  setLanguage: (language: Language) => void;

  // Keyboard Layout
  keyboardLayout: KeyboardLayout;
  setKeyboardLayout: (layout: KeyboardLayout) => void;

  // Keyboard visibility
  showKeyboard: boolean;
  toggleKeyboard: () => void;

  // Sound effects
  soundEnabled: boolean;
  toggleSound: () => void;

  // Connection status
  isOnline: boolean;
  setOnline: (online: boolean) => void;

  // Modal
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  },
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
      return { theme: newTheme };
    }),

  language: 'en',
  setLanguage: (language) => set({ language }),

  keyboardLayout: 'qwerty',
  setKeyboardLayout: (keyboardLayout) => set({ keyboardLayout }),

  showKeyboard: true,
  toggleKeyboard: () => set((state) => ({ showKeyboard: !state.showKeyboard })),

  soundEnabled: true,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  isOnline: true, // Always true initially; updated by event listeners post-hydration
  setOnline: (isOnline) => set({ isOnline }),

  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
