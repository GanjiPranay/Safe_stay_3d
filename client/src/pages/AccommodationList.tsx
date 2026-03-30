import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccommodationMap from '../components/AccommodationMap';
import { SubtleOrb, SkeletonCard, useToast } from './DesignSystem';

export const AccommodationList: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const toast = useToast();
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showMap, setShowMap]     = useState(false);
  const [viewMode, setViewMode]   = useState<'grid' | 'list'>('grid');

  useEffect(() => { fetchAccommodations(); }, []);

  const fetchAccommodations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/accommodations`);
      const data = await response.json();
      if (data.success) setAccommodations(data.data);
      else { setError('Failed to load accommodations'); toast.error('Failed to load accommodations'); }
    } catch {
      setError('Error connecting to server');
      toast.error('Error connecting to server');
    }
    finally { setLoading(false); }
  };

  const filtered = (accommodations || []).filter(acc => {
    const matchesSearch = !searchTerm ||
      acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.city?.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesFilter = true;
    if (selectedFilter === 'safe')    matchesFilter = acc.trustScore >= 80;
    else if (selectedFilter === 'caution') matchesFilter = acc.trustScore >= 50 && acc.trustScore < 80;
    else if (selectedFilter === 'avoid')   matchesFilter = acc.trustScore < 50;
    return matchesSearch && matchesFilter;
  });

  const scoreConfig = (score: number) => {
    if (score >= 80) return { label: 'Safe',    color: 'var(--emerald)', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' };
    if (score >= 50) return { label: 'Caution', color: 'var(--amber)',   bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' };
    return              { label: 'Avoid',    color: 'var(--rose)',    bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.25)'  };
  };

  return (
    <>
      <style>{CSS}</style>
      <SubtleOrb>
        <div className="al-page">
          {/* Hero */}
          <div className="al-hero fade-up">
            <div className="al-hero-inner">
              <p className="al-eyebrow">Safety Database</p>
              <h1 className="al-h1">Find <span>Safe</span> Accommodations</h1>
              <p className="al-sub">Search verified properties with transparent safety ratings and real student feedback.</p>
            </div>
          </div>

          <div className="al-content">
            {/* Toolbar */}
            <div className="al-toolbar glass fade-up fade-up-2">
              <div className="al-search-wrap">
                <span className="al-search-icon">🔍</span>
                <input type="text" className="ss-input al-search" placeholder="Search by name, location, or city…"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>

              <div className="al-filters">
                {[
                  { id: 'all',     label: 'All'          },
                  { id: 'safe',    label: '🟢 Safe'      },
                  { id: 'caution', label: '🟡 Caution'   },
                  { id: 'avoid',   label: '🔴 Avoid'     },
                ].map(f => (
                  <button key={f.id} onClick={() => setSelectedFilter(f.id)}
                    className={`al-filter-btn ${selectedFilter === f.id ? 'al-filter-active' : ''}`}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="al-view-btns">
                <button onClick={() => setViewMode('grid')} className={`al-view-btn ${viewMode === 'grid' ? 'al-view-active' : ''}`} title="Grid">⊞</button>
                <button onClick={() => setViewMode('list')} className={`al-view-btn ${viewMode === 'list' ? 'al-view-active' : ''}`} title="List">≡</button>
                <button onClick={() => setShowMap(!showMap)} className={`al-view-btn ${showMap ? 'al-view-active' : ''}`} title="Map">🗺️</button>
              </div>

              <p className="al-count">Showing <span>{filtered.length}</span> properties</p>
            </div>

            {showMap && (
              <div className="al-map-wrap fade-up fade-up-3">
                <AccommodationMap />
              </div>
            )}

            {error && (
              <div className="al-error fade-up">
                <span>⚠️ {error}</span>
                <button className="ss-btn ss-btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }}
                  onClick={() => { setError(''); fetchAccommodations(); }}>Retry</button>
              </div>
            )}

            {loading ? (
              <div className={viewMode === 'grid' ? 'al-grid' : 'al-list'}>
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="al-empty glass fade-up fade-up-3">
                <span style={{ fontSize: 32, opacity: 0.25 }}>🔍</span>
                <h3 className="al-empty-title">No properties found</h3>
                <p className="al-empty-sub">Know a property that should be listed? Ask owners to register for free.</p>
                <Link to="/owner/register" className="ss-btn" style={{ textDecoration: 'none', marginTop: 8 }}>Register Property →</Link>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'al-grid fade-up fade-up-3' : 'al-list fade-up fade-up-3'}>
                {filtered.map((acc, i) => {
                  const cfg = scoreConfig(acc.trustScore ?? 0);
                  const isList = viewMode === 'list';
                  return (
                    <Link key={acc._id} to={`/accommodations/${acc._id}`}
                      className={`al-card glass ${isList ? 'al-card-list' : ''}`}
                      style={{ textDecoration: 'none', animationDelay: `${i * 0.04}s` }}>

                      {!isList && (
                        <div className="al-thumb">
                          <div className="al-thumb-icon">🏠</div>
                          <div className="al-thumb-overlay" />
                          <div className="al-score-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            {acc.trustScore ?? 0} · {cfg.label}
                          </div>
                        </div>
                      )}

                      <div className={isList ? 'al-body-list' : 'al-body'}>
                        {isList && (
                          <div className="al-score-badge al-score-badge-list" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 8 }}>
                            {acc.trustScore ?? 0} · {cfg.label}
                          </div>
                        )}
                        <h3 className="al-card-name">{acc.name}</h3>
                        <div className="al-card-loc">
                          <span style={{ color: 'var(--indigo)' }}>📍</span>
                          <span>{acc.address}, {acc.city}</span>
                        </div>
                        <div className="al-stats">
                          <div>
                            <p className="al-stat-label">Reports</p>
                            <p className="al-stat-val">⚠️ {acc.totalReports || 0}</p>
                          </div>
                          <div>
                            <p className="al-stat-label">Resolved</p>
                            <p className="al-stat-val">✅ {acc.resolvedReports || 0}</p>
                          </div>
                        </div>
                        <div className="al-card-footer">
                          <span className="al-type">{acc.type || 'Hostel / PG'}</span>
                          <span className="al-arrow">View profile →</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SubtleOrb>
    </>
  );
};

const CSS = `
  .al-page { min-height: 100vh; background: transparent; padding-top: 60px; }

  .al-hero {
    background: rgba(5,5,10,0.8); border-bottom: 1px solid var(--border);
    padding: 56px 0 0; position: relative; overflow: hidden;
    backdrop-filter: blur(12px);
  }
  .al-hero::before {
    content: ''; position: absolute; top: -30%; right: -10%;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%);
    pointer-events: none;
  }
  .al-hero-inner { max-width: 1100px; margin: 0 auto; padding: 0 32px 44px; position: relative; z-index: 1; }

  .al-eyebrow { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.14em; color: var(--indigo); margin-bottom: 14px; }
  .al-h1 { font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 700; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 14px; line-height: 1.05; }
  .al-h1 span { color: var(--indigo); }
  .al-sub { color: var(--text-2); font-size: 14px; max-width: 480px; line-height: 1.7; }

  .al-content { max-width: 1100px; margin: 0 auto; padding: 36px 32px 80px; }

  .al-toolbar {
    padding: 20px 24px; border-radius: var(--r-md);
    display: flex; flex-wrap: wrap; gap: 14px; align-items: center; margin-bottom: 28px;
  }
  .al-search-wrap { flex: 1; min-width: 220px; position: relative; }
  .al-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 13px; pointer-events: none; opacity: 0.5; }
  .al-search { padding-left: 40px !important; }

  .al-filters {
    display: flex; gap: 4px; background: var(--panel); padding: 4px;
    border-radius: var(--r-sm); border: 1px solid var(--border);
  }
  .al-filter-btn {
    padding: 7px 14px; border: none; background: transparent; cursor: none;
    font-family: var(--font-body); font-size: 12px; font-weight: 600;
    border-radius: 8px; color: var(--text-3); transition: all 0.2s;
  }
  .al-filter-btn:hover { color: var(--text-1); }
  .al-filter-active { background: rgba(99,102,241,0.15); color: #a5b4fc; }

  .al-view-btns { display: flex; gap: 4px; }
  .al-view-btn {
    width: 36px; height: 36px; border: 1px solid var(--border);
    background: var(--panel); border-radius: var(--r-sm); cursor: none;
    font-size: 14px; display: flex; align-items: center; justify-content: center;
    color: var(--text-3); transition: all 0.2s;
  }
  .al-view-btn:hover { color: var(--text-1); border-color: var(--border-hi); }
  .al-view-active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.3); color: #a5b4fc; }

  .al-count { font-size: 12px; font-weight: 500; color: var(--text-3); white-space: nowrap; }
  .al-count span { color: var(--indigo); font-weight: 700; }

  .al-map-wrap {
    border-radius: var(--r-lg); overflow: hidden;
    border: 1px solid var(--border); margin-bottom: 28px; height: 420px;
  }

  .al-error {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 14px 18px; border-radius: var(--r-sm);
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2);
    color: #fda4af; font-size: 13px; margin-bottom: 20px;
  }

  .al-empty {
    padding: 72px 24px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 8px;
  }
  .al-empty-title { font-size: 1.1rem; font-weight: 700; color: var(--text-1); margin-top: 4px; }
  .al-empty-sub { font-size: 13px; color: var(--text-3); max-width: 340px; }

  .al-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .al-list { display: flex; flex-direction: column; gap: 12px; }

  .al-card { cursor: none; transition: border-color 0.25s, transform 0.2s; display: flex; flex-direction: column; overflow: hidden; }
  .al-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-3px); }
  .al-card-list { flex-direction: row; align-items: center; }

  .al-thumb {
    width: 100%; height: 160px; background: rgba(255,255,255,0.02);
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden; flex-shrink: 0;
  }
  .al-thumb-icon { font-size: 40px; opacity: 0.06; }
  .al-thumb-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(5,5,10,0.7) 100%); }

  .al-score-badge {
    position: absolute; bottom: 10px; left: 10px;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px;
    text-transform: uppercase; letter-spacing: 0.06em;
  }
  .al-score-badge-list { position: static; display: inline-block; }

  .al-body { padding: 18px 20px; flex: 1; display: flex; flex-direction: column; }
  .al-body-list { padding: 16px 20px; flex: 1; }

  .al-card-name {
    font-size: 14px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-1);
    margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: color 0.2s;
  }
  .al-card:hover .al-card-name { color: #a5b4fc; }

  .al-card-loc { display: flex; align-items: center; gap: 6px; color: var(--text-2); font-size: 12px; margin-bottom: 14px; overflow: hidden; }
  .al-card-loc span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .al-stats {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    padding: 12px 0; margin-bottom: 14px;
    border-top: 1px solid rgba(255,255,255,0.04);
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .al-stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-3); margin-bottom: 3px; }
  .al-stat-val { font-size: 13px; font-weight: 700; color: var(--text-1); }

  .al-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
  .al-type { font-size: 11px; color: var(--text-3); font-weight: 500; }
  .al-arrow { font-size: 12px; font-weight: 700; color: var(--indigo); }

  @media(max-width: 640px) { .al-grid { grid-template-columns: 1fr; } }
`;
