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
import { calculateWPM, calculateRawWPM, calculateAccuracy, calculateKogasa, calculateBurstWPM } from './statsCalculator';
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
  // Calibration status for the current target key
  isCalibrated: boolean;
  samplesCollected: number;
  // Loose mode / Correction status
  errorIndices: number[];
  typedChars: Record<number, string>;
  // Word-based tracking
  words: string[];
  activeWordIndex: number;
  currentWordInput: string;
  wordInputHistory: string[];
  wordCorrectness: Record<number, boolean>;
  // Analytics
  burstHistory: number[];
  consistency: number;
  slowestDigraphs: { char: string; latency: number }[];
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
  private errorIndices: Set<number> = new Set();

  // Word-based tracking
  private words: string[] = [];
  private activeWordIndex: number = 0;
  private currentWordInput: string = '';
  private wordInputHistory: string[] = [];
  private wordCorrectness: Map<number, boolean> = new Map();
  private typedChars: Map<number, string> = new Map();

  // Endless practice tracking
  private segmentsCompleted: number = 0;
  private totalWordsTyped: number = 0;
  private segmentStartCorrectChars: number = 0;
  private segmentStartTime: number = 0;

  // Analytics
  private wordStartTime: number = 0;
  private burstHistory: number[] = []; // Per-word WPMs
  private allLatencies: number[] = []; // All inter-character latencies for Kogasa

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
    this.words = this.text.split(' ');

    // Reset state
    this.sessionId = generateSessionId();
    this.resetSessionState();
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
   * Process a regular character keystroke (not space, not backspace).
   * Returns true if the character was correct, false otherwise.
   */
  processKeystroke(typedChar: string): boolean {
    if (this._state === 'finished') return false;

    // Start timer on first keystroke
    if (this._state === 'ready') {
      this._state = 'typing';
      this.startTime = performance.now();
      this.lastKeystrokeTime = this.startTime;
      this.wordStartTime = this.startTime; // First word starts now
      this.segmentStartTime = this.startTime;
      this.segmentStartCorrectChars = 0;
    }

    const now = performance.now();
    const latency = now - this.lastKeystrokeTime;
    if (latency < IDLE_TIMEOUT_MS) {
      this.allLatencies.push(latency);
    }
    this.lastKeystrokeTime = now;

    // Handle space — completes the current word and advances
    if (typedChar === ' ') {
      return this.processSpace(now, latency);
    }

    const currentWord = this.words[this.activeWordIndex] ?? '';
    const charIndex = this.currentWordInput.length;
    const expectedChar = currentWord[charIndex];
    // If typing beyond the word length, it's always an error (extra char)
    const isExtra = charIndex >= currentWord.length;
    const correct = !isExtra && typedChar === expectedChar;

    this.totalKeystrokes++;
    this.currentWordInput += typedChar;

    // Record in key profiler (skip idle latencies)
    const effectiveLatency = latency > IDLE_TIMEOUT_MS ? 0 : latency;
    if (effectiveLatency > 0 && expectedChar) {
      this.keyProfiler.recordKeystroke(expectedChar, correct, effectiveLatency);
    }

    // Record in keystroke log
    this.keystrokeLog.push({
      char: expectedChar ?? typedChar,
      correct,
      latencyMs: Math.round(effectiveLatency),
    });

    // Track character-level correctness
    this.typedChars.set(this.cursorPosition, typedChar);
    if (correct) {
      if (!this.errorIndices.has(this.cursorPosition)) {
        this.correctChars++;
      }
    } else {
      if (!this.errorIndices.has(this.cursorPosition)) {
        this.errorChars++;
        this.errorIndices.add(this.cursorPosition);
      }
    }

    this.cursorPosition++;

    this.emitSnapshot();
    return correct;
  }

  /**
   * Process space key — completes the current word and advances to the next.
   */
  private processSpace(now: number, latency: number): boolean {
    const currentWord = this.words[this.activeWordIndex] ?? '';

    // Don't allow space if nothing typed yet for this word
    if (this.currentWordInput.length === 0) {
      return false;
    }

    this.totalKeystrokes++;

    // Record space in key profiler
    const effectiveLatency = latency > IDLE_TIMEOUT_MS ? 0 : latency;
    if (effectiveLatency > 0) {
      this.keyProfiler.recordKeystroke(' ', true, effectiveLatency);
    }

    // Determine if the word was typed correctly
    const wordCorrect = this.currentWordInput === currentWord;
    this.wordCorrectness.set(this.activeWordIndex, wordCorrect);

    // Calculate Burst WPM for this word
    const wordEndTime = now;
    const durationMs = wordEndTime - this.wordStartTime;
    const burstWpm = calculateBurstWPM(this.currentWordInput.length + 1, durationMs); // +1 for the space
    this.burstHistory.push(burstWpm);

    // Push completed word input to history
    this.wordInputHistory.push(this.currentWordInput);
    this.totalWordsTyped++;
    this.currentWordInput = '';
    this.activeWordIndex++;

    // Advance cursor past the space character in the full text
    // Calculate cursor position: sum of all completed words + spaces
    this.cursorPosition = this.calculateCursorPosition();

    // Check if all words are completed
    if (this.activeWordIndex >= this.words.length) {
      void this.finishSegment();
      return wordCorrect;
    }

    this.emitSnapshot();
    return wordCorrect;
  }

  /**
   * Calculate the absolute cursor position from word-level state.
   */
  private calculateCursorPosition(): number {
    let pos = 0;
    for (let i = 0; i < this.activeWordIndex; i++) {
      pos += (this.words[i]?.length ?? 0) + 1; // +1 for space
    }
    pos += this.currentWordInput.length;
    return pos;
  }

  /**
   * Move the cursor back by one position within the current word.
   * Does NOT cross word boundaries (Monkeytype behavior).
   */
  backspace(): void {
    if (this._state === 'finished') return;
    // Don't backspace past the start of the current word
    if (this.currentWordInput.length === 0) return;

    // Remove the last character from current word input
    this.currentWordInput = this.currentWordInput.slice(0, -1);
    this.cursorPosition = this.calculateCursorPosition();

    // Adjust correct/error counts for the position we're removing
    const wasError = this.errorIndices.has(this.cursorPosition);
    if (wasError) {
      this.errorChars = Math.max(0, this.errorChars - 1);
      this.errorIndices.delete(this.cursorPosition);
    } else {
      this.correctChars = Math.max(0, this.correctChars - 1);
    }

    this.typedChars.delete(this.cursorPosition);
    this.emitSnapshot();
  }

  /**
   * Delete the entire current word input (Ctrl+Backspace).
   */
  backspaceWord(): void {
    if (this._state === 'finished') return;
    if (this.currentWordInput.length === 0) return;

    // Remove all characters of the current word input
    const charsToRemove = this.currentWordInput.length;
    for (let i = 0; i < charsToRemove; i++) {
      const pos = this.cursorPosition - 1 - i;
      const wasError = this.errorIndices.has(pos);
      if (wasError) {
        this.errorChars = Math.max(0, this.errorChars - 1);
        this.errorIndices.delete(pos);
      } else {
        this.correctChars = Math.max(0, this.correctChars - 1);
      }
      this.typedChars.delete(pos);
    }

    this.currentWordInput = '';
    this.cursorPosition = this.calculateCursorPosition();
    this.emitSnapshot();
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

    // Determine the current expected character for calibration info
    const currentWord = this.words[this.activeWordIndex] ?? '';
    const charIdx = this.currentWordInput.length;
    const currentExpectedChar = charIdx < currentWord.length ? currentWord[charIdx] : null;

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
      isCalibrated: currentExpectedChar
        ? this.keyProfiler.isCalibrated(currentExpectedChar)
        : true,
      samplesCollected: currentExpectedChar
        ? this.keyProfiler.getSamples(currentExpectedChar)
        : 0,
      errorIndices: Array.from(this.errorIndices),
      typedChars: Object.fromEntries(this.typedChars),
      // Word-based tracking
      words: this.words,
      activeWordIndex: this.activeWordIndex,
      currentWordInput: this.currentWordInput,
      wordInputHistory: [...this.wordInputHistory],
      wordCorrectness: Object.fromEntries(this.wordCorrectness),
      burstHistory: [...this.burstHistory],
      consistency: calculateKogasa(this.allLatencies),
      slowestDigraphs: this.keyProfiler.getSlowestDigraphs(3).map(s => ({
        char: s.char,
        latency: Math.round(s.avgLatencyMs)
      })),
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
    this.resetSessionState();
    this._state = 'ready';
    this.emitSnapshot();
  }

  /**
   * Internal common reset for state variables.
   */
  private resetSessionState(): void {
    this.cursorPosition = 0;
    this.correctChars = 0;
    this.errorChars = 0;
    this.totalKeystrokes = 0;
    this.keystrokeLog = [];
    this.startTime = 0;
    this.lastKeystrokeTime = 0;
    this.errorIndices.clear();
    this.typedChars.clear();
    this.activeWordIndex = 0;
    this.currentWordInput = '';
    this.wordInputHistory = [];
    this.wordCorrectness.clear();
    this.wordStartTime = 0;
    this.burstHistory = [];
    this.allLatencies = [];
    this.keyProfiler.resetDigraphState();

    // Reset cumulative practice trackers ONLY if not in practice-segment loop
    // Note: segmentsCompleted and totalWordsTyped are handled by finishSegment()
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
    // Words are already counted in processSpace, no additional counting needed here
    // for seamless practice flow.

    if (this.mode === 'practice') {
      // ── Practice mode: save session silently, then do a full fresh restart ──
      this.segmentsCompleted++;
      this.onSegmentComplete?.(this.segmentsCompleted);

      // Save the completed session silently (fire-and-forget)
      this.saveSegmentAsync();

      // Preserve cumulative counters across restarts
      const savedSegments = this.segmentsCompleted;
      const savedTotalWords = this.totalWordsTyped;

      // Generate completely fresh text
      this.text = await this.generateNextText();
      this.words = this.text.split(' ');

      // Reset state using consolidated method
      this.sessionId = generateSessionId();
      this.resetSessionState();
      this._state = 'ready';

      // Restore cumulative counters
      this.segmentsCompleted = savedSegments;
      this.totalWordsTyped = savedTotalWords;
      this.segmentStartCorrectChars = 0;
      this.segmentStartTime = 0;
      this.emitSnapshot();

    } else if (this.mode === 'test') {
      // ── Test mode: continue into a fresh chunk while preserving total session stats ──
      const savedStartTime = this.startTime;
      const savedLastKeystrokeTime = this.lastKeystrokeTime;
      const savedCorrectChars = this.correctChars;
      const savedErrorChars = this.errorChars;
      const savedTotalKeystrokes = this.totalKeystrokes;
      const savedKeystrokeLog = [...this.keystrokeLog];
      const savedBurstHistory = [...this.burstHistory];
      const savedAllLatencies = [...this.allLatencies];
      const savedSegments = this.segmentsCompleted;
      const savedTotalWords = this.totalWordsTyped;

      this.text = await this.generateNextText();
      this.words = this.text.split(' ');

      this.sessionId = generateSessionId();
      this.resetSessionState();

      this.startTime = savedStartTime;
      this.lastKeystrokeTime = savedLastKeystrokeTime;
      this.correctChars = savedCorrectChars;
      this.errorChars = savedErrorChars;
      this.totalKeystrokes = savedTotalKeystrokes;
      this.keystrokeLog = savedKeystrokeLog;
      this.burstHistory = savedBurstHistory;
      this.allLatencies = savedAllLatencies;
      this.segmentsCompleted = savedSegments;
      this.totalWordsTyped = savedTotalWords;
      this.segmentStartCorrectChars = savedCorrectChars;
      this.segmentStartTime = performance.now();
      this.wordStartTime = performance.now();
      this.lastKeystrokeTime = performance.now();
      this._state = savedStartTime > 0 ? 'typing' : 'ready';
      this.emitSnapshot();

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
    ]).catch(() => { }); // Silently swallow errors — non-critical
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
