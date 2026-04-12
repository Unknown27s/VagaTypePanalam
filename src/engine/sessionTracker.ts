/**
 * VaagaTypePanalam — Session Tracker
 *
 * State machine that manages an active typing session.
 * Coordinates between KeyProfiler, StatsCalculator, and IndexedDB.
 *
 * In 'practice' mode: endless — silently chains new text segments
 * instead of transitioning to 'finished'.
 */

import { KeyProfiler } from './keyProfiler';
import { calculateWPM, calculateRawWPM, calculateAccuracy } from './statsCalculator';
import { generateAdaptiveText, generateLessonText } from './textGenerator';
import { saveSession, generateSessionId } from '@/db/sessions';
import { recordSessionInProfile } from '@/db/profile';
import { getKeyStatsByLanguage } from '@/db/keyStats';
import type { Language, Session, SessionMode, KeystrokeRecord } from '@/db/schema';
import {
  IDLE_TIMEOUT_MS,
  MIN_SESSION_CHARS,
  PRACTICE_SEGMENT_LENGTH,
  MAX_TEXT_BUFFER,
} from './constants';

export type SessionState = 'idle' | 'ready' | 'typing' | 'finished';

export interface SessionSnapshot {
  state: SessionState;
  text: string;
  cursorPosition: number;
  correctChars: number;
  errorChars: number;
  totalKeystrokes: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  elapsedMs: number;
  isComplete: boolean;
  // Endless practice extras
  segmentsCompleted: number;
  totalWordsTyped: number;
}

export class SessionTracker {
  // Session identity
  private sessionId: string = '';
  private language: Language;
  private mode: SessionMode;
  private level: number;

  // State
  private _state: SessionState = 'idle';
  private text: string = '';
  private cursorPosition: number = 0;
  private correctChars: number = 0;
  private errorChars: number = 0;
  private totalKeystrokes: number = 0;
  private keystrokeLog: KeystrokeRecord[] = [];

  // Endless practice tracking
  private segmentsCompleted: number = 0;
  private totalWordsTyped: number = 0;
  private segmentStartCorrectChars: number = 0;
  private segmentStartTime: number = 0;

  // Target keys (for lesson mode)
  private targetKeys: string[] = [];
  private customText: string | undefined;

  // Timing
  private startTime: number = 0;
  private lastKeystrokeTime: number = 0;

  // Components
  private keyProfiler: KeyProfiler;

  // Callbacks
  private onStateChange?: (snapshot: SessionSnapshot) => void;
  private onComplete?: (session: Session) => void;
  private onSegmentComplete?: (segmentNumber: number) => void;

  constructor(language: Language, mode: SessionMode = 'practice', level: number = 1) {
    this.language = language;
    this.mode = mode;
    this.level = level;
    this.keyProfiler = new KeyProfiler(language);
  }

  /**
   * Set callbacks.
   */
  setCallbacks(callbacks: {
    onStateChange?: (snapshot: SessionSnapshot) => void;
    onComplete?: (session: Session) => void;
    onSegmentComplete?: (segmentNumber: number) => void;
  }): void {
    this.onStateChange = callbacks.onStateChange;
    this.onComplete = callbacks.onComplete;
    this.onSegmentComplete = callbacks.onSegmentComplete;
  }

  /**
   * Initialize a new session with generated text.
   */
  async init(targetKeys?: string[], customText?: string): Promise<string> {
    // Load existing key stats
    const stats = await getKeyStatsByLanguage(this.language);
    this.keyProfiler.loadFromStats(stats);

    this.targetKeys = targetKeys ?? [];
    this.customText = customText;

    // Generate or use provided text
    this.text = await this.generateNextText();

    // Reset state
    this.sessionId = generateSessionId();
    this.cursorPosition = 0;
    this.correctChars = 0;
    this.errorChars = 0;
    this.totalKeystrokes = 0;
    this.keystrokeLog = [];
    this.startTime = 0;
    this.lastKeystrokeTime = 0;
    this.segmentsCompleted = 0;
    this.totalWordsTyped = 0;
    this.segmentStartCorrectChars = 0;
    this.segmentStartTime = 0;
    this._state = 'ready';

    this.emitSnapshot();
    return this.text;
  }

