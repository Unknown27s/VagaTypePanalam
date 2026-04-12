'use client';

/**
 * VaagaTypePanalam — Minimal Pop-out Sidebar
 * 
 * Right-aligned, icon-focused sidebar that expands on hover.
 * Powered by Lucide-React for premium SVG iconography.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import type { Language } from '@/db/schema';
import { getProfile } from '@/db/profile';
import { 
  Keyboard, 
  GraduationCap, 
  BarChart2, 
  Trophy, 
  Swords, 
  User, 
  Sun, 
  Moon, 
  Globe, 
  WifiOff,
  Volume2,
  VolumeX,
  Timer,
  Flame
} from 'lucide-react';

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'En',
  ta: 'த',
  tanglish: 'Tg',
};

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, language, setLanguage, isOnline, showKeyboard, toggleKeyboard, soundEnabled, toggleSound } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [streak, setStreak] = useState(0);
  
  useEffect(() => { 
    setMounted(true); 
    const fetchStreak = async () => {
      try {
        const profile = await getProfile();
        setStreak(profile.currentStreak);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStreak();

    // Listen for profile updates (e.g., after a test completes)
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.currentStreak !== undefined) {
        setStreak(customEvent.detail.currentStreak);
      }
    };
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('profile-updated', handleProfileUpdate);
  }, []);

  const NAV_ITEMS = [
    { href: '/practice', label: 'Practice', icon: <Keyboard size={20} /> },
    { href: '/test', label: 'Test', icon: <Timer size={20} /> },
    { href: '/race', label: 'Race', icon: <Swords size={20} /> },
    { href: '/lessons', label: 'Lessons', icon: <GraduationCap size={20} /> },
    { href: '/stats', label: 'Profile', icon: <BarChart2 size={20} /> },
  ];

  const DISABLED_ITEMS = [
    { label: 'High Scores', icon: <Trophy size={20} />, title: 'Coming Soon' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        {/* User Profile & Streak */}
        <div className="user-profile-wrapper">
          <div className="user-profile">
            <div className="avatar">
              <User size={24} />
            </div>
          </div>
          {mounted && streak > 0 && (
            <div className="streak-badge" title={`${streak} Day Streak!`}>
              <Flame size={14} className="flame-icon" />
              <span className="streak-count">{streak}</span>
            </div>
          )}
        </div>
        
        {/* Quick Toolbar */}
        <div className="toolbar">
          
          <button 
            className={`tool-btn ${soundEnabled ? 'active' : ''}`}
            onClick={toggleSound}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
            aria-label="Toggle sound"
          >
            <span className="icon-wrapper">
              {mounted ? (soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />) : <VolumeX size={20} />}
            </span>
            <span className="nav-label text-fade">Sound</span>
          </button>
          
          <button 
            className="tool-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            aria-label="Toggle theme"
          >
            <span className="icon-wrapper">
              {mounted ? (theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />) : <Moon size={20} />}
            </span>
            <span className="nav-label text-fade">Theme</span>
          </button>
        </div>
      </div>

      <nav className="nav-links">
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.href}
            href={item.href} 
            className="styled-link-wrapper"
            title={item.label}
          >
            <div className={`nav-link ${pathname === item.href ? 'active' : ''}`}>
               <span className="icon-wrapper">{item.icon}</span>
               <span className="nav-label text-fade">{item.label}</span>
            </div>
          </Link>
        ))}
        {DISABLED_ITEMS.map((item) => (
          <div 
            key={item.label}
            className="nav-link disabled" 
            title={item.title}
          >
            <span className="icon-wrapper">{item.icon}</span>
            <span className="nav-label text-fade">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {mounted && !isOnline && (
          <div className="offline-badge" title="Offline">
            <span className="icon-wrapper"><WifiOff size={18} /></span>
            <span className="nav-label text-fade">Offline</span>
          </div>
        )}
        
        <div className="language-selector" title="Change Language">
          <select
            className="language-select nav-label text-fade"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
            <option value="tanglish">Tanglish</option>
          </select>
          <div className="lang-icon-collapsed">
            <Globe size={20} />
          </div>
        </div>
        
        <div className="footer-links nav-label text-fade">
          <span className="brand-name">VaagaTypePanalam</span>
          <div className="links-row">
            <a href="#">Github</a>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar {
          width: 64px;
          height: 100vh;
          position: fixed;
          right: 0;
          top: 0;
          background: var(--bg-surface);
          border-left: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0.5rem;
          font-family: var(--font-sans);
          z-index: 1000;
          overflow-x: hidden;
          overflow-y: hidden;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
          white-space: nowrap;
        }

        .sidebar:hover {
          width: 220px;
          box-shadow: -4px 0 15px rgba(0, 0, 0, 0.05);
        }

        /* Elements that fade out when collapsed */
        .text-fade {
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          transition-delay: 0s;
        }

        .sidebar:hover .text-fade {
          opacity: 1;
          visibility: visible;
          transition-delay: 0.1s;
        }

        /* ── Top Section ── */
        .sidebar-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .user-profile-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin-bottom: var(--space-xl);
          padding-bottom: var(--space-md);
          border-bottom: 1px solid var(--border-subtle);
        }

        .user-profile {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          color: var(--text-secondary);
          padding: 0 0.25rem;
        }

        .avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-hover);
          border-radius: 50%;
          min-width: 40px;
          height: 40px;
          color: var(--text-primary);
        }

        .streak-badge {
          display: flex;
          align-items: center;
          gap: 2px;
          background: #fdf5e6;
          border-radius: var(--radius-full);
          padding: 2px 6px;
          color: #d97706;
        }
        
        :global([data-theme='dark']) .streak-badge {
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
        }

        .flame-icon {
          animation: flicker 2s infinite ease-in-out;
        }

        @keyframes flicker {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .streak-count {
          font-size: var(--text-xs);
          font-weight: 800;
        }

        .toolbar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 1rem;
        }

        .tool-btn {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: nowrap;
          gap: 1rem;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.25rem;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: background 0.15s, color 0.15s;
          width: 100%;
          text-align: left;
        }

        .tool-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .tool-btn.active {
          color: var(--color-primary);
        }

        /* ── Navigation Links ── */
        .styled-link-wrapper {
          text-decoration: none;
          display: block;
          width: 100%;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-grow: 1;
          width: 100%;
        }

        .nav-link {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: nowrap;
          gap: 1rem;
          padding: 0.5rem 0.25rem;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.1s, color 0.1s;
          width: 100%;
        }

        .nav-link:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: var(--bg-surface);
          color: var(--color-primary);
          font-weight: 600;
        }
        
        .nav-link.active .icon-wrapper {
          color: var(--color-primary);
        }

        .nav-link.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          pointer-events: none;
        }

        .icon-wrapper {
          min-width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .nav-label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* ── Bottom Section ── */
        .sidebar-bottom {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: auto;
          border-top: 1px solid var(--border-subtle);
          padding-top: 1rem;
        }

        .offline-badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--typing-error);
          padding: 0.25rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
        }

        .language-selector {
          position: relative;
          display: flex;
          align-items: center;
          height: 40px;
          padding: 0 0.25rem;
        }

        .lang-icon-collapsed {
          min-width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--text-secondary);
          position: absolute;
          left: 0.25rem;
          transition: opacity 0.2s ease;
        }

        .sidebar:hover .lang-icon-collapsed {
          opacity: 0;
          visibility: hidden;
        }

        .language-select {
          padding: 0.4rem 0.5rem;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-family: inherit;
          font-size: 0.85rem;
          cursor: pointer;
          width: 100%;
          margin-left: 0.5rem;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding-left: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .brand-name {
          font-weight: 700;
          color: var(--text-secondary);
        }

        .links-row {
          display: flex;
          gap: 0.75rem;
        }

        .links-row a {
          color: var(--text-muted);
          text-decoration: none;
        }

        .links-row a:hover {
          text-decoration: underline;
          color: var(--text-secondary);
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            bottom: 0;
            top: auto;
            right: 0;
            width: 100%;
            height: 60px;
            flex-direction: row;
            padding: 0;
            border-left: none;
            border-top: 1px solid var(--border-subtle);
            justify-content: space-around;
            align-items: center;
            overflow: visible;
          }

          .sidebar:hover {
            width: 100%;
            box-shadow: none;
          }

          .text-fade {
            display: none !important;
          }

          .sidebar-top,
          .sidebar-bottom {
            display: none;
          }

          .nav-links {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            width: 100%;
            margin: 0;
            gap: 0;
          }

          .styled-link-wrapper {
            flex: 1;
          }

          .nav-link {
            justify-content: center;
            padding: 0;
            height: 60px;
          }

          .nav-link.disabled {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}
