# VaagaTypePanalam Architecture & AI Guide

This document describes the high-level architecture of the VaagaTypePanalam typing application and serves as a **context guide for LLMs/AIs** touching this codebase.

## 🤖 Read Me First (For AI Agents)

If you are an AI tasked with modifying this codebase, hold these architectural rules strict:

1. **Strictly Offline-First**: Do not introduce server-side PostgreSQL/MongoDB/Firebase databases or Prisma schemas. All persistent state lives entirely in the browser using IndexedDB (via the `idb` library in `src/db`).
2. **Zero-Polling Engine**: Do not use `setInterval` or `requestAnimationFrame` loops for the typing core. The engine calculates WPM and state only when a keystroke occurs to drastically save CPU/battery.
3. **No UI-Blocking Models in Practice Mode**: We use an **Endless Practice** mode. We do NOT show locking modals when a segment finishes; instead, we do a silent background save and dynamically regenerate fresh text for continuous typing flow.
4. **Bundle Size Sensitivity**: Do not use heavy audio files or unoptimized JSON files synchronously. Sound is generated procedurally (Web Audio API), and massive word banks are lazy-loaded once and cached in IDB.

---

## 🏗️ Core Application Pillars

### 1. The UI Layer (React / Next.js)
Located in `src/app` and `src/components`.
- **`TypingArea.tsx`**: The nervous system. It intercepts keyboard events, holds a `SessionTracker` instance, and renders the text with correct/error highlights.
- **`VirtualKeyboard.tsx`**: A visual aid mapping keys to fingers. Uses `qwerty.ts` and `tamil99.ts` definitions.
- **`Sidebar.tsx`**: Left rail navigation containing Practice, Test, Lessons, and Profile, along with quick toggles (Language, Sound).

### 2. The Typing Engine (Vanilla TypeScript)
Located in `src/engine`. Completely decoupled from React for pure speed.
- **`SessionTracker.ts`**: A state machine (`idle` → `ready` → `typing` → `finished`). Passes keystrokes to the KeyProfiler and maintains the session log (WPM, exact latency of every stroke, correctness).
  - *Endless Mode Note*: In practice mode, `finishSegment()` silently saves the session, forces a fresh segment of text, and zeroes out the cursor while keeping aggregate segment numbers moving up.
- **`KeyProfiler.ts`**: Maintains `CircularBuffer` instances for recent correct/error strokes and latencies per key. Computes a "confidence score" (0.0 to 1.0) based on accuracy and speed.
- **`TextGenerator*.ts`**: Consumes confidence scores. Keys with low confidence (< 0.6) are weighted higher in a random selection algorithm when picking words. `TextGeneratorAsync.ts` talks to the `WordCache`.
- **`SoundEngine.ts`**: Uses Web Audio API oscillator/gain nodes for tactile mechanical clicks and error bumps.

### 3. State Management (Zustand)
Located in `src/store`.
- **`useTypingStore.ts`**: Stores the reactive snapshot of `SessionTracker` strictly for UI data binding. Updated only on keystrokes.
- **`useUIStore.ts`**: Manages global preferences (dark mode, language, sound toggle, keyboard visibility).

### 4. Storage & Caching Layer (IndexedDB)
Located in `src/db`. Database Name: `vaaga-typing-db`. Upgraded to Version 2.
- **Stores**:
  - `user-profile`: Settings and level progress.
  - `key-stats`: Granular metrics for 'a', 'b', 'க', etc. Saved frequently.
  - `sessions`: Full logs of completed typing sessions.
  - `lesson-progress`: Unlock state and best scores (1-3 stars) for structured lessons.
  - `word-cache`: *Critical for scale*. Caches massive 1000+ word JSON dictionaries locally with a 30-day TTL.
- **Word Cache API (`wordCache.ts`)**: When text generation asks for words, it checks Memory Map -> IDB -> fetch(`/data/words-lang.json`). Once fetched, it relies on IDB entirely.

### 5. Static Data Definitions
Located in `src/data`.
- **Lessons (`lessons/*.ts`)**: Progressive milestone lists mapping specific letters (e.g., `tamil.ts` introduces "அ, ஆ" mapped to "q, w") with target WPMs.
- **Keyboards (`keyboards/*.ts`)**: Physical mapping arrays that connect `keydown` Event codes to physical UI rendering layout and assigned fingers.

---

## 🚦 Interaction Flows

### How Typing Happens (Data Flow)
1. User presses a key.
2. `TypingArea` intercepts `keydown`, prevents default, calls `trackerRef.current.processKeystroke(char)`.
3. `SessionTracker` compares the char with expected text, notes the exact latency in ms, and passes to `KeyProfiler.recordKeystroke()`.
4. `KeyProfiler` recalculates that specific key's confidence score and debounces a background IDB save.
5. `SessionTracker` increments total correct/errors, calculates instant WPM, and emits a snapshot.
6. `TypingArea` receives snapshot, updates `useTypingStore`; React surgically re-renders the text span.

### Modes Supported
* **Practice (`/practice`)**: Endless flow. Custom text allowed via toggle. Regenerates standard active weak-key text indefinitely.
* **Timed Test (`/test`)**: Hard cut-off at 15/30/60/120 seconds. Shows interactive countdown ring and produces a final copyable scorecard.
* **Lessons (`/lessons`)**: Structured progression map to teach users touch typing (especially for Tamil99 layout). Shows 1 to 3 Star mastery ratings based on Target WPM + Accuracy.