  /**
   * Generate the next chunk of text.
   */
  private async generateNextText(length: number = PRACTICE_SEGMENT_LENGTH): Promise<string> {
    if (this.customText) {
      return this.customText;
    }
    if (this.targetKeys.length > 0) {
      return generateLessonText(this.language, this.targetKeys);
    }

    // Try lazy-loaded word cache first, fall back to static
    try {
      const { generateAdaptiveTextAsync } = await import('./textGeneratorAsync');
      const stats = this.keyProfiler.getAllStats();
      const unlockedKeys = this.getDefaultUnlockedKeys();
      return await generateAdaptiveTextAsync(this.language, stats, unlockedKeys, length);
    } catch {
      const stats = this.keyProfiler.getAllStats();
      const unlockedKeys = this.getDefaultUnlockedKeys();
      return generateAdaptiveText(this.language, stats, unlockedKeys, length);
    }
  }

  /**
   * Process a keystroke.
   * Returns true if the character was correct, false otherwise.
   */
  processKeystroke(typedChar: string): boolean {
    if (this._state === 'finished') return false;

    // Start timer on first keystroke
    if (this._state === 'ready') {
      this._state = 'typing';
      this.startTime = performance.now();
      this.lastKeystrokeTime = this.startTime;
      this.segmentStartTime = this.startTime;
      this.segmentStartCorrectChars = 0;
    }

    const now = performance.now();
    const latency = now - this.lastKeystrokeTime;
    this.lastKeystrokeTime = now;

    const expectedChar = this.text[this.cursorPosition];
    const correct = typedChar === expectedChar;

    this.totalKeystrokes++;

    // Record in key profiler (skip idle latencies)
    const effectiveLatency = latency > IDLE_TIMEOUT_MS ? 0 : latency;
    if (effectiveLatency > 0) {
      this.keyProfiler.recordKeystroke(expectedChar, correct, effectiveLatency);
    }

    // Record in keystroke log
    this.keystrokeLog.push({
      char: expectedChar,
      correct,
      latencyMs: Math.round(effectiveLatency),
    });

    if (correct) {
      this.correctChars++;
      this.cursorPosition++;

      // Check if current text segment is complete
      if (this.cursorPosition >= this.text.length) {
        this.finishSegment();
      }
    } else {
      this.errorChars++;
    }

    this.emitSnapshot();
    return correct;
  }

  /**
   * Get current snapshot of the session state.
   */
  getSnapshot(): SessionSnapshot {
    const elapsedMs =
      this._state === 'typing' || this._state === 'finished'
        ? this.startTime > 0
          ? performance.now() - this.startTime
          : 0
        : 0;

    return {
      state: this._state,
      text: this.text,
      cursorPosition: this.cursorPosition,
      correctChars: this.correctChars,
      errorChars: this.errorChars,
      totalKeystrokes: this.totalKeystrokes,
      wpm: calculateWPM(this.correctChars, elapsedMs),
      rawWpm: calculateRawWPM(this.totalKeystrokes, elapsedMs),
      accuracy: calculateAccuracy(this.correctChars, this.totalKeystrokes),
      elapsedMs,
      isComplete: this._state === 'finished',
      segmentsCompleted: this.segmentsCompleted,
      totalWordsTyped: this.totalWordsTyped,
    };
  }

  /**
   * Get the current state.
   */
  get state(): SessionState {
    return this._state;
  }

  /**
   * Get the current text.
   */
  getText(): string {
    return this.text;
  }

  /**
   * Get current WPM (calculated on demand — no timers).
   */
  getCurrentWPM(): number {
    if (this._state !== 'typing') return 0;
    const elapsed = performance.now() - this.startTime;
    return calculateWPM(this.correctChars, elapsed);
  }

  /**
   * Reset the session (for retrying same text).
   */
  reset(): void {
    this.cursorPosition = 0;
    this.correctChars = 0;
    this.errorChars = 0;
    this.totalKeystrokes = 0;
    this.keystrokeLog = [];
    this.startTime = 0;
    this.lastKeystrokeTime = 0;
    this.segmentsCompleted = 0;
    this.totalWordsTyped = 0;
    this._state = 'ready';
    this.emitSnapshot();
  }

  /**
   * Clean up resources.
   */
  async destroy(): Promise<void> {
    await this.keyProfiler.flush();
    this.keyProfiler.destroy();
  }

  /**
   * Get the key profiler for stat queries.
   */
  getKeyProfiler(): KeyProfiler {
    return this.keyProfiler;
  }

  // ── Private Methods ──

