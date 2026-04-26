'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { X, Mail, Lock, User, LogIn, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError('Invalid email or password');
        } else {
          onClose();
        }
      } else {
        // Register flow
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Something went wrong');
        } else {
          // Auto login after registration
          await signIn('credentials', {
            email,
            password,
            redirect: false,
          });
          onClose();
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay glass" onClick={onClose}>
      <div className="auth-modal modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Sign in to sync your progress' : 'Join the Vanga typing community'}</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <User size={18} />
              <input
                type="text"
                placeholder="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="input-group">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <Lock size={18} />
            <input
              type="password"
              placeholder="Password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin" size={20} /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="github-btn" onClick={() => signIn('github')}>
          <LogIn size={20} />
          <span>Continue with GitHub</span>
        </button>

        <div className="auth-footer">
          {isLogin ? (
            <p>
              Don&apos;t have an account?{' '}
              <button onClick={() => setIsLogin(false)}>Sign Up</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setIsLogin(true)}>Log In</button>
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        .auth-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.3s ease;
        }

        .auth-modal {
          width: 100%;
          max-width: 400px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          position: relative;
          box-shadow: var(--shadow-2xl);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .close-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: var(--text-primary);
        }

        .auth-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .auth-header h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .auth-header p {
          color: var(--text-muted);
          font-size: var(--text-sm);
        }

        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--color-error);
          padding: 10px;
          border-radius: var(--radius-md);
          font-size: var(--text-xs);
          margin-bottom: var(--space-lg);
          text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .input-group {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 0 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-group:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }

        .input-group :global(svg) {
          color: var(--text-muted);
        }

        .input-group input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 12px 0;
          color: var(--text-primary);
          font-size: var(--text-sm);
          outline: none;
        }

        .submit-btn {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 12px;
          border-radius: var(--radius-md);
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: var(--space-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: var(--space-xl) 0;
          color: var(--text-muted);
          font-size: 0.7rem;
          font-weight: 700;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border-subtle);
        }

        .auth-divider span {
          margin: 0 10px;
        }

        .github-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          color: var(--text-primary);
          font-weight: 600;
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .github-btn:hover {
          background: var(--bg-hover);
          border-color: var(--text-muted);
        }

        .auth-footer {
          margin-top: var(--space-xl);
          text-align: center;
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .auth-footer button {
          background: transparent;
          border: none;
          color: var(--color-primary-light);
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
        }

        .auth-footer button:hover {
          text-decoration: underline;
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
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
