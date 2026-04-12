'use client';

import Link from 'next/link';
import { Keyboard, Zap, BarChart3, Activity, Trophy, Code } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="landing-container animate-fade-in">
      {/* ── Background Effects ── */}
      <div className="bg-gradient-top"></div>
      
      {/* ── Hero Section ── */}
      <main className="hero">
        <div className="badge">
          <Zap className="badge-icon" size={14} />
          <span>The Next Generation Offline Typing App</span>
        </div>

        <h1 className="title">
          <span className="text-tamil">வாங்க</span>
          <span className="text-english gradient-text"> Type </span>
          <span className="text-tamil">பண்ணலாம்</span>
        </h1>
        
        <p className="subtitle">
          Master touch typing in English, Tamil99, and Tanglish. 
          Train smarter with intelligent ghost bots, adaptive heatmaps, and a fully privacy-first offline engine.
        </p>

        <div className="cta-group">
          <Link href="/practice" className="btn btn-primary">
            <Keyboard className="btn-icon" size={20} />
            Start Practicing
          </Link>
          <Link href="/lessons" className="btn btn-secondary">
            <Trophy className="btn-icon" size={20} />
            Begin Lessons
          </Link>
        </div>
      </main>

      {/* ── Features Grid ── */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Code className="feature-icon" size={24} />
          </div>
          <h3>Native Multi-Language</h3>
          <p>Seamlessly hot-swap between standard English, algorithmic Tanglish, or native Tamil99 layouts without reloading.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Activity className="feature-icon" size={24} />
          </div>
          <h3>Ghost Racing Engine</h3>
          <p>Compete real-time against intelligent bots locally. Build speed under pressure and track your explosive WPM growth.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <BarChart3 className="feature-icon" size={24} />
          </div>
          <h3>Premium Analytics</h3>
          <p>Visualize your progress through 365-day practice heatmaps and per-finger accuracy breakdowns.</p>
        </div>
      </section>

      <style jsx>{`
        .landing-container {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-2xl) var(--space-xl);
          font-family: var(--font-sans);
          overflow: hidden;
        }

        .bg-gradient-top {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 800px;
          height: 600px;
          background: radial-gradient(circle, var(--color-primary-alpha) 0%, transparent 60%);
          opacity: 0.15;
          z-index: -1;
          pointer-events: none;
        }

        .hero {
          max-width: 900px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 80px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: var(--space-xl);
          border: 1px solid var(--border-default);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .badge-icon {
          color: var(--color-primary);
        }

        .title {
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: var(--space-md);
          letter-spacing: -0.02em;
          color: var(--text-primary);
        }

        .text-tamil {
          font-family: 'Inter', sans-serif; /* Works for both, but gives local weight */
        }

        .text-english {
          font-family: 'Inter', sans-serif;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--color-primary-light), var(--color-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: clamp(1.1rem, 2vw, 1.4rem);
          color: var(--text-muted);
          max-width: 700px;
          line-height: 1.6;
          margin-bottom: var(--space-2xl);
        }

        .cta-group {
          display: flex;
          gap: var(--space-md);
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: var(--radius-lg);
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
          box-shadow: 0 8px 24px var(--color-primary-alpha);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px var(--color-primary-alpha);
          background: var(--color-primary-light);
        }

        .btn-secondary {
          background: var(--bg-surface);
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }

        .btn-secondary:hover {
          background: var(--bg-hover);
          transform: translateY(-2px);
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-xl);
          max-width: 1100px;
          width: 100%;
        }

        .feature-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          text-align: left;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
          border-color: var(--color-primary-alpha);
        }

        .feature-icon-wrapper {
          width: 48px;
          height: 48px;
          background: var(--bg-hover);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-lg);
          color: var(--color-primary);
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: var(--space-sm);
          color: var(--text-primary);
        }

        .feature-card p {
          color: var(--text-muted);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .cta-group {
            flex-direction: column;
            width: 100%;
          }
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
