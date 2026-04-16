/**
 * VaagaTypePanalam — Key Profiler
 *
 * Tracks per-key performance using circular buffers for
 * rolling averages. This is the adaptive learning core.
 */

import type { KeyStat, Language } from '@/db/schema';
import { createDefaultKeyStat, batchSaveKeyStats } from '@/db/keyStats';
import {
  RECENT_CORRECT_BUFFER_SIZE,
  RECENT_LATENCY_BUFFER_SIZE,
  ACCURACY_WEIGHT,
  SPEED_WEIGHT,
  SPEED_BEST_MS,
  SPEED_WORST_MS,
  WEAK_KEY_THRESHOLD,
  IDB_FLUSH_DEBOUNCE_MS,
} from './constants';

// ── Circular Buffer ──

class CircularBuffer<T> {
  private buffer: T[];
  private pointer: number = 0;
  private maxSize: number;

  constructor(size: number, initial: T[] = []) {
    this.maxSize = size;
    this.buffer = initial.slice(-size); // Take last N items if initial is larger
    this.pointer = this.buffer.length % size;
  }

  push(item: T): void {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(item);
    } else {
      this.buffer[this.pointer] = item;
    }
    this.pointer = (this.pointer + 1) % this.maxSize;
  }

  getAll(): T[] {
    return [...this.buffer];
  }

  getLength(): number {
    return this.buffer.length;
  }

  toArray(): T[] {
    return [...this.buffer];
  }
}

// ── Key Profile (in-memory working state) ──

interface KeyProfileState {
  char: string;
  language: Language;
  totalAttempts: number;
  correctAttempts: number;
  recentCorrect: CircularBuffer<boolean>;
  recentLatencies: CircularBuffer<number>;
  lastPracticed: number;
  confidence: number;
  isWeak: boolean;
  dirty: boolean; // Needs to be flushed to IDB
}

// ── Key Profiler Class ──

export class KeyProfiler {
  private profiles: Map<string, KeyProfileState> = new Map();
  private language: Language;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private onStatsUpdate?: (char: string, stat: KeyStat) => void;

  // Digraph tracking state
  private lastChar: string | null = null;
  private lastCharTime: number = 0;

  constructor(language: Language) {
    this.language = language;
  }

  /**
   * Set a callback for when key stats are updated.
   */
  setOnStatsUpdate(callback: (char: string, stat: KeyStat) => void): void {
    this.onStatsUpdate = callback;
  }

  /**
   * Load existing stats from IndexedDB into memory.
   */
  loadFromStats(stats: KeyStat[]): void {
    for (const stat of stats) {
      this.profiles.set(stat.char, {
        char: stat.char,
        language: stat.language,
        totalAttempts: stat.totalAttempts,
        correctAttempts: stat.correctAttempts,
        recentCorrect: new CircularBuffer(
          RECENT_CORRECT_BUFFER_SIZE,
          stat.recentCorrect
        ),
        recentLatencies: new CircularBuffer(
          RECENT_LATENCY_BUFFER_SIZE,
          stat.recentLatencies
        ),
        lastPracticed: stat.lastPracticed,
        confidence: stat.confidence,
        isWeak: stat.isWeak,
        dirty: false,
      });
    }
  }

  /**
   * Record a keystroke and update the profile.
   */
  recordKeystroke(char: string, correct: boolean, latencyMs: number): void {
    let profile = this.profiles.get(char);

    if (!profile) {
      profile = {
        char,
        language: this.language,
        totalAttempts: 0,
        correctAttempts: 0,
        recentCorrect: new CircularBuffer(RECENT_CORRECT_BUFFER_SIZE),
        recentLatencies: new CircularBuffer(RECENT_LATENCY_BUFFER_SIZE),
        lastPracticed: 0,
        confidence: 0,
        isWeak: true,
        dirty: true,
      };
      this.profiles.set(char, profile);
    }

    profile.totalAttempts++;
    if (correct) profile.correctAttempts++;
    profile.recentCorrect.push(correct);
    if (latencyMs > 0) {
      profile.recentLatencies.push(latencyMs);
    }
    profile.lastPracticed = Date.now();
    profile.dirty = true;

    // ── Digraph Recording ──
    const now = Date.now();
    const timeSinceLastChar = now - this.lastCharTime;

    // Only record digraph if:
    // 1. We have a last character
    // 2. Both characters are part of the same flow (latency < 2s)
    // 3. Current character is correct (don't track digraphs for errors)
    if (this.lastChar && timeSinceLastChar < 2000 && correct) {
      const digraph = this.lastChar + char;
      this.recordDigraph(digraph, latencyMs);
    }

    this.lastChar = char;
    this.lastCharTime = now;

    // Recalculate confidence
    this.updateConfidence(profile);

    // Notify listeners
    if (this.onStatsUpdate) {
      this.onStatsUpdate(char, this.toKeyStat(profile));
    }

    // Schedule debounced flush
    this.scheduleFlush();
  }

