# VangaTypePanalam Architecture & AI Guide

This document describes the high-level architecture of the VangaTypePanalam typing application and serves as a **context guide for LLMs/AIs** touching this codebase.

## 🤖 Read Me First (For AI Agents)

If you are an AI tasked with modifying this codebase, hold these architectural rules strict:

1. **Offline-First Hybrid**: The application core is strictly offline-first for performance. However, an **Auth.js + Prisma** layer allows users to sign in with GitHub to securely back up their IndexedDB state to a Neon PostgreSQL database.
2. **Zero-Polling Engine**: Do not use `setInterval` or `requestAnimationFrame` loops for the typing core. The engine calculates metrics only on keystrokes.
3. **Seamless Cloud Sync**: Sync happens in the background after session completions. It is "fire-and-forget" to ensure 0ms impact on typing latency.
4. **No UI-Blocking Models**: We use an **Endless Practice** mode with dynamic paragraph regeneration.

---

## 🏗️ Core Application Pillars

### 1. The UI Layer (React / Next.js)
Located in `src/app` and `src/components`.
- **`TopHeader.tsx`**: Navigation + Auth UI. Triggers `requestCloudSync()` on session detection.
- **`TypingArea.tsx`**: High-frequency typing interface.
- **`LeftSidebar.tsx` / `RightSidebar.tsx`**: Dashboard metrics and live analytics.
- **`AuthProvider.tsx`**: Client-side wrapper for Auth.js.

### 2. The Server-Side Layer (Auth.js & Prisma)
Located in `src/auth.ts`, `prisma/`, and `src/app/api`.
- **`Prisma 7`**: Standard ORM using `@prisma/adapter-pg` for Neon PostgreSQL.
- **`CloudBackup` Model**: Serialized IDB blobs store keyStats, sessions, and profile.
- **`/api/sync`**: Secure push/pull endpoints for cloud data.

### 3. The Typing Engine (Vanilla TypeScript)
Located in `src/engine`. Completely decoupled from React for pure speed.
- **`SessionTracker.ts`**: A state machine (`idle` → `ready` → `typing` → `finished`). Passes keystrokes to the KeyProfiler and maintains the session log (WPM, exact latency of every stroke, correctness).
  - *Endless Mode Note*: In practice mode, `finishSegment()` silently saves the session, forces a fresh segment of text, and zeroes out the cursor while keeping aggregate segment numbers moving up.
- **`KeyProfiler.ts`**: Maintains `CircularBuffer` instances for recent correct/error strokes and latencies per key. Computes a "confidence score" (0.0 to 1.0) based on accuracy and speed. Keys are considered "calibrated" once they have 10+ samples collected.
- **`TextGenerator*.ts`**: Consumes confidence scores. Keys with low confidence (< 0.6) are weighted higher in a random selection algorithm when picking words. `TextGeneratorAsync.ts` talks to the `WordCache`.
- **`SoundEngine.ts`**: Uses Web Audio API oscillator/gain nodes for tactile mechanical clicks and error bumps.
- **`gamification.ts`**: The achievement & progression engine. See section 7 below.

### 4. State Management (Zustand)
Located in `src/store`.
- **`useTypingStore.ts`**: Stores the reactive snapshot of `SessionTracker` strictly for UI data binding. Updated only on keystrokes.
- **`useUIStore.ts`**: Manages global preferences (dark mode, language, sound toggle, keyboard visibility).

### 5. Storage & Caching Layer (IndexedDB)
Located in `src/db`. Database Name: `VANGA-typing-db`. Upgraded to Version 2.
- **Stores**:
  - `user-profile`: Settings and level progress.
  - `key-stats`: Granular metrics for 'a', 'b', 'க', etc. Saved frequently.
  - `sessions`: Full logs of completed typing sessions.
  - `lesson-progress`: Unlock state and best scores (1-3 stars) for structured lessons.
  - `word-cache`: *Critical for scale*. Caches massive 1000+ word JSON dictionaries locally with a 30-day TTL.
- **Word Cache API (`wordCache.ts`)**: When text generation asks for words, it checks Memory Map -> IDB -> fetch(`/data/words-lang.json`). Once fetched, it relies on IDB entirely.

### 6. Static Data Definitions
Located in `src/data`.
- **Lessons (`lessons/*.ts`)**: Progressive milestone lists mapping specific letters (e.g., `tamil.ts` introduces "அ, ஆ" mapped to "q, w") with target WPMs.
- **Keyboards (`keyboards/*.ts`)**: Physical mapping arrays that connect `keydown` Event codes to physical UI rendering layout and assigned fingers. 
  - *Pattern Note*: Layout files export `KEY_DATA_BY_KEY` (all keys) and `KEY_TO_FINGER` (typeable keys only) maps for O(1) metadata lookups.
- **Badge SVG Assets (`public/badges/`)**: 15 admin-defined SVG badge icons (64×64, dark-theme optimized). Referenced by path string in the `BADGES` constant.

### 7. Gamification Engine
Located in `src/engine/gamification.ts`. Fully admin-defined — no user-created badges.

- **Ranks**: 6 tiers (Beginner → Master) determined by average WPM. Each has an icon and XP threshold.
- **Badges**: 15 achievement badges with SVG icons in `public/badges/`:
  | Badge | Rarity | Criteria |
  |---|---|---|
  | First Steps | Common | Complete 1 session |
  | Speed Demon | Uncommon | 50 WPM |
  | Sharpshooter | Uncommon | 100% accuracy |
  | On Fire | Rare | 7-day streak |
  | Scholar | Uncommon | 10 lessons |
  | Night Owl | Common | Practice after 10 PM |
  | Early Bird | Common | Practice before 7 AM |
  | Century Club | Epic | 100 WPM |
  | Marathon | Rare | 60 min total |
  | Perfectionist | Rare | 3 stars on 5 lessons |
  | Tamil Typist | Uncommon | 5 Tamil sessions |
  | Word Machine | Rare | 5,000 chars |
  | Comeback King | Uncommon | Return after 7-day gap |
  | Speed Breaker | Rare | 75 WPM |
  | Iron Fingers | Legendary | 30-day streak |

- **Season Challenges**: Monthly rotating challenges (speed, accuracy, streak, or sessions targets). Auto-selected by `getCurrentSeasonChallenge()` based on the current month. Each month maps to a different challenge from the 12-entry `SEASON_CHALLENGES` array.
- **Badge Categories**: `all`, `speed`, `accuracy`, `dedication`, `learning`, `mastery` — used for filtering in the profile UI.
- **XP System**: 1 XP per correct character typed. Used for rank progression display.

### 8. Profile Page Components
Located in `src/components/profile/`.
- **`ProfileCard.tsx`**: Left-column sticky card with avatar (GitHub OAuth or placeholder), rank, XP bar, quick stats grid, and streak display (current + longest ever).
- **`MasteryDonut.tsx`**: SVG donut chart showing key confidence distribution (mastered/learning/weak) — inspired by LeetCode's solved-count chart.
- **`SeasonChallenge.tsx`**: Monthly challenge display with SVG progress ring, locked/completed badge icon, and progress counter.
- **`BadgeCard.tsx`**: Compact ~88px badge cards with SVG icons. Earned badges show checkmarks; locked badges show mini progress bars. Full details revealed via hover tooltip.
- **`BadgeFilter.tsx`**: Category filter tabs for the badge grid.

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
* **Profile (`/stats`)**: LeetCode-inspired 2-column profile page. Left: sticky profile card. Right: mastery donut + season challenge, compact badge grid, activity heatmap with streak stats, key analytics tabs.
