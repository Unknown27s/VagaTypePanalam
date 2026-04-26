'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import type { Language } from '@/db/schema';
import { useSession, signOut } from 'next-auth/react';
import { requestCloudSync } from '@/lib/sync';
import Image from 'next/image';
import {
  Sun,
  Moon,
  Globe,
  WifiOff,
  Menu,
  X,
  Volume2,
  VolumeX,
  ChevronDown,
  LogOut,
  User as UserIcon,
  LogIn,
  Cloud,
  Settings,
  Eye,
  EyeOff,
  Keyboard,
  Timer,
  Gamepad2,
  BookOpen,
  BarChart2,
} from 'lucide-react';
import AuthModal from './AuthModal';

const NAV_ITEMS = [
  { href: '/', label: 'Practice', icon: Keyboard },
  { href: '/test', label: 'Test', icon: Timer },
  { href: '/race', label: 'Race', icon: Gamepad2 },
  { href: '/lessons', label: 'Lessons', icon: BookOpen },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (session) void requestCloudSync();
  }, [session]);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.settings-dropdown-wrapper')) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [settingsOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.mobile-nav-shell')) {
        setMobileNavOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [mobileNavOpen]);

  return (
    <header className="top-header">
      <nav className="header-inner">

        {/* ── Logo ── */}
        <div className="header-left">
          <Link href="/" className="header-logo">
            <span className="logo-text">VangaTypePanalam</span>
          </Link>
        </div>

        {/* ── Nav Links (centered container box) ── */}
        <div className="header-nav-wrap">
          <div className="header-nav">
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <React.Fragment key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                    title={item.label}
                  >
                    <Icon size={16} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </Link>
                  {index < NAV_ITEMS.length - 1 && (
                    <span className="nav-divider" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="header-controls">
          {mounted ? (
            <>
              {/* Online / Offline status */}
              {isOnline ? (
                <div className="status-pill online">
                  <span className="status-dot" />
                  <span className="status-label">Online</span>
                </div>
              ) : (
                <div className="status-pill offline" title="Offline">
                  <WifiOff size={12} />
                  <span className="status-label">Offline</span>
                </div>
              )}

              <span className="ctrl-divider" />

              {/* Language */}
              <div className="ctrl-btn" title="Language" style={{ position: 'relative' }}>
                <Globe size={15} />
                <span style={{ fontSize: '11px', fontWeight: 600, margin: '0 2px' }}>
                  {LANGUAGE_MAP[language]}
                </span>
                <ChevronDown size={9} style={{ opacity: 0.7 }} />
                
                <select
                  className="lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  aria-label="Select language"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                  }}
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                  <option value="tanglish">Tanglish</option>
                </select>
              </div>

              {/* Theme */}
              <button
                className="ctrl-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Morning Mode' : 'Night Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <span className="ctrl-divider" />

              {/* Settings dropdown */}
              <div className="settings-dropdown-wrapper">
                <button
                  className={`ctrl-btn settings-trigger ${settingsOpen ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen((v) => !v); }}
                  title="Settings"
                  aria-label="Open settings"
                >
                  <Settings size={15} />
                  <ChevronDown size={9} className={`chevron ${settingsOpen ? 'open' : ''}`} />
                </button>

                {settingsOpen && (
                  <div className="settings-dropdown">

                    {/* Sound */}
                    <button className="dd-row" onClick={toggleSound}>
                      <span className="dd-left">
                        {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                        Sound
                      </span>
                      <div className={`toggle-switch ${soundEnabled ? 'on' : ''}`}>
                        <div className="toggle-thumb" />
                      </div>
                    </button>

                    {/* Keyboard */}
                    <button className="dd-row" onClick={toggleKeyboard}>
                      <span className="dd-left">
                        {showKeyboard ? <Eye size={13} /> : <EyeOff size={13} />}
                        Keyboard
                      </span>
                      <div className={`toggle-switch ${showKeyboard ? 'on' : ''}`}>
                        <div className="toggle-thumb" />
                      </div>
                    </button>

                    <div className="dd-divider" />
                    <div className="dd-section">Caret</div>

                    {/* Caret Style */}
                    <label className="dd-row">
                      <span className="dd-left">Style</span>
                      <select
                        className="dd-select"
                        value={caretStyle}
                        onChange={(e) => setCaretStyle(e.target.value as typeof caretStyle)}
                      >
                        <option value="line">Line</option>
                        <option value="outline">Outline</option>
                      </select>
                    </label>

                    {/* Caret Speed */}
                    <label className="dd-row">
                      <span className="dd-left">Speed</span>
                      <select
                        className="dd-select"
                        value={caretSpeed}
                        onChange={(e) => setCaretSpeed(e.target.value as typeof caretSpeed)}
                      >
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                      </select>
                    </label>

                    <div className="dd-divider" />

                    {/* ── Auth Section ── */}
                    {session ? (
                      <div className="dd-auth">
                        {/* User card */}
                        <div className="dd-user-card">
                          {session.user?.image ? (
                            <Image
                              src={session.user.image}
                              alt={session.user.name || 'User'}
                              className="avatar-img"
                              width={28}
                              height={28}
                            />
                          ) : (
                            <div className="avatar-fallback">
                              <UserIcon size={13} />
                            </div>
                          )}
                          <div className="dd-user-info">
                            <span className="dd-user-name">{session.user?.name || 'User'}</span>
                            <span className="dd-user-sub">Synced to cloud</span>
                          </div>
                          <Cloud size={12} className="dd-cloud-icon" />
                        </div>

                        {/* Sign out */}
                        <button className="dd-row logout-row" onClick={() => signOut()}>
                          <span className="dd-left">
                            <LogOut size={13} />
                            Sign Out
                          </span>
                        </button>
                      </div>
                    ) : (
                      /* Sign in */
                      <button
                        className="dd-signin-btn"
                        onClick={() => { setAuthModalOpen(true); setSettingsOpen(false); }}
                      >
                        <span className="dd-left">
                          <LogIn size={13} />
                          Sign In to Sync
                        </span>
                        <span className="sync-badge">Cloud</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mobile-nav-shell">
                <button
                  className={`ctrl-btn mobile-nav-toggle ${mobileNavOpen ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMobileNavOpen((v) => !v);
                  }}
                  aria-label="Toggle navigation menu"
                  title="Menu"
                >
                  {mobileNavOpen ? <X size={15} /> : <Menu size={15} />}
                </button>

                {mobileNavOpen && (
                  <div className="mobile-nav-panel">
                    {NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}
                          onClick={() => setMobileNavOpen(false)}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </>
          ) : (
            /* SSR skeleton */
            <>
              <div className="ctrl-btn" style={{ opacity: 0 }}>
                <Globe size={15} />
                <span style={{ fontSize: '11px', fontWeight: 600, margin: '0 2px' }}>EN</span>
                <ChevronDown size={9} />
              </div>
              <button className="ctrl-btn" aria-label="Toggle theme">
                <Moon size={15} />
              </button>
              <div className="settings-dropdown-wrapper">
                <button className="ctrl-btn settings-trigger" aria-label="Open settings">
                  <Settings size={15} />
                  <ChevronDown size={9} />
                </button>
              </div>
              <div className="mobile-nav-shell">
                <button className="ctrl-btn mobile-nav-toggle" aria-label="Toggle navigation menu">
                  <Menu size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      <style jsx>{`
        /* ═══════════════════════════════════════════
           VangaTypePanalam — Top Header
           ═══════════════════════════════════════════ */

        .top-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          height: var(--header-height);
          display: flex;
          align-items: center;

          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, transparent 100%),
            var(--bg-header, var(--bg-glass));
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          border-bottom: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-header);
        }

        .header-inner {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          width: 100%;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
          gap: var(--space-lg);
        }

        /* ── Header Left ── */
        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          min-width: 0;
        }

        /* ── Logo ── */
        .header-logo {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-text {
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          line-height: 1;
          white-space: nowrap;
        }

        /* ── Nav ── */
        .header-nav-wrap {
          flex: 1;
          display: flex;
          justify-content: center;
          min-width: 0;
        }

        .header-nav {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: 999px;
          padding: 6px 10px;
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          letter-spacing: 0.01em;
          transition: color 0.2s ease, background 0.2s ease;
          border-radius: 999px;
          white-space: nowrap;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .nav-item.active {
          color: var(--color-primary-light);
          background: rgba(165, 180, 252, 0.11);
        }

        .nav-item.active::after {
          display: none;
        }

        .nav-divider {
          width: 1px;
          height: 14px;
          background: rgba(255, 255, 255, 0.15); /* light, not dark line */
          flex-shrink: 0;
        }

        /* ── Controls ── */
        .header-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .mobile-nav-shell {
          position: relative;
          display: none;
        }

        .mobile-nav-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: min(92vw, 280px);
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 6px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          gap: 3px;
          z-index: 120;
          animation: dd-slide 0.14s ease;
        }

        .mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 10px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .mobile-nav-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .mobile-nav-item.active {
          background: rgba(165, 180, 252, 0.12);
          color: var(--color-primary-light);
        }

        .ctrl-divider {
          width: 1px;
          height: 18px;
          background: var(--border-subtle);
          margin: 0 2px;
          flex-shrink: 0;
        }

        /* Status pill */
        .status-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 26px;
          padding: 0 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .status-pill.online {
          border: 1px solid rgba(165, 180, 252, 0.25);
          background: rgba(165, 180, 252, 0.07);
          color: var(--color-primary-light);
        }

        .status-pill.offline {
          border: 1px solid rgba(var(--color-error-rgb, 220, 80, 80), 0.3);
          background: rgba(var(--color-error-rgb, 220, 80, 80), 0.07);
          color: var(--color-error);
        }

        .status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
          animation: status-pulse 2.5s ease infinite;
        }

        .status-label { line-height: 1; }

        @keyframes status-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* Language dropdown hidden because it matches ctrl-btn styling now */

        /* Control buttons */
        .ctrl-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 32px;
          min-width: 34px;
          padding: 0 8px;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.01);
          border-radius: 8px;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }

        .ctrl-btn:hover {
          border-color: var(--border-subtle);
          background: var(--bg-hover);
          color: var(--text-secondary);
        }

        .ctrl-btn.active {
          color: var(--color-primary-light);
        }

        .chevron {
          transition: transform 0.2s ease;
        }

        .chevron.open {
          transform: rotate(180deg);
        }

        /* ── Settings Dropdown ── */
        .settings-dropdown-wrapper {
          position: relative;
        }

        .settings-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.04);
          z-index: 100;
          animation: dd-slide 0.14s ease;
        }

        @keyframes dd-slide {
          from { opacity: 0; transform: translateY(-5px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }

        .dd-section {
          padding: 4px 10px 2px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .dd-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 4px 0;
        }

        .dd-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.13s;
          width: 100%;
          background: transparent;
          border: none;
          font-family: var(--font-sans);
          font-size: var(--text-xs);
          color: var(--text-secondary);
        }

        .dd-row:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .dd-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Toggle switch */
        .toggle-switch {
          width: 34px; height: 20px;
          border-radius: 10px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          position: relative;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          flex-shrink: 0;
        }

        .toggle-switch.on {
          background: rgba(165, 180, 252, 0.15);
          border-color: rgba(165, 180, 252, 0.4);
        }

        .toggle-thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 12px; height: 12px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: transform 0.2s, background 0.2s;
        }

        .toggle-switch.on .toggle-thumb {
          transform: translateX(14px);
          background: var(--color-primary-light);
        }

        /* Caret selects */
        .dd-select {
          background: transparent;
          border: none;
          outline: none;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--color-primary-light);
          font-family: var(--font-sans);
          cursor: pointer;
        }

        .dd-select option {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }

        /* ── Auth section ── */
        .dd-auth {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dd-user-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px 8px;
        }

        .avatar-img {
          width: 28px; height: 28px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-default);
          flex-shrink: 0;
        }

        .avatar-fallback {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--bg-overlay);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .dd-user-info {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dd-user-name {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dd-user-sub {
          font-size: 10px;
          color: var(--text-muted);
          line-height: 1;
        }

        .dd-cloud-icon {
          color: var(--color-primary-light);
          flex-shrink: 0;
        }

        .logout-row:hover {
          color: var(--color-error) !important;
        }

        /* Sign In button */
        .dd-signin-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 10px;
          border-radius: 8px;
          border: 1px solid rgba(165, 180, 252, 0.2);
          background: rgba(165, 180, 252, 0.06);
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-primary-light);
          width: 100%;
          transition: border-color 0.15s, background 0.15s;
        }

        .dd-signin-btn:hover {
          border-color: rgba(165, 180, 252, 0.4);
          background: rgba(165, 180, 252, 0.1);
        }

        .sync-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: var(--color-primary-light);
          color: var(--bg-base);
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .header-inner {
            grid-template-columns: minmax(0, 1fr) auto;
            grid-template-areas:
              'left controls'
              'nav nav';
            padding: 0 var(--space-md);
            gap: 6px var(--space-sm);
          }

          .header-left {
            grid-area: left;
            min-width: 0;
          }

          .header-controls {
            grid-area: controls;
            justify-self: end;
          }

          .header-nav-wrap {
            grid-area: nav;
            justify-content: flex-start;
            width: 100%;
          }

          .header-nav {
            width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            justify-content: flex-start;
            scrollbar-width: none;
          }

          .header-nav::-webkit-scrollbar {
            display: none;
          }

          .logo-text {
            font-size: 0.98rem;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 42vw;
          }

          .status-label { display: none; }
          .status-pill { padding: 0 7px; }
        }

        @media (max-width: 640px) {
          .header-inner {
            padding: 8px var(--space-sm);
            gap: 6px;
          }

          .status-pill,
          .ctrl-divider { display: none; }

          .logo-text {
            max-width: 46vw;
            font-size: 0.92rem;
          }

          .header-nav-wrap {
            display: none;
          }

          .mobile-nav-shell {
            display: block;
          }

          .ctrl-btn {
            min-width: 32px;
            height: 30px;
            padding: 0 6px;
          }

          .settings-dropdown {
            right: -2px;
            width: min(92vw, 240px);
          }
        }

        @media (max-width: 420px) {
          .logo-text {
            max-width: 38vw;
          }

          .header-controls {
            gap: 2px;
          }

          .ctrl-btn {
            min-width: 30px;
          }
        }
      `}</style>
    </header>
  );
}