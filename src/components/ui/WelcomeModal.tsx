'use client';

import { useState, useEffect } from 'react';
import { X, Keyboard, WifiOff, TrendingUp, Heart, LogIn, Sun, Moon, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useSession, signIn } from 'next-auth/react';
import AuthModal from './AuthModal';

export default function WelcomeModal() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const { theme, setTheme } = useUIStore();
  const { status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      setIsOpen(true);
    }
  }, [mounted, status]);

  const handleClose = () => setIsOpen(false);

  const handleSignInClick = () => {
    setAuthModalOpen(true);
    handleClose();
  };

  const handleGoogleSignIn = () => {
    setSigningIn(true);
    signIn('google');
  };

  const features = [
    { icon: <Keyboard size={15} />, title: 'Adaptive lessons', desc: 'Adjusts to your weak spots and finger patterns automatically.' },
    { icon: <WifiOff size={15} />, title: 'Works offline', desc: 'Practice anywhere. Sync your progress when you\'re back online.' },
    { icon: <TrendingUp size={15} />, title: 'Track your growth', desc: 'WPM trends, keystroke latency, streaks — all in one place.' },
    { icon: <Heart size={15} />, title: 'Free forever', desc: 'Built by the community, for the community. No paywalls, ever.' },
  ];

  if (!mounted || !isOpen) {
    return (
      <>
        {authModalOpen && (
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div className="overlay" onClick={handleClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>

          {/* ── LEFT PANEL ── */}
          <div className="left-panel">
            <p className="eyebrow">VaagaTypePanalam</p>
            <h2 className="headline">Type faster.<br />Type smarter.</h2>
            <p className="subhead">Free, adaptive, offline-first — built for typists who mean it.</p>

            <div className="features">
              {features.map((f) => (
                <div key={f.title} className="feature-row">
                  <div className="feature-icon">{f.icon}</div>
                  <div>
                    <p className="feature-title">{f.title}</p>
                    <p className="feature-desc">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="right-panel">
            <button className="close-btn" onClick={handleClose} aria-label="Close">
              <X size={16} />
            </button>

            <div className="top-row">
              <h3 className="right-title">Get started</h3>
              <div className="theme-toggle" role="group" aria-label="Theme">
                <button
                  className={`theme-btn ${theme === 'light' ? 'active-light' : ''}`}
                  onClick={() => setTheme('light')}
                  aria-label="Light mode"
                  title="Light mode"
                >
                  <Sun size={14} />
                </button>
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active-dark' : ''}`}
                  onClick={() => setTheme('dark')}
                  aria-label="Dark mode"
                  title="Dark mode"
                >
                  <Moon size={14} />
                </button>
              </div>
            </div>

            <p className="right-sub">Sign in to save your progress, or jump straight in and practice now.</p>

            <div className="action-group">

              {/* Google */}
              <button className="action-btn google-btn" onClick={handleGoogleSignIn} disabled={signingIn}>
                {signingIn ? (
                  <Loader2 className="spin" size={15} />
                ) : (
                  <svg width="15" height="15" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </svg>
                )}
                {signingIn ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Other sign in */}
              <button className="action-btn signin-btn" onClick={handleSignInClick}>
                <LogIn size={15} />
                Other sign in options
              </button>

              {/* Discord */}
              <a
                href="https://discord.gg/SdMfbbdjtj"
                target="_blank"
                rel="noopener noreferrer"
                className="action-btn discord-btn"
                onClick={handleClose}
              >
                <svg viewBox="0 0 127.14 96.36" width="15" height="15" fill="currentColor">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.4-5c.87-.64,1.71-1.32,2.51-2a75.7,75.7,0,0,0,72.71,0c.8.7,1.64,1.38,2.51,2a68.43,68.43,0,0,1-10.4,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.87,50.77,124.1,27.93,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
                </svg>
                Join our Discord
              </a>
            </div>

            <div className="divider" />

            <button className="practice-btn" onClick={handleClose}>
              <Keyboard size={15} />
              Start practicing now
            </button>
            <p className="footnote">No account needed. Progress saves locally.</p>
          </div>

        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: var(--overlay-scrim);
          backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.25s ease;
        }

        .modal {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 740px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border-default);
          box-shadow: var(--shadow-lg);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── LEFT ── */
        .left-panel {
          background: var(--bg-surface);
          padding: 2.25rem 2rem;
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0 0 0.9rem;
          font-family: monospace;
        }

        .headline {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.6rem;
          line-height: 1.3;
        }

        .subhead {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 1.75rem;
          line-height: 1.65;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .feature-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .feature-icon {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          border-radius: 8px;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .feature-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 2px;
        }

        .feature-desc {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.55;
        }

        /* ── RIGHT ── */
        .right-panel {
          background: var(--bg-elevated);
          padding: 2.25rem 2rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-disabled);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          transition: color 0.15s, background 0.15s;
        }

        .close-btn:hover {
          color: var(--text-secondary);
          background: var(--bg-overlay);
        }

        .top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.4rem;
        }

        .right-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 3px;
          gap: 2px;
        }

        .theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }

        .theme-btn:hover {
          color: var(--text-secondary);
          background: var(--bg-hover);
        }

        .active-light {
          background: var(--bg-hover);
          color: #f0c040 !important;
        }

        .active-dark {
          background: var(--bg-hover);
          color: #a0b8f0 !important;
        }

        .right-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0 0 1.5rem;
          line-height: 1.6;
        }

        .action-group {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 1.25rem;
        }

        .action-btn {
          width: 100%;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          text-decoration: none;
          font-family: inherit;
          border: 1px solid transparent;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Google button */
        .google-btn {
          background: #ffffff;
          color: #1a1a1a;
          border-color: var(--border-default);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .google-btn:hover:not(:disabled) {
          background: #f5f5f5;
          transform: translateY(-2px);
          box-shadow: 0 5px 16px rgba(0, 0, 0, 0.35);
        }

        .google-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .signin-btn {
          background: transparent;
          color: var(--text-muted);
          border-color: var(--border-default);
        }

        .signin-btn:hover {
          background: var(--bg-overlay);
          color: var(--text-secondary);
          border-color: var(--border-default);
          transform: translateY(-1px);
        }

        .discord-btn {
          background: linear-gradient(135deg, #5865F2 0%, #4752C4 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(88, 101, 242, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .discord-btn:hover {
          background: linear-gradient(135deg, #7289da 0%, #5865F2 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(88, 101, 242, 0.4);
          color: #ffffff;
        }

        .divider {
          height: 1px;
          background: var(--border-subtle);
          margin-bottom: 1.25rem;
        }

        .practice-btn {
          width: 100%;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: inherit;
          outline: none;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%);
          color: var(--text-primary);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 14px var(--color-accent-glow);
        }

        .practice-btn:hover {
          background: linear-gradient(135deg, var(--color-accent-light) 0%, var(--color-accent) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(238, 194, 36, 0.45);
          color: var(--text-primary);
        }

        .footnote {
          font-size: 11px;
          color: var(--text-disabled);
          text-align: center;
          margin: 9px 0 0;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        @media (max-width: 600px) {
          .modal {
            grid-template-columns: 1fr;
            max-width: 92vw;
            border-radius: 14px;
          }
          .left-panel {
            border-right: none;
            border-bottom: 1px solid var(--border-subtle);
            padding: 1.75rem 1.5rem;
          }
          .right-panel {
            padding: 1.75rem 1.5rem;
          }
        }
      `}</style>

      {authModalOpen && (
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      )}
    </>
  );
}