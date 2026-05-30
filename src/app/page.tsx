'use client';

/**
 * VangaTypePanalam — Home Page (Practice)
 *
 * 3-column layout:
 * Left: Daily progress, streaks, critical keys
 * Center: Typing interface with inline metrics + keyboard
 * Right: Live analytics, milestones
 */

import TypingArea from '@/components/typing/TypingArea';
import VirtualKeyboard from '@/components/keyboard/VirtualKeyboard';
import LeftSidebar from '@/components/ui/LeftSidebar';
import RightSidebar from '@/components/ui/RightSidebar';
import { useUIStore } from '@/store/uiStore';
import { useEffect, useState } from 'react';
import { FileText, X, Zap, BookOpen } from 'lucide-react';
import { getKeyStatsByLanguage } from '@/db/keyStats';

interface WeeklyBook {
  id: string;
  title: string;
  description: string;
  content: string;
  words: string[];
}

export default function HomePage() {
  const { language, showKeyboard, setOnline, isOnline } = useUIStore();
  const [practiceMode, setPracticeMode] = useState<'adaptive' | 'weekly-book' | 'custom'>('adaptive');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const [activeCustomText, setActiveCustomText] = useState<string | undefined>(undefined);
  const [weeklyBook, setWeeklyBook] = useState<WeeklyBook | null>(null);
  const [instanceKey, setInstanceKey] = useState(0);
  const [heatmapData, setHeatmapData] = useState<Map<string, { accuracy: number; frequency: number }>>();

  // Online/offline listener
  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // Load heatmap data on language change
  useEffect(() => {
    async function loadHeatmap() {
      try {
        const stats = await getKeyStatsByLanguage(language);
        const map = new Map<string, { accuracy: number; frequency: number }>();
        stats.forEach((s) => {
          map.set(s.char.toLowerCase(), { accuracy: s.confidence, frequency: s.totalAttempts });
        });
        setHeatmapData(map);
      } catch (e) { }
    }
    loadHeatmap();
  }, [language, instanceKey]); // Reload when finishing custom text session

  // Fetch active weekly book (with local caching for offline first)
  useEffect(() => {
    async function fetchWeeklyBook() {
      try {
        // Try local cache first
        const cached = localStorage.getItem('vanga-weekly-book');
        if (cached) {
          setWeeklyBook(JSON.parse(cached));
        }

        // Fetch fresh if online
        if (navigator.onLine) {
          const res = await fetch('/api/practice-book/active');
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.book) {
              setWeeklyBook(data.book);
              localStorage.setItem('vanga-weekly-book', JSON.stringify(data.book));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load weekly book:', err);
      }
    }
    fetchWeeklyBook();
  }, [isOnline]);

  const handleSubmitCustomText = () => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    setActiveCustomText(trimmed);
    setShowCustomInput(false);
    setInstanceKey((k) => k + 1); // Re-mount TypingArea with new text
  };

  const handleClearCustom = () => {
    setActiveCustomText(undefined);
    setCustomDraft('');
    setShowCustomInput(false);
    setInstanceKey((k) => k + 1);
  };

  return (
    <>
      {/* Beta Badge */}
      <div className="beta-badge-banner">
        <span className="badge-text">🚀 Beta Testing — VaagaTypePanalam v0.4</span>
        <a href="https://github.com/Unknown27s/VagaTypePanalam/issues" target="_blank" rel="noopener noreferrer" className="badge-link">
          Feedback
        </a>
      </div>

      <main className="three-col-layout animate-fade-in">
        {/* ── Left Sidebar ── */}
        <LeftSidebar language={language} />

        {/* ── Center: Typing Interface ── */}
        <div className="center-column">

          {/* ── Practice Mode Segmented selector ── */}
          <div className="practice-mode-selector">
            <button
              className={`mode-btn ${practiceMode === 'adaptive' ? 'active' : ''}`}
              onClick={() => {
                setPracticeMode('adaptive');
                handleClearCustom();
              }}
            >
              <Zap size={14} />
              <span>Adaptive Practice</span>
            </button>

            <button
              className={`mode-btn ${practiceMode === 'weekly-book' ? 'active' : ''}`}
              onClick={() => {
                setPracticeMode('weekly-book');
                handleClearCustom();
              }}
              title={weeklyBook ? `Active Book: ${weeklyBook.title}` : 'Loading active book...'}
            >
              <BookOpen size={14} />
              <span>Weekly Book Practice</span>
            </button>

            <button
              className={`mode-btn ${practiceMode === 'custom' ? 'active' : ''}`}
              onClick={() => {
                setPracticeMode('custom');
                setShowCustomInput(true);
              }}
            >
              <FileText size={14} />
              <span>Custom Text</span>
            </button>
          </div>

          {/* Custom Text Input Panel (Only shown in Custom Mode) */}
          {practiceMode === 'custom' && showCustomInput && !activeCustomText && (
            <div className="custom-panel">
              <textarea
                className="custom-textarea"
                placeholder="Paste or type any text here…"
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                rows={4}
                autoFocus
                id="custom-text-input"
              />
              <div className="custom-panel-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitCustomText}
                  disabled={!customDraft.trim()}
                  id="custom-text-submit"
                >
                  Start Practicing →
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowCustomInput(false)}
                >
                  Cancel
                </button>
                <span className="char-count">{customDraft.trim().length} chars</span>
              </div>
            </div>
          )}

          {/* Custom Text Indicator Badge (Only shown in Custom Mode) */}
          {practiceMode === 'custom' && activeCustomText && (
            <div className="custom-toolbar">
              <button className="custom-badge" onClick={handleClearCustom} title="Clear custom text">
                <FileText size={14} />
                <span>Custom text active</span>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Weekly Book Info Banner (Only shown in Weekly Book Mode) */}
          {practiceMode === 'weekly-book' && weeklyBook && (
            <div className="weekly-book-banner">
              <span className="banner-badge">BOOK OF THE WEEK</span>
              <span className="banner-title">{weeklyBook.title}</span>
              {weeklyBook.description && (
                <span className="banner-desc">{weeklyBook.description}</span>
              )}
            </div>
          )}

          <TypingArea
            key={`${practiceMode}-${instanceKey}`}
            language={language}
            mode="practice"
            customText={practiceMode === 'custom' ? activeCustomText : undefined}
            weeklyBookWords={practiceMode === 'weekly-book' ? (weeklyBook?.words || []) : undefined}
            bookId={practiceMode === 'weekly-book' ? weeklyBook?.id : undefined}
          />

          {showKeyboard && (
            <div className="keyboard-section">
              <VirtualKeyboard showFingerColors={true} language={language} heatmapData={heatmapData} />
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <RightSidebar />

        <style jsx>{`
        .center-column {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* ── Practice Mode Selector ── */
        .practice-mode-selector {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-subtle);
          padding: 4px;
          border-radius: var(--radius-full);
          margin-bottom: var(--space-md);
          width: fit-content;
          margin-left: auto;
          margin-right: auto;
          box-shadow: var(--shadow-sm);
        }

        .mode-btn {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 6px 14px;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn:hover {
          color: var(--text-primary);
        }

        .mode-btn.active {
          color: var(--color-primary-light);
          background: rgba(165, 180, 252, 0.12);
        }

        /* ── Weekly Book Banner ── */
        .weekly-book-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          background: linear-gradient(90deg, rgba(165, 180, 252, 0.08) 0%, rgba(244, 63, 94, 0.03) 100%);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 8px 16px;
          margin-bottom: var(--space-md);
          animation: fade-in 0.3s ease;
        }

        .banner-badge {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--color-accent);
          border: 1px solid rgba(244, 63, 94, 0.3);
          background: rgba(244, 63, 94, 0.1);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .banner-title {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
        }

        .banner-desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          border-left: 1px solid var(--border-subtle);
          padding-left: var(--space-md);
        }

        .custom-toolbar {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-sm);
          flex-shrink: 0;
        }

        .custom-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--color-primary-glow);
          border: 1px solid var(--color-primary);
          border-radius: var(--radius-full);
          padding: 0.3rem 0.9rem;
          font-size: var(--text-sm);
          color: var(--color-primary-light);
          cursor: pointer;
          font-weight: 600;
        }

        .custom-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-md);
          margin-bottom: var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          flex-shrink: 0;
        }

        .custom-textarea {
          width: 100%;
          resize: vertical;
          background: var(--bg-overlay);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: var(--space-sm);
          font-family: var(--font-sans);
          font-size: var(--text-sm);
          color: var(--text-primary);
          line-height: var(--leading-relaxed);
          outline: none;
          transition: border-color 0.15s;
        }

        .custom-textarea:focus {
          border-color: var(--color-primary);
        }

        .custom-panel-actions {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .char-count {
          margin-left: auto;
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .keyboard-section {
          margin-top: var(--space-md);
          flex-shrink: 0;
          display: flex;
          justify-content: center;
        }

        .keyboard-section :global(.virtual-keyboard) {
          transform: scale(0.85);
          transform-origin: top center;
        }
      `}</style>
      </main>
    </>
  );
}