  /**
   * Called when cursor reaches end of current text.
   * In practice mode: extend seamlessly.
   * In lesson/test mode: finish the session.
   */
  private async finishSegment(): Promise<void> {
    // Count words typed in this segment
    const segmentText = this.text.slice(
      Math.max(0, this.cursorPosition - (this.correctChars - this.segmentStartCorrectChars))
    );
    this.totalWordsTyped += segmentText.trim().split(/\s+/).length;

    if (this.mode === 'practice') {
      // ── Practice mode: save session silently, then do a full fresh restart ──
      this.segmentsCompleted++;
      this.onSegmentComplete?.(this.segmentsCompleted);

      // Save the completed session silently (fire-and-forget)
      this.saveSegmentAsync();

      // Preserve cumulative counters across restarts
      const savedSegments = this.segmentsCompleted;
      const savedWords = this.totalWordsTyped;

      // Generate completely fresh text
      this.text = await this.generateNextText();

      // Reset cursor and per-session counters for a clean slate
      this.sessionId = generateSessionId();
      this.cursorPosition = 0;
      this.correctChars = 0;
      this.errorChars = 0;
      this.totalKeystrokes = 0;
      this.keystrokeLog = [];
      this.startTime = 0;
      this.lastKeystrokeTime = 0;
      this._state = 'ready';

      // Restore cumulative counters
      this.segmentsCompleted = savedSegments;
      this.totalWordsTyped = savedWords;
      this.segmentStartCorrectChars = 0;
      this.segmentStartTime = 0;

    } else if (this.mode === 'test') {
      // ── Test mode: refresh text completely but PRESERVE all cumulative test counters ──
      this.text = await this.generateNextText();
      this.cursorPosition = 0;

    } else {
      // ── Lesson mode: finish automatically at end of text ──
      await this.finish();
    }
  }

  /**
   * Force the session to finish immediately (e.g. timeout in test mode).
   */
  public async forceFinish(): Promise<void> {
    if (this._state === 'typing') {
      await this.finish();
    }
  }

  private async finish(): Promise<void> {
    this._state = 'finished';
    const endTime = performance.now();
    const durationMs = endTime - this.startTime;

    // Flush key stats to IDB
    await this.keyProfiler.flush();

    // Build session record
    const session: Session = {
      id: this.sessionId,
      language: this.language,
      mode: this.mode,
      startedAt: Date.now() - Math.round(durationMs),
      endedAt: Date.now(),
      durationMs: Math.round(durationMs),
      wpm: calculateWPM(this.correctChars, durationMs),
      rawWpm: calculateRawWPM(this.totalKeystrokes, durationMs),
      accuracy: calculateAccuracy(this.correctChars, this.totalKeystrokes),
      totalChars: this.text.length,
      correctChars: this.correctChars,
      errorChars: this.errorChars,
      text: this.text,
      keystrokeLog: this.keystrokeLog,
      synced: false,
      level: this.level,
    };

    // Only save if meaningful session
    if (this.totalKeystrokes >= MIN_SESSION_CHARS) {
      await saveSession(session);
      await recordSessionInProfile(session.durationMs, session.wpm);
    }

    this.onComplete?.(session);
    this.emitSnapshot();
  }

  /**
   * Fire-and-forget segment save for endless practice mode.
   */
  private saveSegmentAsync(): void {
    const elapsed = performance.now() - this.segmentStartTime;
    const segmentCorrect = this.correctChars - this.segmentStartCorrectChars;
    if (segmentCorrect < MIN_SESSION_CHARS) return;

    const session: Session = {
      id: generateSessionId(),
      language: this.language,
      mode: this.mode,
      startedAt: Date.now() - Math.round(elapsed),
      endedAt: Date.now(),
      durationMs: Math.round(elapsed),
      wpm: calculateWPM(segmentCorrect, elapsed),
      rawWpm: calculateRawWPM(this.totalKeystrokes, performance.now() - this.startTime),
      accuracy: calculateAccuracy(this.correctChars, this.totalKeystrokes),
      totalChars: segmentCorrect,
      correctChars: segmentCorrect,
      errorChars: this.errorChars,
      text: this.text.slice(Math.max(0, this.cursorPosition - segmentCorrect), this.cursorPosition),
      keystrokeLog: [],
      synced: false,
      level: this.level,
    };

    Promise.all([
      saveSession(session),
      recordSessionInProfile(session.durationMs, session.wpm),
    ]).catch(() => {}); // Silently swallow errors — non-critical
  }

  private emitSnapshot(): void {
    this.onStateChange?.(this.getSnapshot());
  }

  private getDefaultUnlockedKeys(): string[] {
    if (this.language === 'en' || this.language === 'tanglish') {
      return 'abcdefghijklmnopqrstuvwxyz'.split('');
    }
    return ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ',
            'க', 'ச', 'ட', 'த', 'ப', 'ற', 'ன', 'ம', 'ங', 'ஞ', 'ண', 'ந',
            'ய', 'ர', 'ல', 'வ', 'ழ', 'ள'];
  }
}
