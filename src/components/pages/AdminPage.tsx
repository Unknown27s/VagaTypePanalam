'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
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
  BadgeFormData,
  EventFormData,
  CloudBackupSession,
} from '@/types/admin';

export default function AdminPage() {
  const isOffline = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';
  const isDevView = process.env.NEXT_PUBLIC_ADMIN_DEV_VIEW === 'true';
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const { badges, events, fetchGamification, loading } = useGamificationStore();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [books, setBooks] = useState<PracticeBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const [editingItem, setEditingItem] = useState<BookFormData | BadgeFormData | EventFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        const initialSelected: Record<string, boolean> = {};
        parsed.chapters.forEach(ch => {
          initialSelected[ch.id] = ch.isPreChecked;
        });
        setSelectedChapters(initialSelected);

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
      e.target.value = '';
    }
  };

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

  const systemAggregates = () => {
    let totalSessions = 0;
    let wpmSum = 0;
    let usersWithStats = 0;

    users.forEach(u => {
      const profile = u.cloudBackup?.profile;
      if (profile) {
        totalSessions += profile.totalSessions ?? 0;
        if (profile.bestWpm > 0) {
          wpmSum += profile.bestWpm;
          usersWithStats++;
        }
      }
    });

    const averageWpm = usersWithStats > 0 ? Math.round(wpmSum / usersWithStats) : 0;

    let compressedBooks = 0;
    let uncompressedBooks = 0;
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    books.forEach(b => {
      if (b.compressedContent) {
        compressedBooks++;
        totalOriginalSize += b.originalSize ?? 0;
        totalCompressedSize += Buffer.byteLength(b.compressedContent, 'utf-8');
      } else if (b.content) {
        uncompressedBooks++;
        totalOriginalSize += Buffer.byteLength(b.content, 'utf-8');
        totalCompressedSize += Buffer.byteLength(b.content, 'utf-8');
      }
    });

    const avgCompressionRatio = totalOriginalSize > 0
      ? Math.round((totalCompressedSize / totalOriginalSize) * 100)
      : 0;

    const bytesSaved = totalOriginalSize - totalCompressedSize;

    return {
      totalSessions,
      averageWpm,
      totalBooks: books.length || 0,
      compressedBooks,
      uncompressedBooks,
      totalOriginalSize,
      totalCompressedSize,
      avgCompressionRatio,
      bytesSaved,
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

  if (!isAdmin) {
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

        <nav className="admin-nav-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <Users size={16} />
            <span>Overview</span>
          </button>
          <button className={activeTab === 'books' ? 'active' : ''} onClick={() => setActiveTab('books')}>
            <BookOpen size={16} />
            <span>Weekly Books</span>
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

        <div className="admin-body-area">
          {isOffline && (
            <div className="offline-alert-box">
              <ShieldAlert size={16} />
              <span><strong>Offline Simulation Mode:</strong> Local mock synchronization is active. Changes won't hit live production database.</span>
            </div>
          )}

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
                <div className="metric-card-glass">
                  <div className="m-icon indigo"><Star size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">Compressed Books</span>
                    <span className="m-value">{stats.compressedBooks} <small>of {stats.totalBooks}</small></span>
                  </div>
                </div>
                <div className="metric-card-glass">
                  <div className="m-icon teal"><Zap size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">Storage Saved</span>
                    <span className="m-value">{Math.round(stats.bytesSaved / 1024 / 1024)} <small>MB</small></span>
                  </div>
                </div>
                <div className="metric-card-glass">
                  <div className="m-icon cyan"><CheckCircle size={20} /></div>
                  <div className="m-info">
                    <span className="m-label">Avg Compression</span>
                    <span className="m-value">{stats.avgCompressionRatio}%</span>
                  </div>
                </div>
              </div>

              {stats.totalBooks > 0 && (
                <div className="compression-stats-card">
                  <div className="compression-header">
                    <h3>📦 Storage & Compression Metrics</h3>
                    <p>Database optimization and storage savings overview</p>
                  </div>

                  <div className="compression-grid">
                    <div className="compression-item">
                      <span className="comp-label">Total Original Size</span>
                      <span className="comp-value">{Math.round(stats.totalOriginalSize / 1024 / 1024)} MB</span>
                      <span className="comp-detail">{stats.totalOriginalSize.toLocaleString()} bytes</span>
                    </div>

                    <div className="compression-item">
                      <span className="comp-label">After Compression</span>
                      <span className="comp-value">{Math.round(stats.totalCompressedSize / 1024 / 1024)} MB</span>
                      <span className="comp-detail">{stats.totalCompressedSize.toLocaleString()} bytes</span>
                    </div>

                    <div className="compression-item highlight-green">
                      <span className="comp-label">Storage Saved</span>
                      <span className="comp-value">{Math.round(stats.bytesSaved / 1024 / 1024)} MB</span>
                      <span className="comp-detail">{Math.round((stats.bytesSaved / stats.totalOriginalSize) * 100)}% reduction</span>
                    </div>

                    <div className="compression-item highlight-blue">
                      <span className="comp-label">Efficiency</span>
                      <span className="comp-value">{stats.avgCompressionRatio}%</span>
                      <span className="comp-detail">Compressed to {stats.avgCompressionRatio}% of original</span>
                    </div>

                    <div className="compression-item">
                      <span className="comp-label">Compressed Books</span>
                      <span className="comp-value">{stats.compressedBooks}</span>
                      <span className="comp-detail">of {stats.totalBooks} books</span>
                    </div>

                    <div className="compression-item">
                      <span className="comp-label">Uncompressed Books</span>
                      <span className="comp-value">{stats.uncompressedBooks}</span>
                      <span className="comp-detail">Small books (&lt;100KB)</span>
                    </div>
                  </div>

                  <div className="compression-progress-bar">
                    <div className="progress-label">
                      <span>Database Compression Status</span>
                      <span className="progress-percent">{stats.avgCompressionRatio}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, 100 - stats.avgCompressionRatio))}%`,
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                        }}
                      />
                    </div>
                    <div className="progress-detail">
                      Optimal compression achieved through hybrid strategy
                    </div>
                  </div>
                </div>
              )}

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
                                  setParsedEpub(null);
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
                              value={bookItem.content ?? ''}
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
                                {b.compressedContent && <span className="compressed-tag"><Zap size={10} /> Compressed {b.compressionRatio ? `(${Math.round(b.compressionRatio * 100)}%)` : ''}</span>}
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
                              <span className="b-stat-val">{b.originalSize ? Math.round(b.originalSize / 1024) : (b.content ? Math.round(b.content.length / 1024) : 0)} KB</span>
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
                      <div className="badge-vector" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(b.svgContent || '🏅') }} />
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
                          <label>Challenge Description</label>
                          <textarea
                            placeholder="Describe the challenge goal and theme"
                            value={eventItem.description}
                            onChange={e => setEditingItem({ ...eventItem, description: e.target.value })}
                            rows={3}
                            required
                          />
                        </div>
                      </div>

                      <div className="modal-actions-row">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving Event...' : <><Check size={16} /> Save Event</>}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setEditingItem(null)}>Cancel</button>
                      </div>
                    </form>
                  </div>
                );
              })()}

              <div className="admin-list-container">
                {events.length === 0 ? (
                  <div className="empty-section-alert">
                    <Calendar size={36} />
                    <p>No events launched yet. Click "Launch Event" above to create one.</p>
                  </div>
                ) : (
                  <div className="events-grid">
                    {events.map(ev => (
                      <div key={ev.id} className="event-card-glass">
                        <div className="event-header">
                          <h3>{ev.title}</h3>
                          <div className="event-actions">
                            <button className="icon-btn-secondary" onClick={() => setEditingItem(ev)}><Edit3 size={14} /></button>
                            <button className="icon-btn-danger" onClick={() => handleDelete(ev.id, 'events')}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <p className="event-desc">{ev.description}</p>
                        <div className="event-meta">
                          <span className="e-meta"><strong>Target:</strong> {ev.targetValue} {ev.targetType}</span>
                          {ev.rewardBadge && <span className="e-meta"><strong>Reward:</strong> {ev.rewardBadge}</span>}
                          {ev.activeFrom && <span className="e-meta"><strong>From:</strong> {new Date(ev.activeFrom).toLocaleDateString()}</span>}
                          {ev.activeTo && <span className="e-meta"><strong>To:</strong> {new Date(ev.activeTo).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedUser && (
            <div className="modal-overlay">
              <div className="inspect-modal modal-content animate-fade-in">
                <div className="modal-header">
                  <h3>Telemetry: {selectedUser.name || 'Typist'}</h3>
                  <button type="button" className="close-modal-btn" onClick={() => setSelectedUser(null)}><X size={18} /></button>
                </div>
                <div className="telemetry-body">
                  {selectedUser.cloudBackup?.sessions && selectedUser.cloudBackup.sessions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="admin-data-table compact">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>WPM</th>
                            <th>Accuracy</th>
                            <th>Duration</th>
                            <th>Language</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.cloudBackup.sessions.map((s: CloudBackupSession, i: number) => (
                            <tr key={i}>
                              <td>{new Date(s.startedAt).toLocaleDateString()}</td>
                              <td>{s.wpm} WPM</td>
                              <td>{(s.accuracy * 100).toFixed(0)}%</td>
                              <td>{Math.floor(s.durationMs / 60000)}m {Math.floor((s.durationMs % 60000) / 1000)}s</td>
                              <td>{s.language}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="empty-telemetry">No individual session data synced for this typist.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
