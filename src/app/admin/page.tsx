'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Award, Star, Calendar, Plus, Trash2, Edit3, X, Check, RefreshCw } from 'lucide-react';
import { useGamificationStore } from '@/store/gamificationStore';
import { Rank, Badge, Event } from '@prisma/client';

type Tab = 'overview' | 'ranks' | 'badges' | 'events';

export default function AdminDashboard() {
  const isOffline = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { ranks, badges, events, fetchGamification, loading } = useGamificationStore();
  const [users, setUsers] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated' || (session?.user as any)?.role !== 'ADMIN') {
      // router.push('/'); // Uncomment to protect route client-side
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  // Form states
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent, type: Tab) => {
    e.preventDefault();
    setIsSubmitting(true);
    const method = editingItem.id ? 'PUT' : 'POST';

    try {
      const res = await fetch(`/api/admin/gamification/${type}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        setEditingItem(null);
        await fetchGamification();
      } else {
        alert('Failed to save');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: Tab) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/admin/gamification/${type}?id=${id}`, { method: 'DELETE' });
      if (res.ok) await fetchGamification();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || status === 'loading') return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="admin-container">
      <div className="glass-panel">
        <header className="admin-header">
          <div className="header-top">
            <div className="brand">
              <div className="brand-icon">⚡</div>
              <h1>Admin Central</h1>
            </div>
            <div className="admin-user">
              {session?.user?.image && <img src={session.user.image} alt="" className="admin-avatar" />}
              <span>{session?.user?.name}</span>
            </div>
          </div>

          <nav className="tabs">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              <Users size={18} /> Overview
            </button>
            <button className={activeTab === 'ranks' ? 'active' : ''} onClick={() => setActiveTab('ranks')}>
              <Star size={18} /> Ranks
            </button>
            <button className={activeTab === 'badges' ? 'active' : ''} onClick={() => setActiveTab('badges')}>
              <Award size={18} /> Badges
            </button>
            <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>
              <Calendar size={18} /> Events
            </button>
          </nav>
        </header>

        <main className="admin-main">
          {isOffline && (
            <div className="offline-warning">
              <RefreshCw size={16} /> <strong>Offline Mode Active:</strong> External data syncing is disabled via environment variables.
            </div>
          )}
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <section className="fade-in">
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon"><Users /></div>
                  <div className="stat-info">
                    <span className="stat-label">Total Users</span>
                    <span className="stat-value">{users.length}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><Star /></div>
                  <div className="stat-info">
                    <span className="stat-label">Ranks</span>
                    <span className="stat-value">{ranks.length}</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"><Award /></div>
                  <div className="stat-info">
                    <span className="stat-label">Badges</span>
                    <span className="stat-value">{badges.length}</span>
                  </div>
                </div>
              </div>

              <div className="users-table-container">
                <div className="flex justify-between items-center mb-6">
                  <h2>Active Typists</h2>
                  <button className="btn-refresh" onClick={fetchUsers}>
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
                {userLoading ? <p>Loading users...</p> : (
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              {u.image ? <img src={u.image} alt="" /> : <div className="user-avatar-placeholder">{u.name?.charAt(0)}</div>}
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td>{u.email}</td>
                          <td><span className={`role-badge ${u.role.toLowerCase()}`}>{u.role}</span></td>
                          <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* RANKS */}
          {activeTab === 'ranks' && (
            <section className="fade-in">
              <div className="section-head">
                <h2>System Ranks</h2>
                <button className="btn-primary" onClick={() => setEditingItem({ type: '', title: '', minWpm: 0, maxWpm: 0, svgContent: '' })}>
                  <Plus size={18} /> Add Rank
                </button>
              </div>

              {editingItem && activeTab === 'ranks' && (
                <div className="modal-overlay">
                  <form onSubmit={(e) => handleSave(e, 'ranks')} className="edit-form modal-content">
                    <h3>{editingItem.id ? 'Edit Rank' : 'New Rank'}</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Internal ID</label>
                        <input placeholder="beginner" value={editingItem.type} onChange={e => setEditingItem({ ...editingItem, type: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Display Title</label>
                        <input placeholder="Beginner" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Min WPM</label>
                        <input type="number" value={editingItem.minWpm} onChange={e => setEditingItem({ ...editingItem, minWpm: parseInt(e.target.value) })} required />
                      </div>
                      <div className="form-group">
                        <label>Max WPM</label>
                        <input type="number" value={editingItem.maxWpm} onChange={e => setEditingItem({ ...editingItem, maxWpm: parseInt(e.target.value) })} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>SVG Artwork (Raw Code)</label>
                      <textarea placeholder="<svg>...</svg>" value={editingItem.svgContent || ''} onChange={e => setEditingItem({ ...editingItem, svgContent: e.target.value })} rows={6} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : <><Check size={18} /> Save Rank</>}
                      </button>
                      <button type="button" className="btn-cancel" onClick={() => setEditingItem(null)}><X size={18} /> Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="items-grid">
                {ranks.map(r => (
                  <div key={r.id} className="item-card glass-card">
                    <div className="card-top">
                      <div className="item-icon" dangerouslySetInnerHTML={{ __html: r.svgContent || '🌱' }} />
                      <div className="card-actions">
                        <button className="icon-btn" onClick={() => setEditingItem(r)}><Edit3 size={16} /></button>
                        <button className="icon-btn danger" onClick={() => handleDelete(r.id, 'ranks')}><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="item-info">
                      <h3>{r.title}</h3>
                      <span className="item-type">{r.type}</span>
                      <div className="range-indicator">
                        <div className="range-bar">
                          <div className="range-fill" style={{ width: `${Math.min(100, (r.minWpm / 100) * 100)}%` }} />
                        </div>
                        <span className="range-text">{r.minWpm} - {r.maxWpm} WPM</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* BADGES */}
          {activeTab === 'badges' && (
            <section className="fade-in">
              <div className="section-head">
                <h2>Achievements</h2>
                <button className="btn-primary" onClick={() => setEditingItem({ badgeId: '', title: '', description: '', rarity: 'common', category: 'speed', svgContent: '' })}>
                  <Plus size={18} /> Create Badge
                </button>
              </div>

              {editingItem && activeTab === 'badges' && (
                <div className="modal-overlay">
                  <form onSubmit={(e) => handleSave(e, 'badges')} className="edit-form modal-content">
                    <h3>{editingItem.id ? 'Edit Badge' : 'New Badge'}</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Internal ID</label>
                        <input placeholder="speed-demon" value={editingItem.badgeId} onChange={e => setEditingItem({ ...editingItem, badgeId: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Badge Title</label>
                        <input placeholder="Speed Demon" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Rarity</label>
                        <select value={editingItem.rarity} onChange={e => setEditingItem({ ...editingItem, rarity: e.target.value })}>
                          <option value="common">Common</option>
                          <option value="uncommon">Uncommon</option>
                          <option value="rare">Rare</option>
                          <option value="epic">Epic</option>
                          <option value="legendary">Legendary</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}>
                          <option value="speed">Speed</option>
                          <option value="accuracy">Accuracy</option>
                          <option value="dedication">Dedication</option>
                          <option value="learning">Learning</option>
                          <option value="mastery">Mastery</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input placeholder="Reach 50 WPM" value={editingItem.description} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>Motivation Quote</label>
                      <input placeholder="Speed is mastery..." value={editingItem.quote || ''} onChange={e => setEditingItem({ ...editingItem, quote: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>SVG Artwork</label>
                      <textarea placeholder="<svg>...</svg>" value={editingItem.svgContent || ''} onChange={e => setEditingItem({ ...editingItem, svgContent: e.target.value })} rows={6} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : <><Check size={18} /> Save Badge</>}
                      </button>
                      <button type="button" className="btn-cancel" onClick={() => setEditingItem(null)}><X size={18} /> Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="items-grid">
                {badges.map(b => (
                  <div key={b.id} className="item-card glass-card badge-card-admin">
                    <div className="card-top">
                      <div className="item-icon" dangerouslySetInnerHTML={{ __html: b.svgContent || '🏅' }} />
                      <div className={`rarity-tag ${b.rarity}`}>{b.rarity}</div>
                    </div>
                    <div className="item-info">
                      <h3>{b.title}</h3>
                      <p>{b.description}</p>
                      <div className="card-actions">
                        <button className="icon-btn" onClick={() => setEditingItem(b)}><Edit3 size={16} /></button>
                        <button className="icon-btn danger" onClick={() => handleDelete(b.id, 'badges')}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* EVENTS */}
          {activeTab === 'events' && (
            <section className="fade-in">
              <div className="section-head">
                <h2>Season Challenges</h2>
                <button className="btn-primary" onClick={() => setEditingItem({ title: '', description: '', targetType: 'wpm', targetValue: 0, svgContent: '' })}>
                  <Plus size={18} /> New Challenge
                </button>
              </div>

              {editingItem && activeTab === 'events' && (
                <div className="modal-overlay">
                  <form onSubmit={(e) => handleSave(e, 'events')} className="edit-form modal-content">
                    <h3>{editingItem.id ? 'Edit Challenge' : 'New Challenge'}</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Challenge Title</label>
                        <input placeholder="Holiday Sprint" value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label>Metric</label>
                        <select value={editingItem.targetType} onChange={e => setEditingItem({ ...editingItem, targetType: e.target.value })}>
                          <option value="wpm">WPM</option>
                          <option value="accuracy">Accuracy</option>
                          <option value="streak">Streak</option>
                          <option value="sessions">Sessions</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Target Value</label>
                        <input type="number" value={editingItem.targetValue} onChange={e => setEditingItem({ ...editingItem, targetValue: parseInt(e.target.value) })} required />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input placeholder="Complete 20 sessions this month" value={editingItem.description} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label>SVG Artwork</label>
                      <textarea placeholder="<svg>...</svg>" value={editingItem.svgContent || ''} onChange={e => setEditingItem({ ...editingItem, svgContent: e.target.value })} rows={6} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : <><Check size={18} /> Launch Challenge</>}
                      </button>
                      <button type="button" className="btn-cancel" onClick={() => setEditingItem(null)}><X size={18} /> Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="items-list">
                {events.map(ev => (
                  <div key={ev.id} className="event-item glass-card">
                    <div className="event-icon" dangerouslySetInnerHTML={{ __html: ev.svgContent || '📅' }} />
                    <div className="event-info">
                      <h3>{ev.title}</h3>
                      <p>{ev.description}</p>
                      <div className="event-target">
                        <strong>Goal:</strong> {ev.targetValue} {ev.targetType.toUpperCase()}
                      </div>
                    </div>
                    <div className="item-actions">
                      <button className="icon-btn" onClick={() => setEditingItem(ev)}><Edit3 size={16} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(ev.id, 'events')}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #1a1a2e, #16213e);
          color: #e9ecef;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          max-width: 1200px;
          margin: 0 auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          overflow: hidden;
        }

        .admin-header {
          padding: 2rem 2.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: white;
          box-shadow: 0 0 20px rgba(79, 172, 254, 0.4);
        }

        .brand h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .admin-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .admin-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid #4facfe;
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: -1px;
        }

        .tabs button {
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }

        .tabs button:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .tabs button.active {
          color: #4facfe;
          border-bottom-color: #4facfe;
        }

        .admin-main {
          padding: 2.5rem;
          min-height: 600px;
        }

        .offline-warning {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(251, 191, 36, 0.2);
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        /* Stats Cards */
        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.04);
          padding: 1.5rem;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          background: rgba(79, 172, 254, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: #4facfe;
        }

        .stat-label {
          display: block;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 800;
        }

        /* Tables */
        .users-table-container {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .users-table th {
          text-align: left;
          padding: 1rem;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .users-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-cell img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .role-badge.admin { background: rgba(79, 172, 254, 0.2); color: #4facfe; }
        .role-badge.user { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); }

        /* Grids & Cards */
        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-5px);
          border-color: rgba(79, 172, 254, 0.3);
        }

        .item-card {
          padding: 1.5rem;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .item-icon {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }

        .item-icon :global(svg) {
          width: 48px;
          height: 48px;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .icon-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .icon-btn.danger:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }

        .item-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .item-type {
          font-size: 0.8rem;
          color: #4facfe;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .range-indicator {
          margin-top: 1.25rem;
        }

        .range-bar {
          height: 6px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 100px;
          margin-bottom: 0.5rem;
          overflow: hidden;
        }

        .range-fill {
          height: 100%;
          background: linear-gradient(90deg, #4facfe, #00f2fe);
          border-radius: 100px;
        }

        .range-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          font-family: 'JetBrains Mono', monospace;
        }

        /* Forms & Modals */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          background: #1a1a2e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
        }

        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 2rem;
          font-size: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.4);
        }

        .form-group input, .form-group select, .form-group textarea {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 0.85rem;
          color: white;
          font-family: inherit;
          transition: all 0.2s;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #4facfe;
          background: rgba(255, 255, 255, 0.06);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-primary, .btn-save {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
          color: white;
          border: none;
          padding: 0.85rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 10px 20px rgba(79, 172, 254, 0.2);
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          border: none;
          padding: 0.85rem 1.5rem;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Animations */
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rarity-tag {
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .rarity-tag.common { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
        .rarity-tag.uncommon { background: rgba(52, 211, 153, 0.1); color: #34d399; }
        .rarity-tag.rare { background: rgba(96, 165, 250, 0.1); color: #60a5fa; }
        .rarity-tag.epic { background: rgba(192, 132, 252, 0.1); color: #c084fc; }
        .rarity-tag.legendary { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }

        .badge-card-admin p {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.5;
          margin: 1rem 0;
        }

        .event-item {
          display: flex;
          align-items: center;
          gap: 2rem;
          padding: 1.5rem 2rem;
          margin-bottom: 1rem;
        }

        .event-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .event-info {
          flex: 1;
        }

        .event-target {
          display: inline-block;
          margin-top: 0.75rem;
          background: rgba(79, 172, 254, 0.1);
          color: #4facfe;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
