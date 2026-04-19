/**
 * VangaTypePanalam — UI Zustand Store
 *
 * Manages global UI state: theme, language, modals.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language, KeyboardLayout, Theme } from '@/db/schema';

export type ErrorMode = 'free' | 'stopOnWord' | 'stopOnLetter';
export type CaretStyle = 'line' | 'outline';
export type CaretSpeed = 'slow' | 'medium' | 'fast';

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

  // Typing engine options
  errorMode: ErrorMode;
  setErrorMode: (mode: ErrorMode) => void;
  caretStyle: CaretStyle;
  setCaretStyle: (style: CaretStyle) => void;
  caretSpeed: CaretSpeed;
  setCaretSpeed: (speed: CaretSpeed) => void;

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

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
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

      errorMode: 'free',
      setErrorMode: (errorMode) => set({ errorMode }),

      caretStyle: 'line',
      setCaretStyle: (caretStyle) =>
        set({ caretStyle: caretStyle === 'outline' ? 'outline' : 'line' }),

      caretSpeed: 'medium',
      setCaretSpeed: (caretSpeed) => set({ caretSpeed }),
    }),
    {
      name: 'VANGA-ui-store',
      // Only persist settings, not dynamic UI state like modals or online status
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        keyboardLayout: state.keyboardLayout,
        soundEnabled: state.soundEnabled,
        caretStyle: state.caretStyle,
        caretSpeed: state.caretSpeed,
      }),
    }
  )
);
