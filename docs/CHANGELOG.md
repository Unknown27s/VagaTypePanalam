# Changelog

All notable changes to **VaagaTypePanalam** will be documented in this file.

## [Unreleased]

### Fixed
- **Practice Segment Auto-Advance**: Ensured endless practice immediately publishes the next generated paragraph after a segment completes, so practice no longer appears to stop at the paragraph boundary.
- **Timed Test Segment Auto-Advance**: Updated timed test mode to roll into the next generated chunk instead of stalling at the end of a paragraph, while keeping the overall timer session intact.

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
