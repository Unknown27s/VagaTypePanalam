/**
 * VaagaTypePanalam — Stats Calculator
 *
 * Pure functions for WPM, accuracy, and raw WPM calculations.
 * No side effects, no state — just math.
 */

import { CHARS_PER_WORD } from './constants';

/**
 * Calculate net WPM (only correct characters count).
 * Standard: 1 word = 5 characters.
 */
export function calculateWPM(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || correctChars <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return Math.round((correctChars / CHARS_PER_WORD) / minutes);
}

/**
 * Calculate raw WPM (all characters, including errors).
 * Measures raw typing speed regardless of accuracy.
 */
export function calculateRawWPM(totalChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || totalChars <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return Math.round((totalChars / CHARS_PER_WORD) / minutes);
}

/**
 * Calculate Burst WPM for a single word.
 * Measures speed for just one segment of typing.
 */
export function calculateBurstWPM(charCount: number, durationMs: number): number {
  if (durationMs <= 0 || charCount <= 0) return 0;
  const minutes = durationMs / 60_000;
  return Math.round((charCount / CHARS_PER_WORD) / minutes);
}

/**
 * Calculate accuracy as a ratio (0-1).
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 1;
  return correct / total;
}

/**
 * Calculate accuracy as a percentage string (e.g., "97.5%").
 */
export function formatAccuracy(correct: number, total: number): string {
  const acc = calculateAccuracy(correct, total);
  return `${(acc * 100).toFixed(1)}%`;
}

/**
 * Format WPM for display.
 */
export function formatWPM(wpm: number): string {
  return String(Math.max(0, wpm));
}

/**
 * Format duration (ms) to human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Get the local date string in YYYY-MM-DD format.
 * Avoids UTC timezone shift issues associated with toISOString().
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate consistency score using the Kogasa method (Monkeytype standard).
 * Kogasa consistency = (1 - (StdDev / Mean)) * 100.
 * Higher score (closer to 1.0) means more rhythmic and fluid typing.
 */
export function calculateKogasa(latencies: number[]): number {
  if (latencies.length < 2) return 1;

  // Filter out extreme pauses (manual break/distraction) to avoid skewed results
  const filtered = latencies.filter(l => l < 2000);
  if (filtered.length < 2) return 1;

  const mean = filtered.reduce((a, b) => a + b, 0) / filtered.length;
  if (mean === 0) return 1;

  const variance = filtered.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / filtered.length;
  const stdDev = Math.sqrt(variance);

  // Kogasa formula: 1 - (StdDev / Mean)
  // We clamp it to [0, 1]
  const score = 1 - (stdDev / mean);
  return Math.max(0, Math.min(1, score));
}

/**
 * Legacy consistency calculator (CV-based).
 * @deprecated Use calculateKogasa for better Monkeytype-like behavior.
 */
export function calculateConsistency(wpms: number[]): number {
  if (wpms.length < 2) return 1;

  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 0;

  const variance =
    wpms.reduce((sum, wpm) => sum + Math.pow(wpm - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV) — normalize by mean
  const cv = stdDev / mean;

  // Convert to 0-1 score (CV of 0 = 1.0, CV of 0.5 = 0.0)
  return Math.max(0, Math.min(1, 1 - cv * 2));
}