  /**
   * Internal method to record digraph stats.
   * Digraphs are stored in the same profile map with multi-char keys.
   */
  private recordDigraph(digraph: string, latencyMs: number): void {
    let profile = this.profiles.get(digraph);

    if (!profile) {
      profile = {
        char: digraph,
        language: this.language,
        totalAttempts: 0,
        correctAttempts: 0,
        recentCorrect: new CircularBuffer(RECENT_CORRECT_BUFFER_SIZE),
        recentLatencies: new CircularBuffer(RECENT_LATENCY_BUFFER_SIZE),
        lastPracticed: 0,
        confidence: 0,
        isWeak: true,
        dirty: true,
      };
      this.profiles.set(digraph, profile);
    }

    profile.totalAttempts++;
    profile.correctAttempts++; // We only record digraphs on correct keystrokes
    profile.recentCorrect.push(true);
    if (latencyMs > 0) {
      profile.recentLatencies.push(latencyMs);
    }
    profile.lastPracticed = Date.now();
    profile.dirty = true;

    this.updateConfidence(profile);
  }

  /**
   * Reset the digraph state (e.g., when a session starts or reset).
   */
  resetDigraphState(): void {
    this.lastChar = null;
    this.lastCharTime = 0;
  }

  /**
   * Get the confidence score for a key.
   */
  getConfidence(char: string): number {
    return this.profiles.get(char)?.confidence ?? 0;
  }

  /**
   * Check if a key is weak.
   */
  isKeyWeak(char: string): boolean {
    return this.profiles.get(char)?.isWeak ?? true;
  }

  /**
   * Get all profiles as KeyStat objects (for text generation).
   */
  getAllStats(): KeyStat[] {
    return Array.from(this.profiles.values()).map((p) => this.toKeyStat(p));
  }

  /**
   * Get the N weakest keys.
   */
  getWeakestKeys(n: number = 5): KeyStat[] {
    return this.getAllStats()
      .filter((s) => s.totalAttempts > 0)
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, n);
  }

  /**
   * Get the N slowest digraphs (length > 1).
   */
  getSlowestDigraphs(n: number = 3): KeyStat[] {
    return this.getAllStats()
      .filter((s) => s.char.length > 1 && s.totalAttempts > 0)
      .sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)
      .reverse() // Slowest first (highest latency)
      .slice(0, n);
  }

  /**
   * Get the number of samples recorded for a key.
   */
  getSamples(char: string): number {
    return this.profiles.get(char)?.recentLatencies.getLength() ?? 0;
  }

  /**
   * Check if a key has enough samples to be considered calibrated.
   */
  isCalibrated(char: string): boolean {
    return this.getSamples(char) >= 10; // Basic threshold
  }

  /**
   * Flush dirty profiles to IndexedDB.
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const dirtyStats: KeyStat[] = [];
    for (const profile of this.profiles.values()) {
      if (profile.dirty) {
        dirtyStats.push(this.toKeyStat(profile));
        profile.dirty = false;
      }
    }

    if (dirtyStats.length > 0) {
      await batchSaveKeyStats(dirtyStats);
    }
  }

  /**
   * Clean up timers.
   */
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // ── Private Methods ──

  private updateConfidence(profile: KeyProfileState): void {
    const recentCorrectArr = profile.recentCorrect.getAll();
    const recentLatenciesArr = profile.recentLatencies.getAll();

    // Accuracy: ratio of correct in recent window
    const accuracy =
      recentCorrectArr.length > 0
        ? recentCorrectArr.filter(Boolean).length / recentCorrectArr.length
        : 0;

    // Speed score: 1.0 at SPEED_BEST_MS, 0.0 at SPEED_WORST_MS
    let speedScore = 0;
    if (recentLatenciesArr.length > 0) {
      const avgLatency =
        recentLatenciesArr.reduce((a, b) => a + b, 0) /
        recentLatenciesArr.length;
      speedScore = Math.max(
        0,
        Math.min(
          1,
          (SPEED_WORST_MS - avgLatency) / (SPEED_WORST_MS - SPEED_BEST_MS)
        )
      );
    }

    profile.confidence =
      accuracy * ACCURACY_WEIGHT + speedScore * SPEED_WEIGHT;
    profile.isWeak = profile.confidence < WEAK_KEY_THRESHOLD;
  }

  private toKeyStat(profile: KeyProfileState): KeyStat {
    const recentCorrectArr = profile.recentCorrect.getAll();
    const recentLatenciesArr = profile.recentLatencies.getAll();

    const accuracy =
      recentCorrectArr.length > 0
        ? recentCorrectArr.filter(Boolean).length / recentCorrectArr.length
        : 0;

    const avgLatencyMs =
      recentLatenciesArr.length > 0
        ? recentLatenciesArr.reduce((a, b) => a + b, 0) /
          recentLatenciesArr.length
        : 0;

    return {
      char: profile.char,
      language: profile.language,
      totalAttempts: profile.totalAttempts,
      correctAttempts: profile.correctAttempts,
      accuracy,
      avgLatencyMs,
      recentLatencies: recentLatenciesArr,
      recentCorrect: recentCorrectArr,
      lastPracticed: profile.lastPracticed,
      isWeak: profile.isWeak,
      confidence: profile.confidence,
    };
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return; // Already scheduled
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, IDB_FLUSH_DEBOUNCE_MS);
  }
}
