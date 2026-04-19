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
import { FileText, X } from 'lucide-react';
import { getKeyStatsByLanguage } from '@/db/keyStats';

export default function HomePage() {
  const { language, showKeyboard, setOnline } = useUIStore();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const [activeCustomText, setActiveCustomText] = useState<string | undefined>(undefined);
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
      } catch (e) {}
    }
    loadHeatmap();
  }, [language, instanceKey]); // Reload when finishing custom text session

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
    <main className="three-col-layout animate-fade-in">
      {/* ── Left Sidebar ── */}
      <LeftSidebar language={language} />

      {/* ── Center: Typing Interface ── */}
      <div className="center-column">
        {/* Custom Text Toolbar */}
        <div className="custom-toolbar">
          {activeCustomText ? (
            <button className="custom-badge" onClick={handleClearCustom} title="Back to adaptive practice">
              <FileText size={14} />
              <span>Custom text active</span>
              <X size={14} />
            </button>
          ) : (
            <button
              className="custom-toggle-btn"
              onClick={() => setShowCustomInput((v) => !v)}
              id="custom-text-toggle"
            >
              <FileText size={15} />
              <span>Practice your own text</span>
            </button>
          )}
        </div>

        {/* Custom Text Input Panel */}
        {showCustomInput && !activeCustomText && (
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

        <TypingArea
          key={instanceKey}
          language={language}
          mode="practice"
          customText={activeCustomText}
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

        .custom-toolbar {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-sm);
          flex-shrink: 0;
        }

        .custom-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 0.3rem 0.9rem;
          font-size: var(--text-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }

        .custom-toggle-btn:hover {
          border-color: var(--color-primary);
          color: var(--color-primary-light);
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
  );
}
