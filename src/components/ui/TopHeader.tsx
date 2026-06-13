'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import type { Language } from '@/db/schema';
import { useSession, signOut } from 'next-auth/react';
import { requestCloudSync } from '@/lib/sync';
import Image from 'next/image';
import {
  Sun, Moon, Globe, WifiOff, Menu, X,
  Volume2, VolumeX, ChevronDown, LogOut,
  User as UserIcon, LogIn, Cloud, Settings,
  Shield, Eye, EyeOff, Keyboard, Timer,
  Gamepad2, BookOpen, BarChart2,
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
    theme, toggleTheme, language, setLanguage, isOnline,
    soundEnabled, toggleSound, showKeyboard, toggleKeyboard,
    caretStyle, setCaretStyle, caretSpeed, setCaretSpeed,
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

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const item = e.currentTarget;
    const rect = item.getBoundingClientRect();
    const size = Math.max(item.offsetWidth, item.offsetHeight) * 1.8;
    const ripple = document.createElement('span');
    ripple.className = 'nav-ripple';
    ripple.style.cssText = `
      position:absolute;
      border-radius:50%;
      pointer-events:none;
      width:${size}px;
      height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:rgba(165,180,252,0.25);
      transform:scale(0);
      animation:nav-ripple-out 0.55s ease-out forwards;
    `;
    item.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  return (
    <header className="top-header">
      <nav className="header-inner">

        {/* ── Logo ── */}
        <div className="header-left">
          <Link href="/" className="header-logo">
            <span className="logo-text">வாங்க டைப் பண்ணலாம்</span>
          </Link>
        </div>

        {/* ── Nav Links ── */}
        <div className="header-nav-wrap">
          <div className="header-nav">
            {NAV_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <React.Fragment key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    title={item.label}
                    onClick={handleNavClick}
                  >
                    <Icon size={16} className="nav-icon" />
                    <span className="nav-label">{item.label}</span>
                  </Link>
                  {index < NAV_ITEMS.length - 1 && <span className="nav-divider" />}
                </React.Fragment>
              );
            })}

            {session?.user && (session.user as { role?: string }).role === 'ADMIN' && (
              <>
                <span className="nav-divider" />
                <Link
                  href="/admin"
                  className={`nav-item${pathname === '/admin' ? ' active' : ''}`}
                  title="Admin Dashboard"
                  onClick={handleNavClick}
                >
                  <Shield size={16} className="nav-icon" />
                  <span className="nav-label">Admin</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="header-controls">
          {mounted ? (
            <>
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
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                  <option value="tanglish">Tanglish</option>
                </select>
              </div>

              <button
                className="ctrl-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Morning Mode' : 'Night Mode'}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              <a
                href="https://discord.gg/SdMfbbdjtj"
                target="_blank"
                rel="noopener noreferrer"
                className="ctrl-btn"
                title="Join our Discord"
                aria-label="Discord"
              >
                <svg viewBox="0 0 127.14 96.36" width="14" height="14" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.4-5c.87-.64,1.71-1.32,2.51-2a75.7,75.7,0,0,0,72.71,0c.8.7,1.64,1.38,2.51,2a68.43,68.43,0,0,1-10.4,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,124.1,27.93,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z"/>
                </svg>
              </a>

              <span className="ctrl-divider" />

              <div className="settings-dropdown-wrapper">
                <button
                  className={`ctrl-btn settings-trigger${settingsOpen ? ' active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setSettingsOpen((v) => !v); }}
                  title="Settings"
                  aria-label="Open settings"
                >
                  <Settings size={15} />
                  <ChevronDown size={9} className={`chevron${settingsOpen ? ' open' : ''}`} />
                </button>

                {settingsOpen && (
                  <div className="settings-dropdown">
                    <button className="dd-row" onClick={toggleSound}>
                      <span className="dd-left">
                        {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                        Sound
                      </span>
                      <div className={`toggle-switch${soundEnabled ? ' on' : ''}`}>
                        <div className="toggle-thumb" />
                      </div>
                    </button>

                    <button className="dd-row" onClick={toggleKeyboard}>
                      <span className="dd-left">
                        {showKeyboard ? <Eye size={13} /> : <EyeOff size={13} />}
                        Keyboard
                      </span>
                      <div className={`toggle-switch${showKeyboard ? ' on' : ''}`}>
                        <div className="toggle-thumb" />
                      </div>
                    </button>

                    <div className="dd-divider" />
                    <div className="dd-section">Caret</div>

                    <label className="dd-row">
                      <span className="dd-left">Style</span>
                      <select className="dd-select" value={caretStyle} onChange={(e) => setCaretStyle(e.target.value as typeof caretStyle)}>
                        <option value="line">Line</option>
                        <option value="outline">Outline</option>
                      </select>
                    </label>

                    <label className="dd-row">
                      <span className="dd-left">Speed</span>
                      <select className="dd-select" value={caretSpeed} onChange={(e) => setCaretSpeed(e.target.value as typeof caretSpeed)}>
                        <option value="slow">Slow</option>
                        <option value="medium">Medium</option>
                        <option value="fast">Fast</option>
                      </select>
                    </label>

                    <div className="dd-divider" />

                    {session ? (
                      <div className="dd-auth">
                        <div className="dd-user-card">
                          {session.user?.image ? (
                            <Image src={session.user.image} alt={session.user.name || 'User'} className="avatar-img" width={28} height={28} />
                          ) : (
                            <div className="avatar-fallback"><UserIcon size={13} /></div>
                          )}
                          <div className="dd-user-info">
                            <span className="dd-user-name">{session.user?.name || 'User'}</span>
                            <span className="dd-user-sub">Synced to cloud</span>
                          </div>
                          <Cloud size={12} className="dd-cloud-icon" />
                        </div>
                        <button className="dd-row logout-row" onClick={() => signOut()}>
                          <span className="dd-left"><LogOut size={13} />Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <button className="dd-signin-btn" onClick={() => { setAuthModalOpen(true); setSettingsOpen(false); }}>
                        <span className="dd-left"><LogIn size={13} />Sign In to Sync</span>
                        <span className="sync-badge">Cloud</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mobile-nav-shell">
                <button
                  className={`ctrl-btn mobile-nav-toggle${mobileNavOpen ? ' active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setMobileNavOpen((v) => !v); }}
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
                          className={`mobile-nav-item${pathname === item.href ? ' active' : ''}`}
                          onClick={() => setMobileNavOpen(false)}
                        >
                          {React.createElement(Icon, { size: 16 })}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                    {session?.user && (session.user as { role?: string }).role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className={`mobile-nav-item${pathname === '/admin' ? ' active' : ''}`}
                        onClick={() => setMobileNavOpen(false)}
                      >
                        <Shield size={16} />
                        <span>Admin</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </>
          ) : (
            <>
              <div className="ctrl-btn" style={{ opacity: 0 }}>
                <Globe size={15} />
                <span style={{ fontSize: '11px', fontWeight: 600, margin: '0 2px' }}>EN</span>
                <ChevronDown size={9} />
              </div>
              <button className="ctrl-btn" aria-label="Toggle theme"><Moon size={15} /></button>
              <div className="settings-dropdown-wrapper">
                <button className="ctrl-btn settings-trigger" aria-label="Open settings">
                  <Settings size={15} /><ChevronDown size={9} />
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
    </header>
  );
}