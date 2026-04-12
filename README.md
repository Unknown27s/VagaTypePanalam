# VaagaTypePanalam ⌨️

> வாகை டைப் பணாலம் — Learn Typing in English, Tamil & Tanglish

A **free, adaptive, offline-first** typing practice web app inspired by [Keybr](https://keybr.com). Built for beginners who are just starting to learn touch typing.

## ✨ Features

- **🎯 Adaptive Engine** — Tracks accuracy, speed, and delay per key. Identifies weak keys and generates targeted practice text.
- **🌐 3 Languages** — English (QWERTY), Tamil (Tamil99 Unicode), and Tanglish (romanized Tamil).
- **📴 Works Offline** — All data stored in IndexedDB. No account needed. Works without internet.
- **🎓 30 Progressive Lessons** — Start with two keys (F & J) and build up to full-speed typing with guided finger placement.
- **📊 Detailed Stats** — WPM, accuracy, per-key confidence heatmap, and session history.
- **⌨️ Virtual Keyboard** — Color-coded finger guides, key highlighting, and press feedback.
- **⚡ Ultra Fast** — Zero polling, event-driven. Under 16ms keystroke-to-screen latency.
- **📱 Mobile Friendly** — Responsive design with hidden input for virtual keyboards.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, React 19) |
| State | Zustand |
| Storage | IndexedDB via `idb` |
| Styling | Vanilla CSS (custom properties) |
| Fonts | Inter + Noto Sans Tamil + JetBrains Mono |
| PWA | manifest.json (Serwist planned for Phase 2) |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start typing!

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page
│   ├── practice/           # Free practice mode
│   ├── lessons/            # Progressive lesson system
│   ├── stats/              # Statistics dashboard
│   └── layout.tsx          # Root layout (fonts, theme, SEO)
├── components/             # React components
│   ├── typing/             # TypingArea, text display
│   ├── keyboard/           # VirtualKeyboard with finger guides
│   └── ui/                 # Header, buttons, modals
├── engine/                 # Typing engine (runs client-side)
│   ├── keyProfiler.ts      # Per-key tracking (circular buffers)
│   ├── textGenerator.ts    # Adaptive text generation
│   ├── sessionTracker.ts   # Session state machine
│   └── statsCalculator.ts  # WPM, accuracy calculations
├── data/                   # Static data
│   ├── wordBanks/          # Word banks per language
│   ├── lessons/            # Lesson definitions
│   └── keyboards/          # Keyboard layout data
├── db/                     # IndexedDB layer (idb)
│   ├── schema.ts           # TypeScript interfaces
│   ├── profile.ts          # User profile CRUD
│   ├── keyStats.ts         # Per-key statistics CRUD
│   ├── sessions.ts         # Session history CRUD
│   └── lessonProgress.ts   # Lesson progress CRUD
├── store/                  # Zustand state stores
│   ├── typingStore.ts      # Typing session state
│   └── uiStore.ts          # Theme, language, UI state
└── styles/                 # CSS
    ├── globals.css          # Design tokens & base styles
    ├── typing.css           # Typing area styles
    └── keyboard.css         # Virtual keyboard styles
```

## 🏗 Architecture

### Offline-First
- All typing logic runs **entirely client-side** — zero server dependency
- IndexedDB stores: user-profile, key-stats, sessions, lesson-progress
- Service Worker caching planned for Phase 2

### Adaptive Typing Algorithm
1. Each keystroke records: character, correct/incorrect, latency (ms)
2. Per-key stats use **circular buffers** (last 50 accuracy, last 20 latency)
3. Confidence score = accuracy (60%) + speed (40%)
4. Text generator uses **weighted random selection** — weak keys get 3× weight
5. IndexedDB writes are **debounced** (2-second batch flush)

### Performance
- Zero polling — all updates are event-driven
- WPM calculated on-demand, not via timers
- `requestAnimationFrame` throttled to 4fps for display updates
- DOM updates via CSS class toggles, not React re-renders
- Page Visibility API pauses everything when tab is hidden

## 🗺 Roadmap

### Phase 1 (Current) ✅
- [x] Adaptive typing engine
- [x] 3 language support
- [x] 30-level lesson system
- [x] Stats dashboard
- [x] Virtual keyboard
- [x] Offline-first with IndexedDB

### Phase 2 (Planned)
- [ ] Multiplayer typing races (Socket.IO)
- [ ] Private rooms & public matchmaking
- [ ] Server-side sync & leaderboard
- [ ] Sound effects (Keybr-style toggle)
- [ ] Service Worker with Serwist
- [ ] Additional keyboard layouts (Inscript, Typewriter)

## 📄 License

MIT

---

*Built with ❤️ for the typing community*
