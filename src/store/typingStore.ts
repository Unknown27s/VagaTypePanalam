/**
 * VaagaTypePanalam — Typing Zustand Store
 *
 * Manages the global typing session state.
 * Event-driven — only updates when something changes.
 */

import { create } from 'zustand';
import type { SessionSnapshot } from '@/engine/sessionTracker';

interface TypingState {
  // Session snapshot (mirrors SessionTracker)
  snapshot: SessionSnapshot;
  
  // UI state
  showResults: boolean;
  isPaused: boolean;

  // Actions
  updateSnapshot: (snapshot: SessionSnapshot) => void;
  setShowResults: (show: boolean) => void;
  setPaused: (paused: boolean) => void;
  resetUI: () => void;
}

const defaultSnapshot: SessionSnapshot = {
  state: 'idle',
  text: '',
  cursorPosition: 0,
  correctChars: 0,
  errorChars: 0,
  totalKeystrokes: 0,
  wpm: 0,
  rawWpm: 0,
  accuracy: 1,
  elapsedMs: 0,
  isComplete: false,
  segmentsCompleted: 0,
  totalWordsTyped: 0,
  isCalibrated: true,
  samplesCollected: 0,
  errorIndices: [],
  typedChars: {},
  // Word-based tracking
  words: [],
  activeWordIndex: 0,
  currentWordInput: '',
  wordInputHistory: [],
  wordCorrectness: {},
  // Analytics
  burstHistory: [],
  consistency: 1,
  slowestDigraphs: [],
};

export const useTypingStore = create<TypingState>((set) => ({
  snapshot: defaultSnapshot,
  showResults: false,
  isPaused: false,

  updateSnapshot: (snapshot) => set({ snapshot }),
  setShowResults: (showResults) => set({ showResults }),
  setPaused: (isPaused) => set({ isPaused }),
  resetUI: () =>
    set({
      snapshot: defaultSnapshot,
      showResults: false,
      isPaused: false,
    }),
}));
