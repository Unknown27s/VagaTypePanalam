# Contributing to VangaTypePanalam

Thank you for your interest in contributing! This guide will help you get started with developing and contributing to the project.

## 🤖 Read This First

If you're an AI agent or developer working on this codebase, please read the following docs first:

1. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — High-level architecture and key rules for the typing engine
2. **[README.md](README.md)** — Project overview, tech stack, and feature list
3. **[AGENTS.md](docs/AGENTS.md)** — Next.js version-specific rules
4. **[CHANGELOG.md](docs/CHANGELOG.md)** — Recent changes and version history

## 🛠 Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── typing/           # TypingArea, text display
│   ├── keyboard/         # VirtualKeyboard
│   └── ui/              # Header, buttons, modals
├── engine/               # Typing engine (vanilla TS)
├── data/                 # Static data (lessons, keyboards)
├── db/                   # IndexedDB layer
├── store/                # Zustand state stores
└── styles/               # CSS files
```

## 🎯 Key Development Rules

### 1. Offline-First Core
- All typing logic runs **entirely client-side** for zero-latency
- Do not use `setInterval` or `requestAnimationFrame` for the typing core
- Calculate metrics only on keystrokes

### 2. Zero Polling Engine
- The engine must NOT use polling loops
- All updates are event-driven
- WPM calculated on-demand, not via timers

### 3. Theme-Aware Components
- Use CSS variables from `src/app/globals.css` for colors
- Test both light and dark themes when styling
- Use `var(--bg-header)`, `var(--text-primary)`, etc.

### 4. Responsive Design
- Mobile breakpoints: 900px and 640px
- Test navigation on small screens
- Icons should work without text labels on mobile

## ✅ Pull Request Checklist

Before submitting a PR, ensure:

- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No lint errors (`npm run lint` if available)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests work (if applicable)
- [ ] Documentation updated (if adding new features)

## 📝 Coding Conventions

- Use **Vanilla CSS** with custom properties — not Tailwind
- Follow existing component patterns in `src/components/ui/`
- Use Zustand for UI state, not context
- Keep IndexedDB operations debounced

## 💬 Getting Help

- **Issues**: [https://github.com/Unknown27s/VangaTypePanalam/issues](https://github.com/Unknown27s/VangaTypePanalam/issues)
- **Discussions**: Use GitHub Discussions

## 📜 License

By contributing, you agree that your contributions will be licensed under the **GNU General Public License v3.0**.

See [LICENSE](LICENSE) file for details.