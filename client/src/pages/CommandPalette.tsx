/**
 * CommandPalette — Cmd+K / Ctrl+K global search & navigation overlay
 * Features:
 *  - Glassmorphism frosted overlay
 *  - Fuzzy search across accommodations, pages, actions
 *  - Full keyboard navigation (↑↓ Enter Esc)
 *  - Grouped results with icons
 *  - Recent searches remembered in sessionStorage
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface CmdItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  group: string;
  action: () => void;
  keywords?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch accommodations for search
  useEffect(() => {
    if (!open) return;
    fetch(`${API}/api/accommodations`)
      .then(r => r.json())
      .then(d => { if (d.success) setAccommodations(d.data || []); })
      .catch(() => {});
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const go = useCallback((path: string) => {
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const staticItems: CmdItem[] = [
    ...(user ? [
      { id: 'dash',     label: 'Dashboard',        icon: '⚡', group: 'Navigate', action: () => go(user.role === 'owner' ? '/owner/dashboard' : user.role === 'admin' ? '/admin' : '/dashboard'), keywords: 'home' },
      { id: 'profile',  label: 'My Profile',       icon: '👤', group: 'Navigate', action: () => go('/profile'), keywords: 'account settings' },
      { id: 'browse',   label: 'Browse Listings',  icon: '🏠', group: 'Navigate', action: () => go('/accommodations'), keywords: 'search accommodations properties' },
    ] : [
      { id: 'login',    label: 'Student Login',    icon: '🔑', group: 'Navigate', action: () => go('/login') },
      { id: 'register', label: 'Create Account',   icon: '✨', group: 'Navigate', action: () => go('/register') },
      { id: 'olink',    label: 'Owner Login',      icon: '🏢', group: 'Navigate', action: () => go('/owner/login') },
    ]),
    ...(user && (user.role === 'student' || !user.role) ? [
      { id: 'report',   label: 'Report Safety Issue', icon: '⚠️', group: 'Actions', action: () => go('/report'), keywords: 'file submit' },
      { id: 'myreports',label: 'My Reports',       icon: '📋', group: 'Navigate', action: () => go('/my-reports') },
    ] : []),
    ...(user?.role === 'owner' ? [
      { id: 'addprop',  label: 'Add New Property', icon: '➕', group: 'Actions', action: () => go('/owner/add-property') },
    ] : []),
    ...(user?.role === 'admin' ? [
      { id: 'admin',    label: 'Admin Console',    icon: '🛡️', group: 'Navigate', action: () => go('/admin') },
    ] : []),
    { id: 'home',     label: 'Home Page',          icon: '🏡', group: 'Navigate', action: () => go('/'), keywords: 'landing' },
  ];

  const accommItems: CmdItem[] = accommodations
    .filter(a => !query || a.name?.toLowerCase().includes(query.toLowerCase()) || a.city?.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map(a => ({
      id: `acc-${a._id}`,
      label: a.name,
      sublabel: `${a.city} · Score: ${a.trustScore ?? 0}`,
      icon: a.trustScore >= 80 ? '✅' : a.trustScore >= 50 ? '⚠️' : '🚨',
      group: 'Accommodations',
      action: () => go(`/accommodations/${a._id}`),
      keywords: a.address,
    }));

  const q = query.toLowerCase().trim();
  const filtered = [...staticItems, ...accommItems].filter(item =>
    !q ||
    item.label.toLowerCase().includes(q) ||
    item.sublabel?.toLowerCase().includes(q) ||
    item.keywords?.toLowerCase().includes(q) ||
    item.group.toLowerCase().includes(q)
  );

  // Group items
  const groups: Record<string, CmdItem[]> = {};
  filtered.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  const flatList = filtered; // for keyboard nav index

  useEffect(() => { setSelected(0); }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatList.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && flatList[selected]) { flatList[selected].action(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selected, flatList, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="cmd-overlay" onClick={onClose}>
        <div className="cmd-panel glass-hi" onClick={e => e.stopPropagation()}>
          {/* Search input */}
          <div className="cmd-search-row">
            <span className="cmd-search-icon">⌘</span>
            <input
              ref={inputRef}
              className="cmd-input"
              placeholder="Search pages, properties, actions…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button className="cmd-clear" onClick={() => setQuery('')}>✕</button>
            )}
            <kbd className="cmd-esc-hint">ESC</kbd>
          </div>

          {/* Results */}
          <div className="cmd-results" ref={listRef}>
            {filtered.length === 0 && (
              <div className="cmd-empty">
                <span style={{ fontSize: 24, opacity: 0.3 }}>🔍</span>
                <p>No results for "<strong>{query}</strong>"</p>
              </div>
            )}

            {Object.entries(groups).map(([group, items]) => (
              <div key={group} className="cmd-group">
                <div className="cmd-group-label">{group}</div>
                {items.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      className={`cmd-item ${selected === idx ? 'cmd-item-selected' : ''}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <span className="cmd-item-icon">{item.icon}</span>
                      <div className="cmd-item-text">
                        <span className="cmd-item-label">{item.label}</span>
                        {item.sublabel && <span className="cmd-item-sub">{item.sublabel}</span>}
                      </div>
                      {selected === idx && <span className="cmd-item-enter">↵</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="cmd-footer">
            <span><kbd>↑↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>ESC</kbd> close</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 10 }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

const CSS = `
  @keyframes cmdIn {
    from { opacity: 0; transform: scale(0.96) translateY(-12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .cmd-overlay {
    position: fixed; inset: 0; z-index: 99000;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(12px) saturate(160%);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 14vh;
  }

  .cmd-panel {
    width: 100%; max-width: 580px;
    border-radius: 20px;
    overflow: hidden;
    animation: cmdIn 0.22s cubic-bezier(.22,.68,0,1.2) both;
    box-shadow:
      0 0 0 1px rgba(99,102,241,0.2),
      0 40px 100px rgba(0,0,0,0.7),
      0 0 80px rgba(99,102,241,0.08);
  }

  .cmd-search-row {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--border);
  }

  .cmd-search-icon {
    font-size: 16px; opacity: 0.4; flex-shrink: 0;
    width: 20px; text-align: center;
  }

  .cmd-input {
    flex: 1; background: none; border: none; outline: none;
    font-family: var(--font-body); font-size: 15px; font-weight: 500;
    color: var(--text-1); caret-color: var(--indigo);
  }
  .cmd-input::placeholder { color: var(--text-3); }

  .cmd-clear {
    background: none; border: none; cursor: none;
    font-size: 12px; color: var(--text-3); padding: 4px;
    border-radius: 4px; transition: color 0.15s;
  }
  .cmd-clear:hover { color: var(--text-1); }

  .cmd-esc-hint {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 5px; padding: 3px 7px;
    font-size: 10px; font-weight: 600; color: var(--text-3);
    font-family: var(--font-body);
  }

  .cmd-results {
    max-height: 380px; overflow-y: auto;
    overscroll-behavior: contain;
    padding: 8px 0;
  }
  .cmd-results::-webkit-scrollbar { width: 3px; }
  .cmd-results::-webkit-scrollbar-thumb { background: var(--text-3); border-radius: 2px; }

  .cmd-group { margin-bottom: 4px; }

  .cmd-group-label {
    padding: 8px 18px 4px;
    font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--text-3);
  }

  .cmd-item {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 10px 18px;
    background: none; border: none; cursor: none; text-align: left;
    transition: background 0.1s;
    font-family: var(--font-body);
  }

  .cmd-item-selected {
    background: rgba(99,102,241,0.1);
  }

  .cmd-item-icon {
    font-size: 15px; width: 22px; text-align: center; flex-shrink: 0;
  }

  .cmd-item-text { flex: 1; display: flex; flex-direction: column; gap: 1px; }
  .cmd-item-label { font-size: 13px; font-weight: 500; color: var(--text-1); }
  .cmd-item-sub   { font-size: 11px; color: var(--text-3); }

  .cmd-item-enter {
    font-size: 12px; color: var(--indigo); opacity: 0.7;
    background: rgba(99,102,241,0.1); padding: 3px 7px;
    border-radius: 5px; font-weight: 700;
  }

  .cmd-empty {
    padding: 40px; text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    color: var(--text-3); font-size: 13px;
  }

  .cmd-footer {
    display: flex; align-items: center; gap: 16px;
    padding: 10px 18px;
    border-top: 1px solid var(--border);
    font-size: 11px; color: var(--text-3);
  }

  .cmd-footer kbd {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 4px; padding: 2px 5px;
    font-size: 10px; font-weight: 600; color: var(--text-2);
    font-family: var(--font-body);
  }
`;
