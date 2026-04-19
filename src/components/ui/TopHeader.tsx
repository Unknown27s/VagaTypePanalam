'use client';

/**
 * VangaTypePanalam — Top Header Navigation
 *
 * Fixed top navigation bar with glassmorphic backdrop.
 * Replaces the old right-sidebar navigation.
 *
 * Layout: [Logo] --- [Nav Links] --- [Controls]
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import type { Language } from '@/db/schema';
import { getProfile } from '@/db/profile';
import { useSession, signIn, signOut } from "next-auth/react";
import { requestCloudSync } from '@/lib/sync';
import {
  Keyboard,
  GraduationCap,
  BarChart2,
  Swords,
  Timer,
  Sun,
  Moon,
  Globe,
  WifiOff,
  Volume2,
  VolumeX,
  Flame,
  SlidersHorizontal,
  ChevronDown,
  LogOut,
  User as UserIcon,
  LogIn,
  Cloud,
} from 'lucide-react';
import AuthModal from './AuthModal';

const NAV_ITEMS = [
  { href: '/', label: 'Practice', icon: Keyboard },
  { href: '/test', label: 'Test', icon: Timer },
  { href: '/race', label: 'Race', icon: Swords },
  { href: '/lessons', label: 'Lessons', icon: GraduationCap },
  { href: '/stats', label: 'Stats', icon: BarChart2 },
];

const LANGUAGE_MAP: Record<Language, string> = {
  en: 'EN',
  ta: 'த',
  tanglish: 'TG',
};

export default function TopHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    isOnline,
    soundEnabled,
    toggleSound,
    showKeyboard,
    toggleKeyboard,
    caretStyle,
    setCaretStyle,
    caretSpeed,
    setCaretSpeed,
  } = useUIStore();

  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with cloud when logged in
  useEffect(() => {
    if (session) {
      void requestCloudSync();
    }
  }, [session]);

  // Close settings dropdown on outside click
  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-dropdown-wrapper')) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [settingsOpen]);

  return (
    <header className="top-header glass">
      <nav className="header-inner">
        {/* ── Logo ── */}
        <Link href="/" className="header-logo">
          <span className="logo-text">VANGA</span>
        </Link>

        {/* ── Nav Links ── */}
        <div className="header-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* ── Controls ── */}
        <div className="header-controls">
          {mounted ? (
            <>
              {/* Offline indicator */}
              {!isOnline && (
                <span className="offline-indicator" title="Offline">
                  <WifiOff size={16} />
                </span>
              )}

              {/* Language */}
              <div className="control-group" title="Language">
                <Globe size={16} />
                <select
                  className="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  aria-label="Select language"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                  <option value="tanglish">Tanglish</option>
                </select>
              </div>

              {/* Sound */}
              <button
                className={`ctrl-btn ${soundEnabled ? 'active' : ''}`}
                onClick={toggleSound}
                title={soundEnabled ? 'Sound On' : 'Sound Off'}
                aria-label="Toggle sound"
              >
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>

              {/* Theme */}
              <button
                className="ctrl-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Morning Mode' : 'Night Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <div className="header-divider" />

              {/* Auth */}
              {session ? (
                <div className="auth-group">
                  <div className="user-avatar-wrapper" title={session.user?.name || 'User'}>
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="avatar-img" />
                    ) : (
                      <div className="avatar-fallback"><UserIcon size={16} /></div>
                    )}
                    <div className="cloud-indicator" title="Sync Protected">
                      <Cloud size={10} />
                    </div>
                  </div>
                  <button
                    className="ctrl-btn logout-btn"
                    onClick={() => signOut()}
                    title="Sign Out"
                    aria-label="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  className="auth-btn-pill"
                  onClick={() => setAuthModalOpen(true)}
                  title="Sign In / Sign Up"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>
              )}

              {/* Auth Modal */}
              <AuthModal 
                isOpen={authModalOpen} 
                onClose={() => setAuthModalOpen(false)} 
              />

              {/* Settings dropdown */}
              <div className="settings-dropdown-wrapper">
                <button
                  className={`ctrl-btn ${settingsOpen ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsOpen((v) => !v);
                  }}
                  title="Settings"
                  aria-label="Open settings"
                >
                  <SlidersHorizontal size={18} />
                  <ChevronDown size={12} />
                </button>

                {settingsOpen && (
                  <div className="settings-dropdown">
                    <label className="dropdown-row">
                      <span>Caret Style</span>
                      <select value={caretStyle} onChange={(e) => setCaretStyle(e.target.value as typeof caretStyle)}>
                        <option value="line">Line</option>
                        <option value="outline">Outline</option>
                      </select>
                    </label>
                    <label className="dropdown-row">
                      <span>Caret Speed</span>
                      <select value={caretSpeed} onChange={(e) => setCaretSpeed(e.target.value as typeof caretSpeed)}>
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                      </select>
                    </label>
                    <button className="dropdown-toggle" onClick={toggleSound}>
                      <span>Sound</span>
                      <strong>{soundEnabled ? 'On' : 'Off'}</strong>
                    </button>
                    <button className="dropdown-toggle" onClick={toggleKeyboard}>
                      <span>Keyboard</span>
                      <strong>{showKeyboard ? 'Shown' : 'Hidden'}</strong>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Skeleton controls for SSR / hydration */}
              <div className="control-group" title="Language">
                <Globe size={16} />
                <span className="lang-select" style={{ opacity: 0 }}>EN</span>
              </div>
              <button className="ctrl-btn" aria-label="Toggle sound">
                <VolumeX size={18} />
              </button>
              <button className="ctrl-btn" aria-label="Toggle theme">
                <Moon size={18} />
              </button>
              <div className="settings-dropdown-wrapper">
                <button className="ctrl-btn" aria-label="Open settings">
                  <SlidersHorizontal size={18} />
                  <ChevronDown size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      <style jsx>{`
        .top-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: var(--header-height);
          display: flex;
          align-items: center;
          box-shadow: var(--shadow-header);
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
          gap: var(--space-xl);
        }

        /* ── Logo ── */
        .header-logo {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

          background-clip: text;
        }

        @keyframes flicker {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }

        /* ── Nav Links ── */
        .header-nav {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          min-width: 0;
          padding: 4px;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
        }

        .nav-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          min-height: 38px;
          line-height: 1;
          background: transparent;
          border: 1px solid transparent;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-1px);
        }

        .nav-item.active {
          color: var(--color-primary-light);
          background: rgba(129, 140, 248, 0.15);
          border-color: rgba(129, 140, 248, 0.3);
          box-shadow: 0 2px 8px rgba(129, 140, 248, 0.15);
        }

        .nav-item :global(svg) {
          flex-shrink: 0;
          margin-right: 4px;
        }

        .nav-item span {
          display: inline-block;
          line-height: 1;
        }

        /* ── Controls ── */
        .header-controls {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          flex-shrink: 0;
        }

        .control-group {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-muted);
          position: relative;
        }

        .lang-select {
          appearance: none;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 4px 8px;
          font-size: var(--text-xs);
          font-family: var(--font-sans);
          color: var(--text-secondary);
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .lang-select:hover,
        .lang-select:focus {
          border-color: var(--color-primary);
          color: var(--text-primary);
        }

        .ctrl-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          height: 36px;
          min-width: 36px;
          padding: 8px;
          border: none;
          background: transparent;
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }

        .ctrl-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .ctrl-btn.active {
          color: var(--color-primary-light);
        }

        .offline-indicator {
          color: var(--color-error);
          display: flex;
          align-items: center;
          padding: 4px;
        }

        .header-divider {
          width: 1px;
          height: 24px;
          background: var(--border-subtle);
          margin: 0 var(--space-xs);
        }

        /* ── Auth ── */
        .auth-group {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .user-avatar-wrapper {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-full);
          border: 2px solid var(--border-default);
          overflow: visible;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .user-avatar-wrapper:hover {
          border-color: var(--color-primary);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: inherit;
          object-fit: cover;
        }

        .avatar-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-overlay);
          color: var(--text-muted);
        }

        .cloud-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: var(--color-primary);
          color: white;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--bg-surface);
        }

        .auth-btn-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .auth-btn-pill:hover {
          background: var(--color-primary-light);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
        }

        .auth-btn-pill:active {
          transform: translateY(0);
        }

        .logout-btn {
          opacity: 0.6;
        }

        .logout-btn:hover {
          opacity: 1;
          color: var(--color-error);
        }

        @media (max-width: 640px) {
          .auth-btn-pill span {
            display: none;
          }
          .auth-btn-pill {
            padding: 8px;
          }
        }

        /* ── Settings Dropdown ── */
        .settings-dropdown-wrapper {
          position: relative;
        }

        .settings-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 220px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-shadow: var(--shadow-lg);
          z-index: 100;
          animation: fadeIn 0.15s ease;
        }

        .dropdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          padding: 6px 8px;
        }

        .dropdown-row select {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          padding: 3px 6px;
          font-size: var(--text-xs);
          font-family: var(--font-sans);
          cursor: pointer;
        }

        .dropdown-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--text-xs);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          padding: 6px 8px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .dropdown-toggle:hover {
          background: var(--bg-hover);
        }

        .dropdown-toggle strong {
          color: var(--color-primary-light);
          font-size: var(--text-xs);
        }

        /* ── Responsive Header ── */
        @media (max-width: 1200px) {
          .header-inner {
            padding: 0 var(--space-lg);
            gap: var(--space-md);
          }

          .nav-item {
            padding: 8px 10px;
          }

          .nav-item span {
            display: none;
          }
        }

        @media (max-width: 900px) {
          .header-inner {
            gap: var(--space-sm);
          }

          .header-nav {
            flex: 1;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .header-nav::-webkit-scrollbar {
            display: none;
          }

          .header-controls {
            gap: 2px;
          }

          .control-group svg {
            display: none;
          }

          .lang-select {
            max-width: 88px;
            padding: 4px 6px;
          }
        }

        @media (max-width: 640px) {
          .header-logo {
            gap: 0;
          }

          .header-streak {
            display: none;
          }

          .logo-text {
            font-size: 1.1rem;
          }

          .nav-item {
            min-width: 36px;
            padding: 8px;
          }
        }
      `}</style>
    </header>
  );
}
