/**
 * BadgeFilter — Category filter tabs for badges
 */

import type { BadgeCategory } from '@/engine/gamification';
import { BADGE_CATEGORIES } from '@/engine/gamification';
import { useState } from 'react';

interface BadgeFilterProps {
  onCategoryChange: (category: BadgeCategory) => void;
  initialCategory?: BadgeCategory;
}

export function BadgeFilter({
  onCategoryChange,
  initialCategory = 'all',
}: BadgeFilterProps) {
  const [activeCategory, setActiveCategory] = useState<BadgeCategory>(initialCategory);

  const categories = Object.entries(BADGE_CATEGORIES) as [BadgeCategory, { label: string; icon: string }][];

  const handleCategoryClick = (category: BadgeCategory) => {
    setActiveCategory(category);
    onCategoryChange(category);
  };

  return (
    <div className="badge-filter">
      <div className="filter-tabs">
        {categories.map(([categoryId, { label, icon }]) => (
          <button
            key={categoryId}
            className={`filter-tab ${activeCategory === categoryId ? 'active' : ''}`}
            onClick={() => handleCategoryClick(categoryId)}
            title={label}
          >
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .badge-filter {
          margin-bottom: var(--space-lg);
        }

        .filter-tabs {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          padding-bottom: var(--space-sm);
          -webkit-overflow-scrolling: touch;
        }

        .filter-tabs::-webkit-scrollbar {
          height: 4px;
        }

        .filter-tabs::-webkit-scrollbar-track {
          background: var(--bg-overlay);
        }

        .filter-tabs::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 2px;
        }

        .filter-tab {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          background: var(--bg-overlay);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-sm) var(--space-md);
          color: var(--text-muted);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .filter-tab:hover {
          border-color: var(--color-primary);
          color: var(--text-primary);
        }

        .filter-tab.active {
          background: var(--bg-surface);
          border-color: var(--color-primary);
          color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.1);
        }

        .tab-icon {
          font-size: 1.1rem;
        }

        .tab-label {
          display: inline;
        }

        @media (max-width: 640px) {
          .tab-label {
            display: none;
          }

          .filter-tab {
            padding: var(--space-sm);
          }
        }
      `}</style>
    </div>
  );
}
