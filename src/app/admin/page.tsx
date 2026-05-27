'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users, Award, Star, Calendar, Plus, Trash2, Edit3, X,
  Check, RefreshCw, BookOpen, Activity, Flame, Zap,
  Eye, ShieldAlert, CheckCircle, Upload
} from 'lucide-react';
import { useGamificationStore } from '@/store/gamificationStore';
import { parseEpub, EpubChapter } from '@/lib/epubParser';
import type { PracticeBook } from '@prisma/client';
import type {
  AdminTab,
  AdminUser,
  SystemAggregates,
  BookFormData,
  RankFormData,
  BadgeFormData,
  EventFormData,
  CloudBackupSession,
} from '@/types/admin';

export default function AdminDashboard() {
  const isOffline = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';
  const isDevView = process.env.NEXT_PUBLIC_ADMIN_DEV_VIEW === 'true';
  const { data: session, status } = useSession();
  const router = useRouter();

  // Navigation & Data Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { ranks, badges, events, fetchGamification, loading } = useGamificationStore();

  // Custom states
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [books, setBooks] = useState<PracticeBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  // Inspector Modal
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Form states — union type, each tab narrows it
  const [editingItem, setEditingItem] = useState<BookFormData | RankFormData | BadgeFormData | EventFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EPUB & TXT File upload helper states
  const [parsedEpub, setParsedEpub] = useState<{ title: string; chapters: EpubChapter[] } | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, boolean>>({});
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsParsingFile(true);
    setParsedEpub(null);

    try {
      if (file.name.endsWith('.epub')) {
        const parsed = await parseEpub(file);
        setParsedEpub(parsed);
        
        // Initialize checked chapters using parser's pre-check heuristics
        const initialSelected: Record<string, boolean> = {};
        parsed.chapters.forEach(ch => {
          initialSelected[ch.id] = ch.isPreChecked;
        });
        setSelectedChapters(initialSelected);

        // Pre-fill Title field in Form
        if (editingItem && activeTab === 'books') {
          const currentBook = editingItem as BookFormData;
          setEditingItem({
            ...currentBook,
            title: parsed.title
          });
        }
      } else if (file.name.endsWith('.txt')) {
        const text = await file.text();
        const title = file.name.replace(/\.[^/.]+$/, '');
        if (editingItem && activeTab === 'books') {
          const currentBook = editingItem as BookFormData;
          setEditingItem({
            ...currentBook,
            title,
            content: text
          });
        }
      } else {
        setFileError('Unsupported file type. Please upload a .epub or .txt file.');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setFileError(`Failed to parse book file: ${err.message || 'Unknown error'}`);
    } finally {
      setIsParsingFile(false);
      // Reset input value so same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  // Authorization: dev bypass OR real admin role check
  const isAdmin = isDevView || (session?.user?.role === 'ADMIN');

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchUsers();
    } else if (activeTab === 'books') {
      fetchBooks();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const res = await fetch('/api/admin/books');
      if (res.ok) {
        const data = await res.json();
        setBooks(data);
      }
    } catch (err) {
      console.error('Fetch books error:', err);
    } finally {
      setBooksLoading(false);
    }
  };

  // Generic Save for Gamification / Books
  const handleSave = async (e: React.FormEvent, type: AdminTab) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isBook = type === 'books';
    const endpoint = isBook ? '/api/admin/books' : `/api/admin/gamification/${type}`;
    const method = editingItem && 'id' in editingItem && editingItem.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setEditingItem(null);
        if (isBook) {
          await fetchBooks();
        } else {
          await fetchGamification();
        }
      } else {
        const errData = await res.json();
        alert(`Failed to save: ${errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Network error saving details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: AdminTab) => {
    if (!confirm('Are you sure you want to delete this item? This action is permanent.')) return;

    const isBook = type === 'books';
    const endpoint = isBook ? `/api/admin/books?id=${id}` : `/api/admin/gamification/${type}?id=${id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        if (isBook) {
          await fetchBooks();
        } else {
          await fetchGamification();
        }
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSetBookActive = async (id: string) => {
    try {
      const res = await fetch('/api/admin/books', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: true }),
      });
      if (res.ok) {
        await fetchBooks();
      } else {
        alert('Failed to make book active');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper Calculations for Overview Tab
  const systemAggregates = () => {
    let totalSessions = 0;
    let wpmSum = 0;
    let usersWithStats = 0;

    users.forEach(u => {
      const profile = u.cloudBackup?.profile;
      if (profile) {
        totalSessions += profile.totalSessions ?? 0;
        if (profile.bestWpm > 0) {
          // Approximate speed average from best Wpm or session logs
          wpmSum += profile.bestWpm;
          usersWithStats++;
        }
      }
    });

    const averageWpm = usersWithStats > 0 ? Math.round(wpmSum / usersWithStats) : 0;

    return {
      totalSessions,
      averageWpm,
      totalBooks: books.length || 0,
    };
  };

  const stats = systemAggregates();

  if (status === 'loading' || loading) {
    return (
      <div className="loading-container">
        <RefreshCw size={24} className="animate-spin" />
        <span>Syncing admin credentials...</span>
      </div>
    );
  }

  // Strictly protect route client-side (unauthorized screen if not an admin)
  if (isAdmin) {
    return (
      <main className="unauthorized-shell">
        <div className="error-panel">
          <ShieldAlert size={48} className="error-icon" />
          <h2>Access Denied</h2>
          <p>You do not have administrative privileges to access Admin Central.</p>
          <button className="btn btn-primary" onClick={() => router.push('/')}>
            Back to Practice
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page-shell animate-fade-in">
      <div className="admin-glass-container">

        {/* ── Dashboard Header ── */}
        <header className="admin-dashboard-header">
          <div className="header-brand-box">
            <div className="brand-badge">⚡</div>
            <div className="brand-texts">
              <h1>Admin Central</h1>
              <p>System configuration, typist metrics, and gamification controls</p>
            </div>
          </div>

          <div className="admin-session-badge">
            {session?.user?.image ? (
              <img src={session.user.image} alt="" className="admin-session-avatar" />
            ) : (
              <div className="admin-session-fallback">{session?.user?.name?.charAt(0)}</div>
            )}
            <div className="badge-details">
              <span className="badge-name">{session?.user?.name}</span>
              <span className="badge-role">System Admin</span>
            </div>
          </div>
        </header>

        {/* ── Navigation Tabs ── */}
        <nav className="admin-nav-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Users size={16} />
            <span>Overview</span>
          </button>
          <button className={activeTab === 'books' ? 'active' : ''} onClick={() => setActiveTab('books')}>
            <BookOpen size={16} />
            <span>Weekly Books</span>
          </button>
          <button className={activeTab === 'ranks' ? 'active' : ''} onClick={() => setActiveTab('ranks')}>
            <Star size={16} />
            <span>Ranks</span>
          </button>
          <button className={activeTab === 'badges' ? 'active' : ''} onClick={() => setActiveTab('badges')}>
            <Award size={16} />
            <span>Badges</span>
          </button>
          <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>
            <Calendar size={16} />
            <span>Events</span>
          </button>
        </nav>

        {/* ── Main Dashboard Body ── */}
        <div className="admin-body-area">
          {isOffline && (
            <div className="offline-alert-box">
              <ShieldAlert size={16} />
              <span><strong>Offline Simulation Mode:</strong> Local mock synchronization is active. Changes won't hit live production database.</span>
            </div>
          )}

          {/* ════════════ OVERVIEW TAB ════════════ */}
          {activeTab === 'overview' && (
            <div className="fade-in tab-section">
              <div className="admin-metrics-grid">
                <div className="metric-card-glass">
                  <div className="m-icon purple"><Users size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">Registered Typists</span>
                    <span className="m-value">{users.length}</span>
                  </div>
                </div>
                <div className="metric-card-glass">
                  <div className="m-icon green"><Activity size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">System-wide Sessions</span>
                    <span className="m-value">{stats.totalSessions}</span>
                  </div>
                </div>
                <div className="metric-card-glass">
                  <div className="m-icon orange"><Zap size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">Average Typist Speed</span>
                    <span className="m-value">{stats.averageWpm} <small>WPM</small></span>
                  </div>
                </div>
                <div className="metric-card-glass">
                  <div className="m-icon blue"><BookOpen size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">Weekly Practice Books</span>
                    <span className="m-value">{stats.totalBooks}</span>
                  </div>
                </div>
              </div>

              {/* Typists Table */}
              <div className="table-surface-card">
                <div className="table-card-header">
                  <h2>Active Typists</h2>
                  <button className="btn btn-secondary btn-icon" onClick={fetchUsers}>
                    <RefreshCw size={14} className={userLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                {userLoading ? (
                  <div className="spinner-shell"><RefreshCw className="animate-spin" /> Loading typists...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Typist</th>
                          <th>Email Address</th>
                          <th>Role</th>
                          <th>Total Practice</th>
                          <th>Best WPM</th>
                          <th>Streak</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const hasBackup = !!u.cloudBackup;
                          const profile = u.cloudBackup?.profile;

                          return (
                            <tr key={u.id}>
                              <td>
                                <div className="user-profile-cell">
                                  {u.image ? (
                                    <img src={u.image} alt="" className="table-avatar" />
                                  ) : (
                                    <div className="table-avatar-placeholder">{u.name?.charAt(0)}</div>
                                  )}
                                  <div className="user-name-wrapper">
                                    <span className="user-main-name">{u.name || 'Anonymous Typist'}</span>
                                    <span className="user-join-date">Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </td>
                              <td><span className="user-email">{u.email}</span></td>
                              <td>
                                <span className={`table-role-badge ${u.role.toLowerCase()}`}>{u.role}</span>
                              </td>
                              <td>
                                {hasBackup && profile ? (
                                  <span className="profile-stat-count">
                                    <strong>{profile.totalSessions ?? 0}</strong> sessions
                                  </span>
                                ) : (
                                  <span className="stat-missing">—</span>
                                )}
                              </td>
                              <td>
                                {hasBackup && profile?.bestWpm ? (
                                  <span className="profile-speed-tag">
                                    <Zap size={12} />
                                    {profile.bestWpm} WPM
                                  </span>
                                ) : (
                                  <span className="stat-missing">—</span>
                                )}
                              </td>
                              <td>
                                {hasBackup && profile && (profile.currentStreak ?? 0) > 0 ? (
                                  <span className="profile-streak-tag">
                                    <Flame size={12} />
                                    {profile.currentStreak} Days
                                  </span>
                                ) : (
                                  <span className="stat-missing">—</span>
                                )}
                              </td>
                              <td className="text-right">
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSelectedUser(u)}
                                  disabled={!hasBackup}
                                  title={hasBackup ? 'Inspect typing telemetry' : 'No telemetry synced yet'}
                                >
                                  <Eye size={12} />
                                  <span>Inspect</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ WEEKLY BOOKS TAB ════════════ */}
          {activeTab === 'books' && (
            <div className="fade-in tab-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <h2>Practice Books & Word Pools</h2>
                  <p>Upload raw literature or customized word lists to generate weekly typing practices.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingItem({ title: '', description: '', content: '', isActive: false })}
                >
                  <Plus size={16} />
                  <span>Import New Book</span>
                </button>
              </div>

              {editingItem && activeTab === 'books' && (() => {
                const bookItem = editingItem as BookFormData;
                return (
                  <div className="modal-overlay">
                    <form onSubmit={(e) => handleSave(e, 'books')} className="admin-modal-form modal-content animate-fade-in">
                      <div className="modal-header">
                        <h3>{bookItem.id ? 'Edit Practice Book' : 'Import Practice Book'}</h3>
                        <button type="button" className="close-modal-btn" onClick={() => { setEditingItem(null); setParsedEpub(null); setSelectedChapters({}); setFileError(null); }}><X size={18} /></button>
                      </div>

                      <div className="modal-body">
                        <div className="form-group-block">
                          <label>Book / Word-List Title</label>
                          <input
                            placeholder="e.g. Thirukkural, Alice in Wonderland"
                            value={bookItem.title}
                            onChange={e => setEditingItem({ ...bookItem, title: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group-block">
                          <label>Short Description (Optional)</label>
                          <input
                            placeholder="e.g. Tamil vocabulary practice, English classic literature"
                            value={bookItem.description || ''}
                            onChange={e => setEditingItem({ ...bookItem, description: e.target.value })}
                          />
                        </div>

                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Active From</label>
                            <input
                              type="date"
                              value={bookItem.startDate ? new Date(bookItem.startDate).toISOString().split('T')[0] : ''}
                              onChange={e => setEditingItem({ ...bookItem, startDate: e.target.value || null })}
                            />
                          </div>
                          <div className="form-group-block">
                            <label>Active Until</label>
                            <input
                              type="date"
                              value={bookItem.endDate ? new Date(bookItem.endDate).toISOString().split('T')[0] : ''}
                              onChange={e => setEditingItem({ ...bookItem, endDate: e.target.value || null })}
                            />
                          </div>
                        </div>

                        <div className="form-group-block checkbox-block">
                          <input
                            type="checkbox"
                            id="book-is-active"
                            checked={!!bookItem.isActive}
                            onChange={e => setEditingItem({ ...bookItem, isActive: e.target.checked })}
                          />
                          <label htmlFor="book-is-active">Make this the Active Book of the Week immediately</label>
                        </div>

                        {/* File Upload Zone */}
                        <div className="form-group-block">
                          <label>Or Upload Book File (.epub, .txt)</label>
                          <div className="file-upload-zone">
                            {isParsingFile ? (
                              <div className="spinner-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <RefreshCw className="animate-spin" size={24} />
                                <span className="upload-title">Parsing file contents...</span>
                              </div>
                            ) : (
                              <>
                                <div className="upload-icon-wrap">
                                  <Upload size={24} />
                                </div>
                                <span className="upload-title">Click or drag book file here</span>
                                <span className="upload-subtitle">Supports EPUB and TXT files</span>
                                <input
                                  type="file"
                                  className="file-upload-input"
                                  accept=".epub,.txt"
                                  onChange={handleFileUpload}
                                />
                              </>
                            )}
                          </div>
                          {fileError && (
                            <div className="upload-error-banner animate-fade-in">
                              <ShieldAlert size={14} />
                              <span>{fileError}</span>
                            </div>
                          )}
                        </div>

                        {parsedEpub ? (
                          <div className="epub-chapter-selector-card animate-fade-in">
                            <div className="selector-header">
                              <h4>Select Chapters to Import</h4>
                              <div className="selector-actions">
                                <button
                                  type="button"
                                  className="text-action-btn"
                                  onClick={() => {
                                    const allChecked: Record<string, boolean> = {};
                                    parsedEpub.chapters.forEach(ch => {
                                      allChecked[ch.id] = true;
                                    });
                                    setSelectedChapters(allChecked);
                                  }}
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  className="text-action-btn"
                                  onClick={() => {
                                    const noneChecked: Record<string, boolean> = {};
                                    parsedEpub.chapters.forEach(ch => {
                                      noneChecked[ch.id] = false;
                                    });
                                    setSelectedChapters(noneChecked);
                                  }}
                                >
                                  Clear All
                                </button>
                              </div>
                            </div>

                            <div className="chapters-scroll-area">
                              {parsedEpub.chapters.map(ch => {
                                const isChecked = !!selectedChapters[ch.id];
                                return (
                                  <div key={ch.id} className={`chapter-row ${isChecked ? 'is-checked' : ''}`}>
                                    <label className="chapter-check-label">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setSelectedChapters(prev => ({
                                            ...prev,
                                            [ch.id]: !prev[ch.id]
                                          }));
                                        }}
                                      />
                                      <span className="chapter-title-text">{ch.title}</span>
                                      {!ch.isPreChecked && (
                                        <span className="chapter-meta-tag">Preamble</span>
                                      )}
                                    </label>
                                    <span className="chapter-char-count">{ch.characterCount.toLocaleString()} chars</span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="chapters-summary-bar">
                              <span>
                                Selected: <strong>{
                                  parsedEpub.chapters.filter(ch => selectedChapters[ch.id]).length
                                }</strong> / {parsedEpub.chapters.length} chapters
                              </span>
                              <span>
                                Est. Characters: <strong>{
                                  parsedEpub.chapters
                                    .filter(ch => selectedChapters[ch.id])
                                    .reduce((acc, ch) => acc + ch.characterCount, 0)
                                    .toLocaleString()
                                }</strong>
                              </span>
                            </div>

                            <div className="chapters-apply-row">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  const text = parsedEpub.chapters
                                    .filter(ch => selectedChapters[ch.id])
                                    .map(ch => ch.content)
                                    .join('\n\n');
                                  
                                  setEditingItem({
                                    ...bookItem,
                                    content: text
                                  });
                                  setParsedEpub(null); // Return to plain content editor
                                }}
                              >
                                Apply Selection
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setParsedEpub(null)}
                              >
                                Cancel Import
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="form-group-block">
                            <label>Raw Content (Paste entire book chapters or word pool here)</label>
                            <textarea
                              placeholder="Type or paste words here. Punctuation will be sanitized, and all unique words extracted automatically."
                              value={bookItem.content}
                              onChange={e => setEditingItem({ ...bookItem, content: e.target.value })}
                              rows={8}
                              required
                            />
                          </div>
                        )}
                      </div>

                      <div className="modal-actions-row">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                          {isSubmitting ? 'Processing & Tokenizing...' : <><Check size={16} /> Save Book</>}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => { setEditingItem(null); setParsedEpub(null); setSelectedChapters({}); setFileError(null); }}>Cancel</button>
                      </div>
                    </form>
                  </div>
                );
              })()}
              {booksLoading ? (
                <div className="spinner-shell"><RefreshCw className="animate-spin" /> Loading word databases...</div>
              ) : (
                <div className="admin-list-container">
                  {books.length === 0 ? (
                    <div className="empty-section-alert">
                      <BookOpen size={36} />
                      <p>No custom books uploaded yet. Click "Import New Book" at the top right to start.</p>
                    </div>
                  ) : (
                    <div className="books-grid">
                      {books.map(b => (
                        <div key={b.id} className={`book-card-glass ${b.isActive ? 'active-border' : ''}`}>
                          <div className="book-card-header">
                            <div className="book-titles">
                              <div className="title-row">
                                <h3>{b.title}</h3>
                                {b.isActive && <span className="active-tag"><CheckCircle size={10} /> Active</span>}
                              </div>
                              {b.description && <p className="book-desc">{b.description}</p>}
                            </div>
                            <div className="book-actions">
                              <button className="icon-btn-secondary" onClick={() => setEditingItem(b)} title="Edit Book"><Edit3 size={14} /></button>
                              <button className="icon-btn-danger" onClick={() => handleDelete(b.id, 'books')} title="Delete Book"><Trash2 size={14} /></button>
                            </div>
                          </div>

                          <div className="book-stats-row">
                            <div className="b-stat">
                              <span className="b-stat-label">Unique Words</span>
                              <span className="b-stat-val">{(b.words as string[]).length}</span>
                            </div>
                            <div className="b-stat">
                              <span className="b-stat-label">File Size</span>
                              <span className="b-stat-val">{Math.round(b.content.length / 1024)} KB</span>
                            </div>
                            <div className="b-stat">
                              <span className="b-stat-label">Schedule</span>
                              <span className="b-stat-val date-val">
                                {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'Immediate'} - {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'Forever'}
                              </span>
                            </div>
                          </div>

                          {!b.isActive && (
                            <button className="btn btn-secondary btn-full btn-active-book" onClick={() => handleSetBookActive(b.id)}>
                              Set as Book of the Week
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════════ RANKS TAB ════════════ */}
          {activeTab === 'ranks' && (
            <div className="fade-in tab-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <h2>System Ranks</h2>
                  <p>Define global touch-typing titles earned by typists depending on their average speeds.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingItem({ type: '', title: '', minWpm: 0, maxWpm: 0, svgContent: '' })}
                >
                  <Plus size={16} />
                  <span>Add New Rank</span>
                </button>
              </div>

              {editingItem && activeTab === 'ranks' && (() => {
                const rankItem = editingItem as RankFormData;
                return (
                  <div className="modal-overlay">
                    <form onSubmit={(e) => handleSave(e, 'ranks')} className="admin-modal-form modal-content animate-fade-in">
                      <div className="modal-header">
                        <h3>{rankItem.id ? 'Edit Rank Title' : 'Create System Rank'}</h3>
                        <button type="button" className="close-modal-btn" onClick={() => setEditingItem(null)}><X size={18} /></button>
                      </div>

                      <div className="modal-body">
                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Internal Key</label>
                            <input placeholder="beginner" value={rankItem.type} onChange={e => setEditingItem({ ...rankItem, type: e.target.value })} required />
                          </div>
                          <div className="form-group-block">
                            <label>Display Title</label>
                            <input placeholder="Beginner" value={rankItem.title} onChange={e => setEditingItem({ ...rankItem, title: e.target.value })} required />
                          </div>
                        </div>

                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Minimum WPM Threshold</label>
                            <input type="number" value={rankItem.minWpm} onChange={e => setEditingItem({ ...rankItem, minWpm: parseInt(e.target.value) })} required />
                          </div>
                          <div className="form-group-block">
                            <label>Maximum WPM Threshold</label>
                            <input type="number" value={rankItem.maxWpm} onChange={e => setEditingItem({ ...rankItem, maxWpm: parseInt(e.target.value) })} required />
                          </div>
                        </div>

                        <div className="form-group-block">
                          <label>Rank SVG/Visual representation</label>
                          <textarea placeholder="e.g. 🌱 or raw SVG code <svg>...</svg>" value={rankItem.svgContent || ''} onChange={e => setEditingItem({ ...rankItem, svgContent: e.target.value })} rows={6} />
                        </div>
                      </div>

                      <div className="modal-actions-row">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving Rank...' : <><Check size={16} /> Save Rank</>}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                );
              })()}

              <div className="ranks-grid">
                {ranks.map(r => (
                  <div key={r.id} className="rank-card-glass">
                    <div className="rank-card-header">
                      <div className="rank-visual" dangerouslySetInnerHTML={{ __html: r.svgContent || '🌱' }} />
                      <div className="rank-card-actions">
                        <button className="icon-btn-secondary" onClick={() => setEditingItem(r)}><Edit3 size={12} /></button>
                        <button className="icon-btn-danger" onClick={() => handleDelete(r.id, 'ranks')}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <div className="rank-card-body">
                      <h3>{r.title}</h3>
                      <span className="rank-key-sub">{r.type}</span>
                      <div className="wpm-range-block">
                        <div className="wpm-track">
                          <div className="wpm-fill" style={{ width: `${Math.min(100, (r.minWpm / 110) * 100)}%` }} />
                        </div>
                        <div className="wpm-values">
                          <span>{r.minWpm} WPM</span>
                          <span>{r.maxWpm === 9999 ? '∞' : `${r.maxWpm} WPM`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ BADGES TAB ════════════ */}
          {activeTab === 'badges' && (
            <div className="fade-in tab-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <h2>Achievement Badges</h2>
                  <p>Create and edit achievements earned by completing specific milestones (speed, dedication, streaks).</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingItem({ badgeId: '', title: '', description: '', rarity: 'common', category: 'speed', svgContent: '' })}
                >
                  <Plus size={16} />
                  <span>Create Badge</span>
                </button>
              </div>

              {editingItem && activeTab === 'badges' && (() => {
                const badgeItem = editingItem as BadgeFormData;
                return (
                  <div className="modal-overlay">
                    <form onSubmit={(e) => handleSave(e, 'badges')} className="admin-modal-form modal-content animate-fade-in">
                      <div className="modal-header">
                        <h3>{badgeItem.id ? 'Edit Achievement Badge' : 'New Achievement Badge'}</h3>
                        <button type="button" className="close-modal-btn" onClick={() => setEditingItem(null)}><X size={18} /></button>
                      </div>

                      <div className="modal-body">
                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Internal ID</label>
                            <input placeholder="speed-demon" value={badgeItem.badgeId} onChange={e => setEditingItem({ ...badgeItem, badgeId: e.target.value })} required />
                          </div>
                          <div className="form-group-block">
                            <label>Display Title</label>
                            <input placeholder="Speed Demon" value={badgeItem.title} onChange={e => setEditingItem({ ...badgeItem, title: e.target.value })} required />
                          </div>
                        </div>

                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Rarity Tier</label>
                            <select value={badgeItem.rarity} onChange={e => setEditingItem({ ...badgeItem, rarity: e.target.value })}>
                              <option value="common">Common</option>
                              <option value="uncommon">Uncommon</option>
                              <option value="rare">Rare</option>
                              <option value="epic">Epic</option>
                              <option value="legendary">Legendary</option>
                            </select>
                          </div>
                          <div className="form-group-block">
                            <label>Objective Category</label>
                            <select value={badgeItem.category || ''} onChange={e => setEditingItem({ ...badgeItem, category: e.target.value })}>
                              <option value="speed">Speed</option>
                              <option value="accuracy">Accuracy</option>
                              <option value="dedication">Dedication</option>
                              <option value="learning">Learning</option>
                              <option value="mastery">Mastery</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group-block">
                          <label>Description of Criteria</label>
                          <input placeholder="Type at 50 WPM or higher in a single session" value={badgeItem.description} onChange={e => setEditingItem({ ...badgeItem, description: e.target.value })} required />
                        </div>

                        <div className="form-group-block">
                          <label>Flavor Quote (Optional)</label>
                          <input placeholder="Speed is the companion of mastery..." value={badgeItem.quote || ''} onChange={e => setEditingItem({ ...badgeItem, quote: e.target.value })} />
                        </div>

                        <div className="form-group-block">
                          <label>Badge SVG Vector Art</label>
                          <textarea placeholder="Paste <svg> code here" value={badgeItem.svgContent || ''} onChange={e => setEditingItem({ ...badgeItem, svgContent: e.target.value })} rows={5} />
                        </div>
                      </div>

                      <div className="modal-actions-row">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving Badge...' : <><Check size={16} /> Save Badge</>}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                );
              })()}

              <div className="badges-grid-admin">
                {badges.map(b => (
                  <div key={b.id} className="badge-card-admin-glass">
                    <div className="badge-card-header">
                      <div className="badge-vector" dangerouslySetInnerHTML={{ __html: b.svgContent || '🏅' }} />
                      <span className={`badge-rarity-badge ${b.rarity}`}>{b.rarity}</span>
                    </div>
                    <div className="badge-card-body">
                      <h3>{b.title}</h3>
                      <p className="badge-desc">{b.description}</p>
                      {b.quote && <p className="badge-quote">"{b.quote}"</p>}
                    </div>
                    <div className="badge-card-footer">
                      <span className="badge-category-tag">{b.category}</span>
                      <div className="badge-actions">
                        <button className="icon-btn-secondary" onClick={() => setEditingItem(b)}><Edit3 size={12} /></button>
                        <button className="icon-btn-danger" onClick={() => handleDelete(b.id, 'badges')}><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════ EVENTS TAB ════════════ */}
          {activeTab === 'events' && (
            <div className="fade-in tab-section">
              <div className="section-header-row">
                <div className="section-title-wrap">
                  <h2>Season Challenges & Events</h2>
                  <p>Schedule seasonal events, time-boxed typing targets, and assign reward badges directly.</p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingItem({ title: '', description: '', targetType: 'wpm', targetValue: 0, rewardBadge: badges[0]?.badgeId || '', activeFrom: null, activeTo: null, svgContent: '' })}
                >
                  <Plus size={16} />
                  <span>Launch Event</span>
                </button>
              </div>

              {editingItem && activeTab === 'events' && (() => {
                const eventItem = editingItem as EventFormData;
                return (
                  <div className="modal-overlay">
                    <form onSubmit={(e) => handleSave(e, 'events')} className="admin-modal-form modal-content animate-fade-in">
                      <div className="modal-header">
                        <h3>{eventItem.id ? 'Edit Season Challenge' : 'New Season Challenge'}</h3>
                        <button type="button" className="close-modal-btn" onClick={() => setEditingItem(null)}><X size={18} /></button>
                      </div>

                      <div className="modal-body">
                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Challenge Event Title</label>
                            <input placeholder="Summer Sprint 2026" value={eventItem.title} onChange={e => setEditingItem({ ...eventItem, title: e.target.value })} required />
                          </div>
                          <div className="form-group-block">
                            <label>Reward Achievement Badge</label>
                            <select value={eventItem.rewardBadge || ''} onChange={e => setEditingItem({ ...eventItem, rewardBadge: e.target.value })}>
                              <option value="">No Badge Reward</option>
                              {badges.map(b => (
                                <option key={b.badgeId} value={b.badgeId}>{b.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Target Criteria Metric</label>
                            <select value={eventItem.targetType} onChange={e => setEditingItem({ ...eventItem, targetType: e.target.value })}>
                              <option value="wpm">WPM (Speed)</option>
                              <option value="accuracy">Accuracy (Precision)</option>
                              <option value="streak">Streak Days (Dedication)</option>
                              <option value="sessions">Practiced Sessions (Volume)</option>
                            </select>
                          </div>
                          <div className="form-group-block">
                            <label>Goal Target Value</label>
                            <input type="number" placeholder="e.g. 70" value={eventItem.targetValue} onChange={e => setEditingItem({ ...eventItem, targetValue: parseInt(e.target.value) })} required />
                          </div>
                        </div>

                        <div className="form-double-grid">
                          <div className="form-group-block">
                            <label>Challenge Active From</label>
                            <input
                              type="date"
                              value={eventItem.activeFrom ? new Date(eventItem.activeFrom).toISOString().split('T')[0] : ''}
                              onChange={e => setEditingItem({ ...eventItem, activeFrom: e.target.value || null })}
                            />
                          </div>
                          <div className="form-group-block">
                            <label>Challenge Active To</label>
                            <input
                              type="date"
                              value={eventItem.activeTo ? new Date(eventItem.activeTo).toISOString().split('T')[0] : ''}
                              onChange={e => setEditingItem({ ...eventItem, activeTo: e.target.value || null })}
                            />
                          </div>
                        </div>

                        <div className="form-group-block">
                          <label>Description of challenge instructions</label>
                          <input placeholder="Reach 75 WPM at least once this month to earn the Speed Breaker badge" value={eventItem.description} onChange={e => setEditingItem({ ...eventItem, description: e.target.value })} required />
                        </div>

                        <div className="form-group-block">
                          <label>Challenge SVG artwork</label>
                          <textarea placeholder="Paste SVG element raw code here" value={eventItem.svgContent || ''} onChange={e => setEditingItem({ ...eventItem, svgContent: e.target.value })} rows={4} />
                        </div>
                      </div>

                      <div className="modal-actions-row">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                          {isSubmitting ? 'Launching challenge...' : <><Check size={16} /> Launch Event</>}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                );
              })()}

              <div className="events-list-admin">
                {events.map(ev => (
                  <div key={ev.id} className="event-item-glass-card">
                    <div className="event-visual" dangerouslySetInnerHTML={{ __html: ev.svgContent || '📅' }} />
                    <div className="event-info-wrapper">
                      <div className="event-title-row">
                        <h3>{ev.title}</h3>
                        <div className="event-schedule-tag">
                          {ev.activeFrom ? new Date(ev.activeFrom).toLocaleDateString() : 'Immediate'} - {ev.activeTo ? new Date(ev.activeTo).toLocaleDateString() : 'Endless'}
                        </div>
                      </div>
                      <p className="event-desc">{ev.description}</p>
                      <div className="event-target-badges">
                        <span className="target-pill">Target: {ev.targetValue} {ev.targetType.toUpperCase()}</span>
                        {ev.rewardBadge && (
                          <span className="reward-pill">Reward: {ev.rewardBadge}</span>
                        )}
                      </div>
                    </div>
                    <div className="event-actions">
                      <button className="icon-btn-secondary" onClick={() => setEditingItem(ev)}><Edit3 size={14} /></button>
                      <button className="icon-btn-danger" onClick={() => handleDelete(ev.id, 'events')}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════ INPECTOR PROFILE MODAL ════════════ */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="inspector-modal modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="user-details-title">
                {selectedUser.image ? (
                  <img src={selectedUser.image} alt="" className="modal-header-avatar" />
                ) : (
                  <div className="modal-header-avatar-fallback">{selectedUser.name?.charAt(0)}</div>
                )}
                <div className="user-header-text">
                  <h3>{selectedUser.name || 'Anonymous Typist'}</h3>
                  <p>{selectedUser.email}</p>
                </div>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setSelectedUser(null)}><X size={18} /></button>
            </div>

            <div className="modal-body user-profile-telemetry">
              {/* Telemetry Summary Cards */}
              <div className="telemetry-grid">
                <div className="t-card">
                  <span className="t-label">LEVEL</span>
                  <span className="t-val">{selectedUser.cloudBackup?.profile?.currentLevel ?? 1}</span>
                </div>
                <div className="t-card">
                  <span className="t-label">BEST SPEED</span>
                  <span className="t-val speed">{selectedUser.cloudBackup?.profile?.bestWpm ?? 0} <small>WPM</small></span>
                </div>
                <div className="t-card">
                  <span className="t-label">STREAK</span>
                  <span className="t-val streak">{selectedUser.cloudBackup?.profile?.currentStreak ?? 0} <small>Days</small></span>
                </div>
                <div className="t-card">
                  <span className="t-label">TOTAL TIME</span>
                  <span className="t-val">
                    {Math.round((selectedUser.cloudBackup?.profile?.totalTimeMs ?? 0) / 60000)} <small>min</small>
                  </span>
                </div>
              </div>

              {/* Heatmap / Activity View */}
              {selectedUser.cloudBackup?.profile?.dailyActivity && (
                <div className="telemetry-activity-section">
                  <h4>Daily Practice Heatmap (minutes)</h4>
                  <div className="heatmap-block">
                    {Object.entries(selectedUser.cloudBackup?.profile?.dailyActivity ?? {}).slice(-20).map(([day, timeMs]) => (
                      <div key={day} className="heatmap-node" title={`${day}: ${Math.round((timeMs as number) / 60000)} minutes`}>
                        <span className="node-date">{day.substring(5)}</span>
                        <div className="node-box" style={{
                          opacity: Math.max(0.15, Math.min(1, ((timeMs as number) / 60000) / 30)),
                          background: 'var(--color-primary)'
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync Sessions Log */}
              {selectedUser.cloudBackup?.sessions && selectedUser.cloudBackup.sessions.length > 0 && (
                <div className="telemetry-sessions-log">
                  <h4>Recent Completed Sessions</h4>
                  <div className="telemetry-log-table-shell">
                    <table className="telemetry-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Language</th>
                          <th>Practice Mode</th>
                          <th>WPM</th>
                          <th>Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.cloudBackup.sessions.slice(-5).reverse().map((s: any, idx: number) => (
                          <tr key={s.id || idx}>
                            <td>{new Date(s.startedAt).toLocaleDateString()}</td>
                            <td><span className="lang-tag">{s.language}</span></td>
                            <td><span className="mode-tag">{s.mode}</span></td>
                            <td className="wpm-val">{Math.round(s.wpm)}</td>
                            <td className="acc-val">{Math.round(s.accuracy * 100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-full" onClick={() => setSelectedUser(null)}>
                Dismiss Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ═══════════════════════════════════════════
           VangaTypePanalam — Admin Dashboard (Standardized Styling)
           ═══════════════════════════════════════════ */

        .admin-page-shell {
          width: 100%;
          max-width: var(--max-width);
          margin: 0 auto;
          padding: var(--space-xl) var(--space-lg);
        }

        .admin-glass-container {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          min-height: 400px;
          color: var(--text-muted);
          font-size: var(--text-sm);
        }

        /* ── Header ── */
        .admin-dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-xl) var(--space-xl) 0;
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
          gap: var(--space-lg);
        }

        .header-brand-box {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .brand-badge {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          color: white;
          box-shadow: 0 0 20px var(--color-primary-glow);
          flex-shrink: 0;
        }

        .brand-texts h1 {
          font-size: var(--text-2xl);
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.1;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .brand-texts p {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 4px 0 0;
        }

        .admin-session-badge {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          padding: 6px 14px;
          border-radius: var(--radius-full);
        }

        .admin-session-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid var(--color-primary-light);
        }

        .admin-session-fallback {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--bg-overlay);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-sm);
        }

        .badge-details {
          display: flex;
          flex-direction: column;
        }

        .badge-name {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .badge-role {
          font-size: 9px;
          color: var(--color-primary-light);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 2px;
        }

        /* ── Tabs Navigation ── */
        .admin-nav-tabs {
          display: flex;
          gap: var(--space-xs);
          padding: 0 var(--space-xl);
          border-bottom: 1px solid var(--border-subtle);
          overflow-x: auto;
        }

        .admin-nav-tabs button {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 10px 18px;
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
        }

        .admin-nav-tabs button:hover {
          color: var(--text-primary);
        }

        .admin-nav-tabs button.active {
          color: var(--color-primary-light);
          border-bottom-color: var(--color-primary);
        }

        /* ── Body Area ── */
        .admin-body-area {
          padding: var(--space-xl);
          min-height: 500px;
        }

        .offline-alert-box {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-error);
          padding: var(--space-md) var(--space-lg);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          margin-bottom: var(--space-xl);
        }

        /* ── Metrics Cards ── */
        .admin-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-lg);
          margin-bottom: var(--space-xl);
        }

        .metric-card-glass {
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          padding: var(--space-lg);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .m-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .m-icon.purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .m-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .m-icon.orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .m-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }

        .m-info {
          display: flex;
          flex-direction: column;
        }

        .m-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .m-value {
          font-size: var(--text-xl);
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 2px;
          line-height: 1.1;
        }

        .m-value small {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--text-muted);
        }

        /* ── Tables ── */
        .table-surface-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
        }

        .table-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-lg);
        }

        .table-card-header h2 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .admin-data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-sm);
        }

        .admin-data-table th {
          text-align: left;
          padding: var(--space-md);
          color: var(--text-muted);
          font-weight: 700;
          border-bottom: 1px solid var(--border-subtle);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-data-table td {
          padding: var(--space-md);
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .user-profile-cell {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .table-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid var(--border-subtle);
        }

        .table-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-hover);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-sm);
          border: 1px solid var(--border-subtle);
        }

        .user-name-wrapper {
          display: flex;
          flex-direction: column;
        }

        .user-main-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-join-date {
          font-size: 10px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .user-email {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .table-role-badge {
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border-radius: var(--radius-sm);
          width: fit-content;
        }

        .table-role-badge.admin {
          background: rgba(165, 180, 252, 0.15);
          color: var(--color-primary-light);
          border: 1px solid rgba(165, 180, 252, 0.25);
        }

        .table-role-badge.user {
          background: var(--bg-hover);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
        }

        .profile-stat-count strong {
          color: var(--text-primary);
        }

        .profile-speed-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          color: var(--color-primary-light);
        }

        .profile-streak-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .stat-missing {
          color: var(--text-muted);
          font-size: var(--text-xs);
        }

        .spinner-shell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-xl) 0;
          color: var(--text-muted);
        }

        /* ── Section Title Row ── */
        .section-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: var(--space-xl);
          flex-wrap: wrap;
          gap: var(--space-md);
        }

        .section-title-wrap h2 {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .section-title-wrap p {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 4px 0 0;
        }

        /* ── Books Grid ── */
        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-lg);
        }

        .book-card-glass {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          transition: all 0.2s ease;
        }

        .book-card-glass.active-border {
          border-color: var(--color-primary);
          box-shadow: 0 0 12px var(--color-primary-glow);
        }

        .book-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-sm);
        }

        .book-titles {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .title-row h3 {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .active-tag {
          display: flex;
          align-items: center;
          gap: 2px;
          font-size: 8px;
          font-weight: 800;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .book-desc {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 0;
          line-height: 1.3;
        }

        .book-stats-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
          background: var(--bg-hover);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
        }

        .b-stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .b-stat:nth-child(3) {
          grid-column: span 2;
          border-top: 1px solid var(--border-subtle);
          padding-top: var(--space-sm);
          margin-top: 2px;
        }

        .b-stat-label {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          font-weight: 700;
        }

        .b-stat-val {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-secondary);
        }

        .b-stat-val.date-val {
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .btn-full {
          width: 100%;
        }

        .btn-active-book {
          margin-top: auto;
        }

        /* ── Ranks Grid ── */
        .ranks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: var(--space-lg);
        }

        .rank-card-glass {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          transition: transform 0.2s;
        }

        .rank-card-glass:hover {
          transform: translateY(-4px);
        }

        .rank-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .rank-visual {
          width: 48px;
          height: 48px;
          background: var(--bg-hover);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          border: 1px solid var(--border-subtle);
        }

        .rank-visual :global(svg) {
          width: 32px;
          height: 32px;
        }

        .rank-card-actions, .badge-actions, .event-actions, .book-actions {
          display: flex;
          gap: var(--space-xs);
        }

        .rank-card-body h3 {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .rank-key-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-primary-light);
          font-weight: 600;
          text-transform: uppercase;
        }

        .wpm-range-block {
          margin-top: var(--space-md);
        }

        .wpm-track {
          width: 100%;
          height: 5px;
          background: var(--bg-hover);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: 6px;
        }

        .wpm-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
        }

        .wpm-values {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        /* ── Badges Grid ── */
        .badges-grid-admin {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-lg);
        }

        .badge-card-admin-glass {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          transition: transform 0.2s;
        }

        .badge-card-admin-glass:hover {
          transform: translateY(-4px);
        }

        .badge-vector {
          width: 52px;
          height: 52px;
          background: var(--bg-hover);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          border: 1px solid var(--border-subtle);
        }

        .badge-vector :global(svg) {
          width: 36px;
          height: 36px;
        }

        .badge-rarity-badge {
          padding: 2px 8px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: var(--radius-sm);
        }

        .badge-rarity-badge.common { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
        .badge-rarity-badge.uncommon { background: rgba(52, 211, 153, 0.1); color: #34d399; }
        .badge-rarity-badge.rare { background: rgba(96, 165, 250, 0.1); color: #60a5fa; }
        .badge-rarity-badge.epic { background: rgba(192, 132, 252, 0.1); color: #c084fc; }
        .badge-rarity-badge.legendary { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }

        .badge-card-body h3 {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .badge-desc {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin: 4px 0 0;
          line-height: 1.3;
        }

        .badge-quote {
          font-size: var(--text-xs);
          font-style: italic;
          color: var(--text-muted);
          margin: var(--space-sm) 0 0;
          border-left: 2px solid var(--border-subtle);
          padding-left: var(--space-sm);
        }

        .badge-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          padding-top: var(--space-md);
          border-top: 1px solid var(--border-subtle);
        }

        .badge-category-tag {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--color-primary-light);
          font-weight: 700;
        }

        /* ── Events List ── */
        .events-list-admin, .admin-list-container {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .event-item-glass-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: var(--space-lg);
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          transition: border-color 0.2s;
        }

        .event-item-glass-card:hover {
          border-color: var(--color-primary-glow);
        }

        .event-visual {
          width: 56px;
          height: 56px;
          background: var(--bg-hover);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }

        .event-visual :global(svg) {
          width: 36px;
          height: 36px;
        }

        .event-info-wrapper {
          flex: 1;
        }

        .event-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex-wrap: wrap;
        }

        .event-title-row h3 {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .event-schedule-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
          background: var(--bg-hover);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
        }

        .event-desc {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin: var(--space-xs) 0 var(--space-sm);
        }

        .event-target-badges {
          display: flex;
          gap: var(--space-sm);
          flex-wrap: wrap;
        }

        .target-pill, .reward-pill {
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
        }

        .target-pill {
          background: rgba(165, 180, 252, 0.1);
          color: var(--color-primary-light);
          border: 1px solid rgba(165, 180, 252, 0.2);
        }

        .reward-pill {
          background: rgba(244, 63, 94, 0.1);
          color: var(--color-accent);
          border: 1px solid rgba(244, 63, 94, 0.2);
        }

        /* ── Modals & Forms ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: var(--space-xl);
          animation: fade-in 0.2s ease-out;
        }

        .modal-content {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          overflow: hidden;
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-lg) var(--space-xl);
          border-bottom: 1px solid var(--border-subtle);
        }

        .modal-header h3 {
          font-size: var(--text-lg);
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .close-modal-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-modal-btn:hover {
          color: var(--text-primary);
        }

        .modal-body {
          padding: var(--space-xl);
          max-height: 70vh;
          overflow-y: auto;
        }

        .admin-modal-form {
          display: flex;
          flex-direction: column;
        }

        .form-group-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: var(--space-md);
        }

        .form-group-block.checkbox-block {
          flex-direction: row;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) 0;
        }

        .form-group-block.checkbox-block input {
          width: auto;
          cursor: pointer;
        }

        .form-group-block.checkbox-block label {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
        }

        .form-group-block label {
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-group-block input, .form-group-block select, .form-group-block textarea {
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: var(--text-sm);
          transition: border-color 0.15s;
          outline: none;
        }

        .form-group-block input:focus, .form-group-block select:focus, .form-group-block textarea:focus {
          border-color: var(--color-primary);
        }

        .form-double-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .modal-actions-row {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
          padding: var(--space-lg) var(--space-xl);
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-hover);
        }

        /* ── Profile Inspector Modal ── */
        .inspector-modal {
          max-width: 680px;
        }

        .user-details-title {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .modal-header-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid var(--color-primary-light);
        }

        .modal-header-avatar-fallback {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-lg);
        }

        .user-header-text h3 {
          font-size: var(--text-md);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .user-header-text p {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin: 2px 0 0;
          font-family: var(--font-mono);
        }

        .user-profile-telemetry {
          display: flex;
          flex-direction: column;
          gap: var(--space-xl);
        }

        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-md);
        }

        .t-card {
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          padding: var(--space-md);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .t-label {
          font-size: 8px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .t-val {
          font-size: var(--text-md);
          font-weight: 800;
          color: var(--text-primary);
          margin-top: 4px;
        }

        .t-val.speed { color: var(--color-primary-light); }
        .t-val.streak { color: var(--color-accent); }

        .t-val small {
          font-size: 9px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .telemetry-activity-section h4, .telemetry-sessions-log h4 {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-secondary);
          margin: 0 0 var(--space-md) 0;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .heatmap-block {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 6px;
        }

        .heatmap-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .node-date {
          font-size: 8px;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .node-box {
          width: 22px;
          height: 22px;
          border-radius: 4px;
          border: 1px solid var(--border-subtle);
        }

        .telemetry-log-table-shell {
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }

        .telemetry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-xs);
        }

        .telemetry-table th {
          text-align: left;
          padding: 8px var(--space-md);
          background: var(--bg-hover);
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-subtle);
        }

        .telemetry-table td {
          padding: 10px var(--space-md);
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .telemetry-table tr:last-child td {
          border-bottom: none;
        }

        .lang-tag, .mode-tag {
          font-size: 8px;
          font-weight: 800;
          text-transform: uppercase;
          background: var(--bg-hover);
          padding: 2px 6px;
          border-radius: 3px;
          border: 1px solid var(--border-subtle);
        }

        .wpm-val {
          font-weight: 700;
          color: var(--color-primary-light);
        }

        .acc-val {
          font-weight: 700;
          color: var(--color-success);
        }

        .modal-footer {
          padding: var(--space-lg) var(--space-xl);
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-hover);
        }

        /* ── Unauthorized Screen ── */
        .unauthorized-shell {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: var(--space-xl);
        }

        .error-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          padding: var(--space-2xl);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-lg);
          max-width: 440px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }

        .error-icon {
          color: var(--color-error);
        }

        .error-panel h2 {
          font-size: var(--text-xl);
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }

        .error-panel p {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0 0 var(--space-md) 0;
          line-height: 1.5;
        }

        /* ── Button Helpers ── */
        .icon-btn-secondary, .icon-btn-danger {
          width: 30px;
          height: 30px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
          background: transparent;
        }

        .icon-btn-secondary {
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
        }

        .icon-btn-secondary:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .icon-btn-danger {
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--color-error);
        }

        .icon-btn-danger:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .empty-section-alert {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          padding: var(--space-2xl) var(--space-lg);
          text-align: center;
          background: var(--bg-surface);
          border: 1.5px dashed var(--border-subtle);
          border-radius: var(--radius-xl);
          color: var(--text-muted);
          font-size: var(--text-sm);
        }

        /* ── File Upload CSS Styles ── */
        .file-upload-zone {
          border: 2.5px dashed var(--border-subtle);
          background: rgba(255, 255, 255, 0.01);
          border-radius: var(--radius-xl);
          padding: var(--space-xl);
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-xs);
          color: var(--text-muted);
          position: relative;
        }

        .file-upload-zone:hover {
          border-color: var(--color-primary-light);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text-primary);
        }

        .file-upload-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .upload-icon-wrap {
          color: var(--color-primary-light);
          margin-bottom: var(--space-xs);
        }

        .upload-title {
          font-weight: 600;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .upload-subtitle {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .upload-error-banner {
          margin-top: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-md);
          color: var(--color-error);
          font-size: var(--text-xs);
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        /* ── EPUB Chapter Selector Layout ── */
        .epub-chapter-selector-card {
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          background: rgba(255, 255, 255, 0.01);
          padding: var(--space-md) var(--space-lg);
          margin-top: var(--space-md);
        }

        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-md);
          padding-bottom: var(--space-sm);
          border-bottom: 1px solid var(--border-subtle);
        }

        .selector-header h4 {
          font-weight: 700;
          font-size: var(--text-sm);
          color: var(--text-primary);
          margin: 0;
        }

        .selector-actions {
          display: flex;
          gap: var(--space-sm);
        }

        .text-action-btn {
          background: transparent;
          border: none;
          color: var(--color-primary-light);
          font-size: var(--text-xs);
          font-weight: 600;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
        }

        .text-action-btn:hover {
          background: var(--bg-hover);
        }

        .chapters-scroll-area {
          max-height: 240px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
          padding-right: var(--space-xs);
        }

        .chapter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-xs) var(--space-sm);
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }

        .chapter-row:hover {
          background: var(--bg-hover);
          border-color: var(--border-subtle);
        }

        .chapter-row.is-checked {
          background: rgba(255, 255, 255, 0.02);
        }

        .chapter-check-label {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          cursor: pointer;
          flex: 1;
          user-select: none;
        }

        .chapter-title-text {
          font-size: var(--text-xs);
          color: var(--text-primary);
          font-weight: 500;
        }

        .chapter-meta-tag {
          font-size: 9px;
          color: var(--text-muted);
          background: var(--bg-hover);
          padding: 1px 5px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .chapter-char-count {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        .chapters-summary-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--space-md);
          padding-top: var(--space-sm);
          border-top: 1px solid var(--border-subtle);
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .chapters-summary-bar strong {
          color: var(--color-primary-light);
        }

        .chapters-apply-row {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }
      `}</style>
    </main>
  );
}
