# Changelog

All notable changes to **VangaTypePanalam** will be documented in this file.

## [0.3.3] - 2026-04-22

### Fixed
- **Tamil99 Layout**: Added missing `Backspace` key and fixed incorrect row index comments.
- **Syntax Error**: Fixed a syntax error in `tamil99.ts` where the file ended with a colon instead of a semicolon.

### Improved
- **Keyboard Data Ergonomics**: Unified the lookup pattern across `qwerty.ts` and `tamil99.ts` by adding `KEY_DATA_BY_KEY` and `KEY_TO_FINGER` maps. This allows components to look up both typeable and modifier key metadata efficiently.
- **Performance Optimization**: Refactored `getFingerColor` in `qwerty.ts` to use a precomputed map lookup instead of a switch statement, reducing overhead during high-frequency renders.
- **Code Quality**: Unified map population logic in keyboard data files into a single loop pass.

## [0.3.2] - 2026-04-20

### Changed
- **Navigation Restructure**: Removed hamburger menu and mobile dropdown. Nav items now display icons only on very small screens (<640px), matching the style of other control icons.
- **Header Theme Response**: Header now responds to theme toggle (dark/light mode) instead of being hardcoded to dark theme.
- **License Update**: Changed license from MIT to **GNU General Public License v3.0**.

### Added
- **CONTRIBUTING.md**: Created contribution guide with development setup, coding conventions, and PR checklist.
- **Documentation Reference**: Updated to reference AGENTS.md and ARCHITECTURE.md for AI agents and developers.

## [0.3.1] - 2026-04-20

### Improved
- **Monkeytype-Style Navigation**: Redesigned the top header from icon+text pill-style nav to a clean, minimalist text-only navigation with a gold underline active indicator.
- **Hybrid Controls**: Moved sound, keyboard visibility, caret settings, and auth into a unified Settings dropdown. Kept language and theme toggle visible on the header.
- **Reduced Header Height**: Slimmed the header from 80px to 56px for a sleeker, more focused typing experience.

### Fixed
- **CSS Bug**: Removed orphan `background-clip: text;` rule that sat outside any selector in TopHeader.tsx.

## [0.3.0] - 2026-04-19

### Added
- **Authentication (Auth.js)**: Integrated GitHub OAuth support with a new "Sign In" pill in the header.
- **Cloud Synchronization**: Implemented a hybrid background sync engine that securely mirrors local `IndexedDB` progress to a Neon PostgreSQL database.
- **Serverless Data API**: Added Prisma 7 with a scalable serverless adapter for managing cloud backups.
- **Project Documentation**: Added a comprehensive `DEPLOYMENT.md` guide for Vercel and a `CHECKLIST.md` for launch readiness.

### Updated
- **Hybrid Architecture**: Transitioned project from purely offline-first to an **Offline-First Hybrid** model.
- **Next.js Infrastructure**: Optimized build settings for Vercel compatibility with automated Prisma Client generation.

### Fixed
- **Practice Mode Live Analytics**: Changed practice mode segment completion logic so "Live Analytics" statistics correctly accumulate and carry over continuously and no longer reset on new paragraph generation.
- **Console Warnings**: Resolved `scroll-behavior: smooth` hydration warnings on document element, and generated placeholder manifest icons for PWA configuration to prevent 404 console errors.
- **Practice Segment Auto-Advance**: Ensured endless practice immediately publishes the next generated paragraph after a segment completes, so practice no longer appears to stop at the paragraph boundary.
- **Timed Test Segment Auto-Advance**: Updated timed test mode to roll into the next generated chunk instead of stalling at the end of a paragraph, while keeping the overall timer session intact.
- **Typing Handler Stale Closures**: Fixed memo dependencies in `TypingArea` keyboard/input handlers so error mode and keystroke validation update reliably after state changes.
- **Word Count Tracking**: Fixed `SessionTracker.totalWordsTyped` so it increments on each completed word.
- **Tamil99 Virtual Keyboard Coverage**: Added missing number row and shift labels in Tamil99 layout data to prevent incomplete keyboard rendering.
- **Consistency Metric Styling**: Added the missing `.metric-consistency` style used by `TypingArea` metrics panel.
- **Text Generator Cleanup**: Removed leftover typo alias (`WeI`) and wired `MAX_WEAK_KEYS_FOCUS` into weak digraph selection.

