/**
 * VaagaTypePanalam — Engine Public API
 *
 * Re-exports all engine modules for clean imports.
 */

export { KeyProfiler } from './keyProfiler';
export { SessionTracker } from './sessionTracker';
export type { SessionState, SessionSnapshot } from './sessionTracker';
export { generateAdaptiveText, generateLessonText } from './textGenerator';
export {
  calculateWPM,
  calculateRawWPM,
  calculateAccuracy,
  calculateConsistency,
  formatAccuracy,
  formatWPM,
  formatDuration,
} from './statsCalculator';
export * from './constants';
