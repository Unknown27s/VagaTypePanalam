/**
 * BadgeCard — Premium achievement card with SVG artwork
 * Mini view: Shows icon + title + progress (for locked)
 * Big view: Expands into a 3D-flippable modal on click with motivational quotes
 */

import type { Badge, BadgeProgress } from '@/engine/gamification';
import { getRarityColor } from '@/engine/gamification';
import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface BadgeCardProps {
  badge: Badge;
  earned: boolean;
  progress?: BadgeProgress;
  earnedDate?: number;
}

export function BadgeCard({
  badge,
  earned,
  progress,
  earnedDate,
}: BadgeCardProps) {
  const rarityColor = getRarityColor(badge.rarity);
  const progressPercent = progress ? progress.percentage : 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
    if (isExpanded) setIsFlipped(false); // Reset flip when closing
  };

  const handleModalClick = (e: React.MouseEvent) => {
    // Only toggle flip if clicking the card content, not the close button or backdrop
    if ((e.target as HTMLElement).closest('.modal-badge-inner')) {
      setIsFlipped(!isFlipped);
    } else if (!(e.target as HTMLElement).closest('.modal-content-wrap')) {
      setIsExpanded(false);
    }
  };

  return (
    <>
      <div
        className={`badge-card-mini ${earned ? 'earned' : 'locked'}`}
        style={{ borderColor: earned ? rarityColor : 'rgba(255, 255, 255, 0.06)' }}
        onClick={toggleExpand}
      >
        <div className="mini-icon-wrap">
          {(badge as any).svgContent ? (
            <div 
              className={`badge-svg-raw ${earned ? '' : 'locked-svg'}`} 
              dangerouslySetInnerHTML={{ __html: (badge as any).svgContent }} 
            />
          ) : (
            <img
              src={badge.icon ? badge.icon : '/badges/first-steps.svg'}
              alt={badge.title}
              width={32}
              height={32}
              className={`badge-svg ${earned ? '' : 'locked-svg'}`}
            />
          )}
        </div>
        <span className="mini-name">{badge.title}</span>
        {earned && <span className="mini-check">✓</span>}
        {!earned && progress && (
          <div className="mini-progress-bar">
            <div className="mini-progress-fill" style={{ width: `${progressPercent}%`, background: rarityColor }} />
          </div>
        )}
      </div>

      {/* EXPANDED MODAL VIEW */}
      {isExpanded && (
        <div className="badge-modal-overlay" onClick={() => setIsExpanded(false)}>
          <div className="modal-content-wrap" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsExpanded(false)}><X size={20} /></button>
            
            <div className={`modal-badge-container ${isFlipped ? 'is-flipped' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
              <div className="modal-badge-inner">
                {/* FRONT */}
                <div className="modal-badge-front" style={{ borderColor: rarityColor, boxShadow: `0 0 30px ${rarityColor}33` }}>
                  <div className="modal-icon-wrap">
                    {(badge as any).svgContent ? (
                      <div className="badge-svg-raw-large" dangerouslySetInnerHTML={{ __html: (badge as any).svgContent }} />
                    ) : (
                      <img src={badge.icon} alt={badge.title} className="badge-svg-large" />
                    )}
                  </div>
                  <h3 className="modal-title">{badge.title}</h3>
                  <p className="modal-desc">{badge.description}</p>
                  <div className="modal-meta">
                    <span className="modal-rarity" style={{ color: rarityColor }}>{badge.rarity}</span>
                    {earned && earnedDate && (
                      <span className="modal-date">Earned {new Date(earnedDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flip-hint">Click to flip <RefreshCw size={12} /></div>
                </div>

                {/* BACK */}
                <div className="modal-badge-back" style={{ borderColor: rarityColor, background: `linear-gradient(135deg, ${rarityColor}11, #0a0a0a)` }}>
                  <div className="quote-wrap">
                    <span className="quote-icon">"</span>
                    <p className="modal-quote">{badge.quote || "The only limit is the one you set yourself. Keep typing, keep growing."}</p>
                    <span className="quote-icon end">"</span>
                  </div>
                  <div className="back-footer">
                    <div className="stat-circle" style={{ borderColor: rarityColor }}>
                      <span className="stat-label">Rarity</span>
                      <span className="stat-value">{badge.rarity}</span>
                    </div>
                  </div>
                  <div className="flip-hint">Click to return <RefreshCw size={12} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .badge-card-mini {
          width: 86px;
          height: 96px;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          gap: 4px;
        }

        .badge-card-mini:hover {
          transform: translateY(-5px) scale(1.05);
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }

        .mini-icon-wrap {
          width: 32px;
          height: 32px;
        }

        .badge-svg {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .mini-name {
          font-size: 0.6rem;
          font-weight: 800;
          text-align: center;
          color: var(--text-primary);
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .mini-check {
          position: absolute;
          top: 4px;
          right: 4px;
          font-size: 0.6rem;
          color: var(--color-success);
        }

        .mini-progress-bar {
          width: 80%;
          height: 2px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 2px;
        }

        .mini-progress-fill {
          height: 100%;
        }

        /* Modal Styles */
        .badge-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        .modal-content-wrap {
          position: relative;
          width: 320px;
          height: 440px;
        }

        .modal-close {
          position: absolute;
          top: -40px;
          right: -40px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: rgba(255,255,255,0.2);
          transform: rotate(90deg);
        }

        .modal-badge-container {
          width: 100%;
          height: 100%;
          perspective: 1500px;
          cursor: pointer;
        }

        .modal-badge-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }

        .modal-badge-container.is-flipped .modal-badge-inner {
          transform: rotateY(180deg);
        }

        .modal-badge-front, .modal-badge-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          background: #0f0f0f;
          border: 2px solid;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2.5rem 1.5rem;
          text-align: center;
        }

        .modal-badge-back {
          transform: rotateY(180deg);
          justify-content: space-between;
        }

        .modal-icon-wrap {
          width: 140px;
          height: 140px;
          margin-bottom: 2rem;
          filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
          animation: float 4s ease-in-out infinite;
        }

        .badge-svg-large {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .modal-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
          background: linear-gradient(to bottom, #fff, #aaa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .modal-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        .modal-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .modal-rarity {
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.1em;
          font-size: 0.8rem;
        }

        .modal-date {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .quote-wrap {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .quote-icon {
          font-size: 4rem;
          color: rgba(255,255,255,0.05);
          position: absolute;
          top: -20px;
          left: -10px;
          font-family: serif;
        }

        .quote-icon.end {
          top: auto;
          bottom: -40px;
          right: -10px;
          left: auto;
        }

        .modal-quote {
          font-size: 1.2rem;
          font-style: italic;
          color: #eee;
          line-height: 1.6;
          z-index: 1;
        }

        .flip-hint {
          position: absolute;
          bottom: 1.5rem;
          font-size: 0.7rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.6;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}