### Improved
- **Global Rename**: Performed global codebase replacement renaming the application properly to `VangaTypePanalam`.
- **Header Button UI**: Upgraded top navigation links to gamified pill designs with clear icon/text spacing, distinct backgrounds, and responsive hover transitions for a cleaner premium feel.

### Improved
- **Metrics UI Refresh**: Replaced dense metrics text wall with card-based metrics (WPM ring, accuracy progress, consistency, streak) and a compact secondary strip for current key, daily goal, and key hints.
- **Sidebar Settings Drawer**: Added interactive sidebar settings controls for error mode, caret style, caret speed, sound, and virtual keyboard visibility.
- **Typing Readability**: Increased typing text scale and line-height for easier scanning during high-speed practice.
- **Theme Token Coverage**: Added `--overlay-scrim` token and applied it to results overlay for better dark/light consistency.
- **Practice View Fit**: Tightened practice page spacing and keyboard scaling so top metrics, typing area, and virtual keyboard fit in a single viewport more like Keybr.
- **Settings Simplification**: Removed Keys strip box from metrics HUD, removed Error Mode control from sidebar settings, and limited caret style options to Line/Outline.
- **Sidebar Scrollability**: Enabled vertical scrolling in the expanded sidebar so settings and links remain reachable on shorter screens.

## [0.2.1] - 2026-04-15

### Fixed
- **Calibration Confidence Display**: Corrected confidence percentage math in `TypingArea` so calibrated confidence now renders accurately (e.g., 84% instead of 0%-1% misreports).
- **Timer Cleanup Safety**: Added cleanup for idle and segment-flash timers on unmount/effect teardown to avoid stale timeout callbacks.
- **Focus Prompt Accuracy**: Updated idle overlay prompt copy to match actual interaction behavior.

### Improved
- **Idle Metrics Query Efficiency**: Added an indexed sessions query helper (`getSessionsSince`) and switched idle daily-goal refreshes to query only today's sessions, while keeping global averages refreshed on first load and session completion.
- **Segment Completion Feedback**: Wired `segmentFlash` state to the metrics panel visual style so segment completion feedback is now visible.

## [0.2.0] - 2026-04-13

### Added
- **Calibration Engine**: Implemented real-time per-key calibration tracking. Keys now require 10 samples to be considered "calibrated."
- **Current Error Highlighting**: Corrected immediate feedback loop where characters now turn red instantly upon an incorrect keystroke.
- **Documentation Center**: Added an in-app docs section covering Architecture and Changelog.
- **Local Date Sensitivity**: Replaced UTC date tracking with local date strings for 100% accurate daily activity heatmaps across timezones.

### Fixed
- **High-Speed Input Race Condition**: Optimized event handling for >120 WPM typists by deduplicating `keydown` and `onInput` events.
- **Dueling Event Handlers**: Implemented a processing lock to prevent "double-hit" errors.
- **Sound Engine Lag**: Eliminated `async/await` micro-delays in the typing loop by pre-loading procedural audio.
- **Daily Goal Refresh**: Fixed progress bar in endless practice mode to update after every segment completion.

### Improved
- **Metrics Precision**: Upped accuracy display to 1 decimal place (e.g., 99.8%).
- **UI Metrics**: Replaced redundant metrics in parentheses with compare-to-global-average stats.

## [0.1.0] - 2026-04-12

### Added
- **Initial Core**: English (QWERTY), Tamil (Tamil99), and Tanglish typing support.
- **Adaptive Text Generator**: Weighted words based on individual character confidence.
- **Offline Storage**: Full IndexedDB integration for sessions, keys, and profiles.
- **Daily Activity Heatmap**: GitHub-style grid for tracking practice streaks.
- **Virtual Keyboard**: Finger-coded mappings and visual press feedback.
- **Lessons System**: 30 levels of progressive touch typing mastery.
