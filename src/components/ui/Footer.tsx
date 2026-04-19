'use client';

/**
 * VangaTypePanalam — Footer
 *
 * Minimal footer for scrollable pages (Stats, Lessons).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (pathname === '/') return null;

  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">VANGA</span>
          <span className="footer-tagline">Master typing in your language.</span>
        </div>

        <div className="footer-links">
          <a href="https://github.com/Unknown27s/VagaTypePanalam" target="_blank" rel="noopener noreferrer" className="footer-link">
            GitHub
          </a>
          <a href="https://github.com/Unknown27s/VagaTypePanalam/issues/new" target="_blank" rel="noopener noreferrer" className="footer-link">
            Feedback
          </a>
          <span className="footer-divider">•</span>
          <Link href="/" className="footer-link">Practice</Link>
          <Link href="/stats" className="footer-link">Stats</Link>
        </div>
      </div>

      <style jsx>{`
        .footer-container {
          border-top: 1px solid var(--border-subtle);
          padding: var(--space-xl) 0;
          margin-top: auto;
        }

        .footer-inner {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-xl);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-lg);
        }

        .footer-brand {
          display: flex;
          align-items: baseline;
          gap: var(--space-sm);
        }

        .footer-logo {
          font-weight: 800;
          letter-spacing: -0.04em;
          color: var(--text-primary);
        }

        .footer-tagline {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .footer-link {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          transition: color 0.15s;
        }

        .footer-link:hover {
          color: var(--color-primary-light);
        }

        .footer-divider {
          color: var(--border-default);
          font-size: var(--text-xs);
        }

        @media (max-width: 600px) {
          .footer-inner {
            flex-direction: column;
            text-align: center;
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
