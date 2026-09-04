/**
 * sessions.js — Gestion des sessions (actives, historique, déconnexion)
 */

'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────
const SessState = {
  activeSessions:   [],
  historyData:      [],
  histFiltered:     [],
  histPage:         1,
  histPerPage:      25,
  histStatusFilter: '',
  histSearch:       '',
  histDateFrom:     '',
  histDateTo:       '',
  kickTargetId:     null,
  kickTargetUser:   '',
  autoRefreshTimer: null,
};

// ─── API ─────────────────────────────────────────────────────────────────
async function sApi(params = {}) {
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch('../login_php/api_sessions.php' + (qs ? '?' + qs : ''), {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return res.json();
}

async function sApiPost(body = {}) {
  const res = await fetch('../login_php/api_sessions.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── TOAST ───────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.getElementById('toast-text');
  if (!c || !t) return;
  t.textContent = msg;
  const isErr = (type === 'error' || type === false);
  const isWarn = (type === 'warn');
  const isInfo = (type === 'info');
  const cls = isErr ? 'toast-error' : (isWarn ? 'toast-warn' : (isInfo ? 'toast-info' : 'toast-success'));
  c.className = 'toast-container ' + cls;
  c.removeAttribute('style');
  c.style.display = 'flex';
  clearTimeout(c._tid);
  c._tid = setTimeout(() => { c.style.display = 'none'; }, 4500);
}
window.showMessage = showToast;

// ─── MODAL ───────────────────────────────────────────────────────────────
function openModal(id)  { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }
window.closeModal = closeModal;

// ─── FORMAT HELPERS ──────────────────────────────────────────────────────
function fmt(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return isNaN(d) ? dt : d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function fmtDuration(startedAt, endedAt) {
  const start = new Date(startedAt);
  const end   = endedAt ? new Date(endedAt) : new Date();
  const ms    = end - start;
  if (isNaN(ms) || ms < 0) return '—';
  const mins  = Math.floor(ms / 60000);
  if (mins < 60)  return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const m   = mins % 60;
  return `${hrs}h${m.toString().padStart(2,'0')}`;
}

function elapsedPct(startedAt, expireAt) {
  if (!expireAt) return 0;
  const start  = new Date(startedAt);
  const expire = new Date(expireAt);
  const now    = new Date();
  const total  = expire - start;
  const elapsed= now - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function statusBadge(status) {
  const map = {
    active:  ['sb-active',  'Actif'],
    closed:  ['sb-closed',  'Fermé'],
    expired: ['sb-expired', 'Expiré'],
    kicked:  ['sb-kicked',  'Déconnecté'],
  };
  const [cls, label] = map[status] || ['sb-closed', status];
  return `<span class="sbadge ${cls}">${label}</span>`;
}

function initials(name) {
  if (!name) return '?';
  return name.split(/[-_\s]/).slice(0,2).map(p => p[0]?.toUpperCase() || '').join('') || name[0].toUpperCase();
}

// ─── CHARGER SESSIONS ACTIVES ────────────────────────────────────────────
async function loadActiveSessions() {
  try {
    const data = await sApi({ action: 'active' });
    SessState.activeSessions = data.sessions || [];
    renderActiveSessions();
    updateStats(data.stats || null);
  } catch (e) {
    console.error('loadActiveSessions', e);
    showToast('Erreur chargement sessions', 'error');
  }
}

function renderActiveSessions() {
  const grid   = document.getElementById('sess-active-grid');
  const cntEl  = document.getElementById('active-count');
  const query  = (document.getElementById('search-active')?.value || '').toLowerCase();
  if (!grid) return;

  let sessions = [...SessState.activeSessions];
  if (query) {
    sessions = sessions.filter(s =>
      (s.hotspot_user || '').toLowerCase().includes(query) ||
      (s.ip_address || '').toLowerCase().includes(query) ||
      (s.mac_address || '').toLowerCase().includes(query)
    );
  }

  if (cntEl) cntEl.textContent = sessions.length;

  if (!sessions.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;"><div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      <p>Aucune session active en ce moment</p></div></div>`;
    return;
  }

  grid.innerHTML = sessions.map(s => {
    const pct = elapsedPct(s.started_at, s.expire_at);
    const dur = fmtDuration(s.started_at, null);

    return `<div class="sess-card">
      <div class="sess-card-top">
        <div class="sess-user">
          <div class="sess-avatar">${initials(s.hotspot_user)}</div>
          <div>
            <div class="sess-username">${s.hotspot_user || '—'}</div>
            <div class="sess-voucher">${s.voucher_code || ''}</div>
          </div>
        </div>
        <div class="sess-status-active"><span class="live-dot"></span> En ligne</div>
      </div>
      <div class="sess-meta">
        <div class="sess-meta-item"><label>IP</label><span>${s.ip_address || '—'}</span></div>
        <div class="sess-meta-item"><label>MAC</label><span style="font-size:0.7rem;">${s.mac_address || '—'}</span></div>
        <div class="sess-meta-item"><label>Durée</label><span>${dur}</span></div>
        <div class="sess-meta-item"><label>Offre</label><span>${s.plan_nom || '—'}</span></div>
        <div class="sess-meta-item"><label>Début</label><span>${fmt(s.started_at)}</span></div>
        <div class="sess-meta-item"><label>Expire</label><span>${fmt(s.expire_at)}</span></div>
      </div>
      <div class="sess-duration-bar">
        <div class="sess-duration-fill" style="width:${pct.toFixed(1)}%"></div>
      </div>
      <div class="sess-actions">
        <button class="btn-kick" onclick="confirmKick(${s.id}, '${s.hotspot_user}')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
          Déconnecter
        </button>
        <button class="btn-detail" onclick="showSessDetail(${s.id})" title="Détails">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </button>
      </div>
    </div>`;
  }).join('');
}
window.renderActiveSessions = renderActiveSessions;

// ─── CHARGER HISTORIQUE ──────────────────────────────────────────────────
async function loadHistory() {
  try {
    const params = { action: 'history', limit: 1000 };
    if (SessState.histStatusFilter) params.status = SessState.histStatusFilter;
    if (SessState.histDateFrom)     params.from   = SessState.histDateFrom;
    if (SessState.histDateTo)       params.to     = SessState.histDateTo;
    const data = await sApi(params);
    SessState.historyData = data.sessions || [];
    applyHistoryFilters();
  } catch (e) {
    console.error('loadHistory', e);
    showToast('Erreur chargement historique', 'error');
  }
}

function applyHistoryFilters() {
  let f = [...SessState.historyData];
  const q = SessState.histSearch.toLowerCase();
  if (q) f = f.filter(s =>
    (s.hotspot_user || '').toLowerCase().includes(q) ||
    (s.ip_address   || '').toLowerCase().includes(q) ||
    (s.mac_address  || '').toLowerCase().includes(q) ||
    (s.voucher_code || '').toLowerCase().includes(q)
  );
  if (SessState.histStatusFilter) f = f.filter(s => s.status === SessState.histStatusFilter);
  SessState.histFiltered = f;
  SessState.histPage = 1;
  renderHistoryTable();
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  const { histFiltered, histPage, histPerPage } = SessState;
  const total = histFiltered.length;
  const pages = Math.ceil(total / histPerPage) || 1;
  const start = (histPage - 1) * histPerPage;
  const slice = histFiltered.slice(start, start + histPerPage);

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      <p>Aucune session dans l'historique</p></div></td></tr>`;
    renderHistPagination(0, 1, 1);
    return;
  }

  tbody.innerHTML = slice.map(s => `<tr>
    <td>
      <div style="display:flex; align-items:center; gap:8px;">
        <div style="width:28px; height:28px; border-radius:50%; background:conic-gradient(from 120deg,#3B82F6,#8B5CF6,#EC4899,#3B82F6); display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; color:#fff; flex-shrink:0;">${initials(s.hotspot_user)}</div>
        <span>${s.hotspot_user || '—'}</span>
      </div>
    </td>
    <td><span style="font-family:monospace; color:#60A5FA; font-size:0.78rem;">${s.voucher_code || '—'}</span></td>
    <td><span style="font-family:monospace; font-size:0.78rem; color:#94A3B8;">${s.ip_address || '—'}</span></td>
    <td><span style="font-family:monospace; font-size:0.72rem; color:#64748B;">${s.mac_address || '—'}</span></td>
    <td style="color:#94A3B8; font-size:0.78rem;">${fmt(s.started_at)}</td>
    <td style="color:#94A3B8; font-size:0.78rem;">${fmt(s.ended_at)}</td>
    <td style="color:#E2E8F0;">${fmtDuration(s.started_at, s.ended_at)}</td>
    <td>${statusBadge(s.status)}</td>
    <td>
      <button onclick="showSessDetail(${s.id})" style="background:none; border:1px solid rgba(255,255,255,0.1); border-radius:7px; color:#94A3B8; padding:4px 10px; cursor:pointer; font-size:0.75rem;" title="Détails">Détails</button>
      ${s.status === 'active' ? `<button onclick="confirmKick(${s.id}, '${s.hotspot_user}')" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); border-radius:7px; color:#F87171; padding:4px 10px; cursor:pointer; font-size:0.75rem; margin-left:4px;">Kick</button>` : ''}
    </td>
  </tr>`).join('');

  renderHistPagination(total, histPage, pages);
}

function renderHistPagination(total, page, pages) {
  const info = document.getElementById('hist-pag-info');
  const btns = document.getElementById('hist-pag-btns');
  if (!info || !btns) return;
  const { histPerPage } = SessState;
  const from = total ? (page - 1) * histPerPage + 1 : 0;
  const to   = Math.min(page * histPerPage, total);
  info.textContent = total ? `${from}–${to} sur ${total}` : 'Aucun résultat';

  btns.innerHTML = '';
  const addBtn = (label, p, active = false, disabled = false) => {
    const b = document.createElement('button');
    b.className = 'pag-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.disabled = disabled;
    b.onclick = () => { SessState.histPage = p; renderHistoryTable(); };
    btns.appendChild(b);
  };
  addBtn('«', 1, false, page <= 1);
  addBtn('‹', page - 1, false, page <= 1);
  const s = Math.max(1, page - 2), e = Math.min(pages, page + 2);
  for (let p = s; p <= e; p++) addBtn(p, p, p === page);
  addBtn('›', page + 1, false, page >= pages);
  addBtn('»', pages, false, page >= pages);
}

// ─── STATS ────────────────────────────────────────────────────────────────
function updateStats(stats) {
  if (!stats) {
    const active = SessState.activeSessions;
    stats = { active: active.length, today: 0, month: 0, avg_duration: 0 };
  }
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v ?? '—'; };
  set('ss-active', stats.active ?? stats.active_count);
  set('ss-today',  stats.today  ?? stats.today_count);
  set('ss-month',  stats.month  ?? stats.month_count);
  set('ss-avg',    stats.avg_duration ?? stats.avg ?? '—');
}

// ─── DETAIL SESSION ──────────────────────────────────────────────────────
function showSessDetail(id) {
  const s = [...SessState.activeSessions, ...SessState.historyData].find(x => x.id === id);
  const body = document.getElementById('sess-detail-body');
  if (!body || !s) return;

  body.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;">
      <div style="background:#0B1220; border-radius:10px; padding:12px;">
        <div style="color:#64748B; font-size:0.7rem; text-transform:uppercase; font-weight:600; margin-bottom:6px;">Utilisateur</div>
        <div style="color:#fff; font-weight:700;">${s.hotspot_user || '—'}</div>
        <div style="color:#60A5FA; font-size:0.78rem; font-family:monospace; margin-top:4px;">${s.voucher_code || ''}</div>
      </div>
      <div style="background:#0B1220; border-radius:10px; padding:12px;">
        <div style="color:#64748B; font-size:0.7rem; text-transform:uppercase; font-weight:600; margin-bottom:6px;">Statut</div>
        <div>${statusBadge(s.status)}</div>
        <div style="color:#94A3B8; font-size:0.78rem; margin-top:6px;">Durée : ${fmtDuration(s.started_at, s.ended_at)}</div>
      </div>
    </div>
    <div style="background:#0B1220; border-radius:10px; padding:14px; margin-bottom:16px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div><div style="color:#64748B; font-size:0.68rem; text-transform:uppercase; font-weight:600;">Adresse IP</div><div style="color:#E2E8F0; font-family:monospace; font-size:0.85rem; margin-top:3px;">${s.ip_address || '—'}</div></div>
        <div><div style="color:#64748B; font-size:0.68rem; text-transform:uppercase; font-weight:600;">MAC</div><div style="color:#E2E8F0; font-family:monospace; font-size:0.82rem; margin-top:3px;">${s.mac_address || '—'}</div></div>
        <div><div style="color:#64748B; font-size:0.68rem; text-transform:uppercase; font-weight:600;">Début</div><div style="color:#E2E8F0; font-size:0.82rem; margin-top:3px;">${fmt(s.started_at)}</div></div>
        <div><div style="color:#64748B; font-size:0.68rem; text-transform:uppercase; font-weight:600;">Fin</div><div style="color:#E2E8F0; font-size:0.82rem; margin-top:3px;">${fmt(s.ended_at)}</div></div>
        <div><div style="color:#64748B; font-size:0.68rem; text-transform:uppercase; font-weight:600;">Offre</div><div style="color:#60A5FA; font-size:0.82rem; margin-top:3px;">${s.plan_nom || '—'}</div></div>
        <div><div style="color:#64748B; font-size:0.68rem; text-transform:uppercase; font-weight:600;">Session ID</div><div style="color:#64748B; font-family:monospace; font-size:0.78rem; margin-top:3px;">#${s.id}</div></div>
      </div>
    </div>
    <div style="display:flex; justify-content:flex-end; gap:10px;">
      ${s.status === 'active' ? `<button class="btn btn-outline" style="color:#F87171; border-color:rgba(239,68,68,0.3); font-size:0.84rem;" onclick="closeModal('modal-sess-detail'); confirmKick(${s.id}, '${s.hotspot_user}')">Déconnecter</button>` : ''}
      <button class="btn btn-outline" onclick="closeModal('modal-sess-detail')">Fermer</button>
    </div>`;

  openModal('modal-sess-detail');
}
window.showSessDetail = showSessDetail;

// ─── KICK ────────────────────────────────────────────────────────────────
function confirmKick(id, user) {
  SessState.kickTargetId   = id;
  SessState.kickTargetUser = user;
  document.getElementById('kick-user-label').textContent = user;
  openModal('modal-kick');
}
window.confirmKick = confirmKick;

async function doKick() {
  const { kickTargetId, kickTargetUser } = SessState;
  if (!kickTargetId) return;
  try {
    const data = await sApiPost({ action: 'kick', id: kickTargetId, user: kickTargetUser });
    closeModal('modal-kick');
    if (data.success) {
      showToast(`${kickTargetUser} déconnecté`, 'success');
      await loadActiveSessions();
    } else {
      showToast(data.error || 'Erreur kick', 'error');
    }
  } catch { showToast('Erreur réseau', 'error'); }
}

async function doKickAll() {
  try {
    const data = await sApiPost({ action: 'kick_all' });
    closeModal('modal-kick-all');
    if (data.success) {
      showToast(`${data.kicked || 0} session(s) déconnectée(s)`, 'success');
      await loadActiveSessions();
    } else {
      showToast(data.error || 'Erreur', 'error');
    }
  } catch { showToast('Erreur réseau', 'error'); }
}

// ─── EXPORT HISTORIQUE ────────────────────────────────────────────────────
function exportHistoryCSV() {
  const { histFiltered } = SessState;
  if (!histFiltered.length) { showToast('Aucune donnée', 'warn'); return; }
  const headers = ['ID','Utilisateur','Voucher','IP','MAC','Début','Fin','Durée','Statut'];
  const rows = histFiltered.map(s => [
    s.id, s.hotspot_user || '', s.voucher_code || '',
    s.ip_address || '', s.mac_address || '',
    s.started_at || '', s.ended_at || '',
    fmtDuration(s.started_at, s.ended_at),
    s.status
  ].map(f => `"${String(f).replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = `sessions_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ─── AUTO-REFRESH ─────────────────────────────────────────────────────────
function startAutoRefresh() {
  SessState.autoRefreshTimer = setInterval(loadActiveSessions, 30000);
}

// ─── TABS ─────────────────────────────────────────────────────────────────
function switchTab(tab) {
  const panels = { actives: 'panel-actives', historique: 'panel-historique' };
  Object.entries(panels).forEach(([k, panelId]) => {
    const panel = document.getElementById(panelId);
    const btn   = document.getElementById(`ptab-${k}`);
    if (panel) panel.style.display = k === tab ? 'block' : 'none';
    if (btn)   btn.classList.toggle('active', k === tab);
  });
  if (tab === 'historique' && !SessState.historyData.length) loadHistory();
}

// ─── INIT ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadActiveSessions();
  startAutoRefresh();

  // Tab buttons
  document.querySelectorAll('.ptab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Search active
  document.getElementById('search-active')?.addEventListener('input', e => {
    SessState.searchQuery = e.target.value;
    renderActiveSessions();
  });

  // Refresh button
  document.getElementById('btn-refresh-sessions')?.addEventListener('click', () => {
    loadActiveSessions();
    showToast('Sessions actualisées', 'info');
  });

  // History filters
  document.getElementById('search-history')?.addEventListener('input', e => {
    SessState.histSearch = e.target.value.trim();
    applyHistoryFilters();
  });
  document.getElementById('filter-history-status')?.addEventListener('change', e => {
    SessState.histStatusFilter = e.target.value;
    applyHistoryFilters();
  });
  document.getElementById('btn-apply-history-filter')?.addEventListener('click', () => {
    SessState.histDateFrom = document.getElementById('filter-date-from')?.value || '';
    SessState.histDateTo   = document.getElementById('filter-date-to')?.value || '';
    loadHistory();
  });
  document.getElementById('btn-export-history')?.addEventListener('click', exportHistoryCSV);

  // Kick all
  document.getElementById('btn-kick-all')?.addEventListener('click', () => {
    const cnt = SessState.activeSessions.length;
    document.getElementById('kick-all-count').textContent = cnt;
    openModal('modal-kick-all');
  });

  // Confirm kick
  document.getElementById('btn-confirm-kick')?.addEventListener('click', doKick);
  document.getElementById('btn-confirm-kick-all')?.addEventListener('click', doKickAll);

  // Theme toggle
  const tt = document.getElementById('theme-toggle');
  if (tt) {
    tt.addEventListener('click', () => {
      const dark = document.documentElement.hasAttribute('data-theme');
      dark ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme','dark');
      localStorage.setItem('hotspot-theme', dark ? 'light' : 'dark');
    });
  }

  // Fermer modals en cliquant overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.style.display = 'none'; });
  });
});
