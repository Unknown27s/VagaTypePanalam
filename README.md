# VangaTypePanalam ⌨️

> வாகை டைப் பணாலம் — Learn Typing in English, Tamil & Tanglish

A **free, adaptive, offline-first** typing practice web app inspired by [Keybr](https://keybr.com). Built for beginners who are just starting to learn touch typing.

## ✨ Features

- **🎯 Adaptive Engine** — Tracks accuracy, speed, and delay per key. Identifies weak keys and generates targeted practice text.
- **🌐 3 Languages** — English (QWERTY), Tamil (Tamil99 Unicode), and Tanglish (romanized Tamil).
- **📴 Works Offline** — All data stored in IndexedDB. No account needed. Works without internet.
- **🎓 30 Progressive Lessons** — Start with two keys (F & J) and build up to full-speed typing with guided finger placement.
- **🔄 Cloud Synchronization** — Sign in with Email/Password or GitHub to back up progress and sync across devices.
- **🔐 JWT Authentication** — Auth.js (NextAuth v5) with JWT sessions and credentials-based login.
- **📊 Detailed Stats** — WPM, accuracy, per-key confidence heatmap, and session history.
- **⌨️ Virtual Keyboard** — Color-coded finger guides, key highlighting, and press feedback.
- **⚡ Ultra Fast** — Zero polling, event-driven. Under 16ms keystroke-to-screen latency.
- **📱 Mobile Friendly** — Responsive design with hidden input for virtual keyboards.

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router, React 19) |
| Auth | Auth.js (NextAuth v5) |
| Database | Neon PostgreSQL (Production Sync) |
| ORM | Prisma 7 (with Serverless Adapter) |
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

### Required Environment Variables

Create a `.env.local` file in the project root and set the following values:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

# Auth.js / NextAuth
AUTH_SECRET="your-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Optional GitHub OAuth
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
```

Notes:
- `AUTH_SECRET` is required for secure JWT signing.
- Credentials login (email/password) works without GitHub OAuth values.
- GitHub sign-in is optional and only needed when you want social login.

## ▲ Deploy On Vercel (Trial)

This project can be deployed directly on Vercel as a **trial version**.
Please treat the first deployment as beta and collect user feedback before broad rollout.

### Quick deploy steps
1. Push your latest code to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import repository: `Unknown27s/VagaTypePanalam`.
4. Keep defaults for Next.js build settings.
5. Click **Deploy**.

### Trial notes
- Add a short label in the UI: `Trial version - feedback welcome`.
- Keep feedback channel open via GitHub Issues.
- Recommended feedback link: `https://github.com/Unknown27s/VagaTypePanalam/issues/new`.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Practice mode (home route: /)
│   ├── lessons/            # Progressive lesson system
│   ├── test/               # Timed test mode
│   ├── race/               # Ghost race mode
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

### Offline-First Hybrid
- All core typing logic runs **entirely client-side** for zero-latency.
- **Cloud Sync Layer**: Optional background syncing to Neon PostgreSQL.
- IndexedDB stores: user-profile, key-stats, sessions, lesson-progress
- Service Worker caching planned for Phase 2

### Authentication
- Auth provider: Auth.js (NextAuth v5)
- Session strategy: JWT
- Login methods:
    - Email/Password (credentials)
    - GitHub OAuth (optional)
- Passwords are hashed with `bcryptjs` before storing in database.

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

## 🎨 UI Customization Guide

If you want to change the UI, these are the main files to edit:

### Global layout and design tokens
- `src/app/layout.tsx` — Global shell layout (TopHeader + 3-column grid support).
- `src/app/globals.css` — Global theme variables, spacing scale, typography, base element styles (including `three-col-layout` class).

### Main pages (page-level UI)
- `src/app/page.tsx` — Practice page UI, custom text panel, and 3-column layout structure.
- `src/app/test/page.tsx` — Timed test UI (countdown ring, result card).
- `src/app/race/page.tsx` — Race UI (lanes, cars, result card).
- `src/app/lessons/page.tsx` and `src/app/lessons/[id]/page.tsx` — Lessons list and lesson detail UIs.
- `src/app/stats/page.tsx` — Stats/profile dashboard UI.

### Reusable UI components
- `src/components/ui/TopHeader.tsx` — Top navigation bar, language/theme/sound/caret settings.
- `src/components/ui/LeftSidebar.tsx` — Daily progress, streak, and critical keys metrics.
- `src/components/ui/RightSidebar.tsx` — Live analytics and consistency metrics.
- `src/components/typing/TypingArea.tsx` — Center typing screen with inline metrics and text rendering.
- `src/components/keyboard/VirtualKeyboard.tsx` — On-screen keyboard with heatmap overlays and key highlight behavior.

### Styling files
- `src/styles/typing.css` — Typing area visuals (word/letter states, caret, inline metrics, overlays).
- `src/styles/keyboard.css` — Virtual keyboard style and key states.

### UI behavior settings
- `src/store/uiStore.ts` — Theme, sound, language, caret style/speed, and UI toggles.

### Quick examples
- Change app colors/fonts: edit `src/app/globals.css`.
- Change navigation links: edit `src/components/ui/TopHeader.tsx`.
- Change center metrics: edit `src/components/typing/TypingArea.tsx`.
- Change test/race page card and layout styling: edit `src/app/test/page.tsx` and `src/app/race/page.tsx`.

## 🗺 Roadmap

The project is currently in **Phase 2**. For the full list of planned features, milestones, and vision, see the [Detailed Roadmap](docs/ROADMAP.md).

## 📚 Documentation

Detailed documentation for developers and contributors:

- **[Architecture](docs/ARCHITECTURE.md)** — High-level system design and data flow.
- **[API Reference](docs/API.md)** — Documentation for backend API routes.
- **[Full Walkthrough](docs/walkthrough.md)** — Comprehensive guide to the entire codebase.
- **[Deployment Guide](docs/DEPLOYMENT.md)** — How to deploy to Vercel/Neon.
- **[Changelog](docs/CHANGELOG.md)** — History of all major changes.
- **[Checklist](docs/CHECKLIST.md)** — Pre-deployment verification steps.

## 📄 License

GNU General Public License v3.0

---

*Built with ❤️ for the typing community*
