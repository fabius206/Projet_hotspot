/**
 * vouchers.js — Gestion des vouchers (liste, récupération code, désactivation)
 * Endpoint: ../login_php/api_vouchers.php (ou guard.js apiCall)
 */

'use strict';

// ─── STATE ───────────────────────────────────────────────────────────────
const VouchersState = {
  allData:       [],
  filtered:      [],
  currentPage:   1,
  perPage:       25,
  activeStatus:  '',
  activeOffre:   '',
  searchQuery:   '',
  selectedIds:   new Set(),
  actionVoucherId: null,
  actionCode:      '',
};

// ─── API HELPER ─────────────────────────────────────────────────────────
async function vApi(params = {}) {
  const base = '../login_php/api_vouchers.php';
  const qs   = new URLSearchParams(params).toString();
  const res  = await fetch(base + (qs ? '?' + qs : ''), {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return res.json();
}

async function vApiPost(body = {}) {
  const res = await fetch('../login_php/api_vouchers.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── TOAST ───────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const c  = document.getElementById('toast-container');
  const t  = document.getElementById('toast-text');
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

// ─── MODAL HELPERS ───────────────────────────────────────────────────────
function openModal(id)  { const m = document.getElementById(id); if (m) m.style.display = 'flex'; }
function closeModal(id) { const m = document.getElementById(id); if (m) m.style.display = 'none'; }
window.closeModal = closeModal;

// ─── STATUS BADGE ────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    non_utilise: ['bv-libre',  '⬜ Libre'],
    actif:       ['bv-actif',  '🟢 Actif'],
    expire:      ['bv-expire', '🟡 Expiré'],
    desactive:   ['bv-desact', '🔴 Désactivé'],
  };
  const [cls, label] = map[status] || ['bv-libre', status];
  return `<span class="badge-voucher ${cls}">${label}</span>`;
}

// ─── FORMAT HELPERS ──────────────────────────────────────────────────────
function fmt(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return isNaN(d) ? dt : d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' });
}
function fmtDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('fr-FR');
}

// ─── CHARGER LES DONNÉES ─────────────────────────────────────────────────
async function loadVouchers() {
  try {
    const data = await vApi({ action: 'list', limit: 2000 });
    VouchersState.allData = data.vouchers || data.data || [];
    applyFilters();
    updateStats(data.stats || null);
    loadOffresFilter(data.offres || []);
  } catch (e) {
    console.error('loadVouchers', e);
    showToast('Erreur chargement vouchers', 'error');
  }
}

function loadOffresFilter(offres) {
  const sel = document.getElementById('voucher-offre-filter');
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  offres.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.id || o.nom;
    opt.textContent = o.nom;
    sel.appendChild(opt);
  });
}

function updateStats(stats) {
  if (!stats) {
    // Calcule depuis allData
    const d = VouchersState.allData;
    stats = {
      total:    d.length,
      libre:    d.filter(v => v.status === 'non_utilise').length,
      actif:    d.filter(v => v.status === 'actif').length,
      expire:   d.filter(v => ['expire','desactive'].includes(v.status)).length,
    };
  }
  document.getElementById('vs-total')?.setText !== undefined
    ? null
    : ['vs-total','vs-libre','vs-actif','vs-expire'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const key = id.replace('vs-', '');
        el.textContent = stats[key] ?? '—';
      });
  const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v ?? '—'; };
  setEl('vs-total',  stats.total);
  setEl('vs-libre',  stats.libre  ?? stats.disponibles);
  setEl('vs-actif',  stats.actif);
  setEl('vs-expire', (stats.expire ?? 0) + (stats.desactive ?? 0));
}

// ─── FILTRES ─────────────────────────────────────────────────────────────
function applyFilters() {
  const { allData, activeStatus, activeOffre, searchQuery } = VouchersState;
  let f = [...allData];

  if (activeStatus) f = f.filter(v => v.status === activeStatus);
  if (activeOffre)  f = f.filter(v => String(v.plan_id) === String(activeOffre) || v.plan_nom === activeOffre);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    f = f.filter(v =>
      (v.code || '').toLowerCase().includes(q) ||
      (v.plan_nom || '').toLowerCase().includes(q) ||
      (v.hotspot_user || '').toLowerCase().includes(q) ||
      (v.mac_address || '').toLowerCase().includes(q)
    );
  }

  VouchersState.filtered    = f;
  VouchersState.currentPage = 1;
  renderTable();
}

// ─── RENDU TABLE ─────────────────────────────────────────────────────────
function renderTable() {
  const { filtered, currentPage, perPage, selectedIds } = VouchersState;
  const tbody = document.getElementById('voucher-tbody');
  if (!tbody) return;

  const total   = filtered.length;
  const pages   = Math.ceil(total / perPage) || 1;
  const start   = (currentPage - 1) * perPage;
  const slice   = filtered.slice(start, start + perPage);

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      <p>Aucun voucher trouvé</p></div></td></tr>`;
    renderPagination(0, 1, 1);
    return;
  }

  tbody.innerHTML = slice.map(v => {
    const checked = selectedIds.has(v.id) ? 'checked' : '';
    const codeBadge = `<span class="code-badge" onclick="revealCode(${v.id}, '${v.code}', '${v.plan_nom || ''}')" title="Voir/copier le code">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      ${v.code}
    </span>`;
    const macStr = v.mac_address ? `<span title="${v.mac_address}" style="font-size:0.72rem; color:#64748B;">${v.mac_address.substring(0,8)}…</span>` : '—';
    const clientStr = v.hotspot_user || v.client_nom || '—';

    return `<tr>
      <td><input type="checkbox" class="v-check" data-id="${v.id}" ${checked} style="accent-color:#3B82F6; cursor:pointer;"></td>
      <td>${codeBadge}</td>
      <td><span style="color:#E2E8F0; font-size:0.83rem;">${v.plan_nom || '—'}</span></td>
      <td><span style="color:#4ADE80; font-weight:600;">${v.prix ? Number(v.prix).toLocaleString('fr-FR') + ' Ar' : '—'}</span></td>
      <td>${statusBadge(v.status)}</td>
      <td style="color:#94A3B8; font-size:0.78rem;">${fmtDate(v.created_at)}</td>
      <td style="color:#94A3B8; font-size:0.78rem;">${fmt(v.used_at)}</td>
      <td style="color:${v.expire_at && new Date(v.expire_at) < new Date() ? '#F87171' : '#94A3B8'}; font-size:0.78rem;">${fmt(v.expire_at)}</td>
      <td><div style="display:flex; flex-direction:column; gap:2px;">${clientStr}<br>${macStr}</div></td>
      <td>
        <div style="display:flex; gap:5px; align-items:center;">
          <button class="vaction-btn" onclick="revealCode(${v.id}, '${v.code}', '${v.plan_nom||''}')" title="Voir le code">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          ${v.status !== 'desactive' ? `<button class="vaction-btn" onclick="confirmDeactivate(${v.id}, '${v.code}')" title="Désactiver">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </button>` : ''}
          <button class="vaction-btn danger" onclick="confirmDelete(${v.id}, '${v.code}')" title="Supprimer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // Checkbox listeners
  tbody.querySelectorAll('.v-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.dataset.id);
      cb.checked ? VouchersState.selectedIds.add(id) : VouchersState.selectedIds.delete(id);
      updateBulkToolbar();
    });
  });

  renderPagination(total, currentPage, pages);
}

// ─── PAGINATION ──────────────────────────────────────────────────────────
function renderPagination(total, page, pages) {
  const info = document.getElementById('pag-info');
  const btns = document.getElementById('pag-btns');
  if (!info || !btns) return;

  const { perPage } = VouchersState;
  const from = total ? (page - 1) * perPage + 1 : 0;
  const to   = Math.min(page * perPage, total);
  info.textContent = total ? `${from}–${to} sur ${total}` : 'Aucun résultat';

  btns.innerHTML = '';
  const addBtn = (label, p, active = false, disabled = false) => {
    const b = document.createElement('button');
    b.className = 'pag-btn' + (active ? ' active' : '');
    b.textContent = label;
    b.disabled = disabled;
    b.onclick = () => { VouchersState.currentPage = p; renderTable(); };
    btns.appendChild(b);
  };

  addBtn('«', 1, false, page <= 1);
  addBtn('‹', page - 1, false, page <= 1);
  const start = Math.max(1, page - 2);
  const end   = Math.min(pages, page + 2);
  for (let p = start; p <= end; p++) addBtn(p, p, p === page);
  addBtn('›', page + 1, false, page >= pages);
  addBtn('»', pages, false, page >= pages);
}

// ─── BULK TOOLBAR ────────────────────────────────────────────────────────
function updateBulkToolbar() {
  const n   = VouchersState.selectedIds.size;
  const bar = document.getElementById('bulk-toolbar');
  const cnt = document.getElementById('bulk-count-n');
  if (!bar || !cnt) return;
  cnt.textContent = n;
  bar.classList.toggle('visible', n > 0);
}

// ─── REVEAL CODE ─────────────────────────────────────────────────────────
function revealCode(id, code, planNom) {
  document.getElementById('reveal-code-text').textContent = code;
  document.getElementById('reveal-offre-label').textContent = planNom ? `Offre : ${planNom}` : '';
  const v = VouchersState.allData.find(x => x.id === id) || {};
  const parts = [
    v.status   ? `Statut : ${v.status}` : '',
    v.prix     ? `Prix : ${Number(v.prix).toLocaleString('fr-FR')} Ar` : '',
    v.used_at  ? `Utilisé le : ${fmt(v.used_at)}` : '',
    v.expire_at? `Expire le : ${fmt(v.expire_at)}` : '',
  ].filter(Boolean);
  document.getElementById('reveal-meta').innerHTML = parts.join('<br>');
  openModal('modal-code-reveal');
}
window.revealCode = revealCode;

function copyRevealCode() {
  const txt = document.getElementById('reveal-code-text')?.textContent;
  if (!txt) return;
  navigator.clipboard.writeText(txt).then(() => {
    showToast('Code copié !', 'success');
    const btn = document.getElementById('btn-reveal-copy');
    if (btn) { const orig = btn.innerHTML; btn.textContent = '✓ Copié'; setTimeout(() => { btn.innerHTML = orig; }, 1500); }
  });
}
window.copyRevealCode = copyRevealCode;

// ─── DÉSACTIVATION ───────────────────────────────────────────────────────
function confirmDeactivate(id, code) {
  VouchersState.actionVoucherId = id;
  VouchersState.actionCode      = code;
  document.getElementById('deact-code-label').textContent = code;
  openModal('modal-deactivate');
}
window.confirmDeactivate = confirmDeactivate;

async function doDeactivate() {
  const id = VouchersState.actionVoucherId;
  if (!id) return;
  try {
    const data = await vApiPost({ action: 'deactivate', id });
    closeModal('modal-deactivate');
    if (data.success) {
      showToast('Voucher désactivé', 'success');
      const v = VouchersState.allData.find(x => x.id === id);
      if (v) v.status = 'desactive';
      applyFilters();
    } else {
      showToast(data.error || 'Erreur', 'error');
    }
  } catch (e) {
    showToast('Erreur réseau', 'error');
  }
}

// ─── SUPPRESSION ──────────────────────────────────────────────────────────
function confirmDelete(id, code) {
  VouchersState.actionVoucherId = id;
  VouchersState.actionCode      = code;
  document.getElementById('del-code-label').textContent = code;
  openModal('modal-delete-voucher');
}
window.confirmDelete = confirmDelete;

async function doDelete() {
  const id = VouchersState.actionVoucherId;
  if (!id) return;
  try {
    const data = await vApiPost({ action: 'delete', id });
    closeModal('modal-delete-voucher');
    if (data.success) {
      showToast('Voucher supprimé', 'success');
      VouchersState.allData = VouchersState.allData.filter(x => x.id !== id);
      applyFilters();
    } else {
      showToast(data.error || 'Erreur', 'error');
    }
  } catch (e) {
    showToast('Erreur réseau', 'error');
  }
}

// ─── EXPORT CSV ──────────────────────────────────────────────────────────
function exportCSV() {
  const { filtered } = VouchersState;
  if (!filtered.length) { showToast('Aucune donnée à exporter', 'warn'); return; }
  const headers = ['Code','Offre','Prix','Statut','Créé le','Utilisé le','Expire le','Client','MAC'];
  const rows = filtered.map(v => [
    v.code, v.plan_nom || '', v.prix || '',
    v.status, v.created_at || '', v.used_at || '', v.expire_at || '',
    v.hotspot_user || v.client_nom || '', v.mac_address || ''
  ].map(f => `"${String(f).replace(/"/g,'""')}"`).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
  a.download = `vouchers_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ─── INIT ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadVouchers();

  // Status tabs
  document.querySelectorAll('.ftab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      VouchersState.activeStatus = btn.dataset.status;
      applyFilters();
    });
  });

  // Search
  document.getElementById('voucher-search')?.addEventListener('input', e => {
    VouchersState.searchQuery = e.target.value.trim();
    applyFilters();
  });

  // Offre filter
  document.getElementById('voucher-offre-filter')?.addEventListener('change', e => {
    VouchersState.activeOffre = e.target.value;
    applyFilters();
  });

  // Per page
  document.getElementById('voucher-per-page')?.addEventListener('change', e => {
    VouchersState.perPage = parseInt(e.target.value);
    applyFilters();
  });

  // Check all
  document.getElementById('check-all')?.addEventListener('change', e => {
    const { filtered, currentPage, perPage } = VouchersState;
    const slice = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
    slice.forEach(v => e.target.checked ? VouchersState.selectedIds.add(v.id) : VouchersState.selectedIds.delete(v.id));
    renderTable();
    updateBulkToolbar();
  });

  // Bulk buttons
  document.getElementById('btn-bulk-deactivate')?.addEventListener('click', async () => {
    const ids = [...VouchersState.selectedIds];
    if (!ids.length) return;
    if (typeof window.showConfirm === 'function' && !(await window.showConfirm(`Désactiver ${ids.length} voucher(s) ?`, {
      title: 'Désactiver les vouchers ?',
      confirmLabel: 'Désactiver'
    }))) return;
    try {
      await vApiPost({ action: 'bulk_deactivate', ids });
      ids.forEach(id => {
        const v = VouchersState.allData.find(x => x.id === id);
        if (v) v.status = 'desactive';
      });
      VouchersState.selectedIds.clear();
      applyFilters(); updateBulkToolbar();
      showToast(`${ids.length} voucher(s) désactivé(s)`, 'success');
    } catch { showToast('Erreur', 'error'); }
  });

  document.getElementById('btn-bulk-delete')?.addEventListener('click', async () => {
    const ids = [...VouchersState.selectedIds];
    if (!ids.length) return;
    if (typeof window.showConfirm === 'function' && !(await window.showConfirm(`Supprimer ${ids.length} voucher(s) ? Cette action est irréversible.`, {
      title: 'Supprimer les vouchers ?',
      confirmLabel: 'Supprimer'
    }))) return;
    try {
      await vApiPost({ action: 'bulk_delete', ids });
      VouchersState.allData = VouchersState.allData.filter(v => !ids.includes(v.id));
      VouchersState.selectedIds.clear();
      applyFilters(); updateBulkToolbar();
      showToast(`${ids.length} voucher(s) supprimé(s)`, 'success');
    } catch { showToast('Erreur', 'error'); }
  });

  document.getElementById('btn-bulk-cancel')?.addEventListener('click', () => {
    VouchersState.selectedIds.clear();
    renderTable(); updateBulkToolbar();
  });

  // Export CSV
  document.getElementById('btn-export-vouchers')?.addEventListener('click', exportCSV);

  // Print
  document.getElementById('btn-print-vouchers')?.addEventListener('click', () => window.print());

  // Modal confirm deactivate
  document.getElementById('btn-confirm-deact')?.addEventListener('click', doDeactivate);

  // Modal confirm delete
  document.getElementById('btn-confirm-delete-v')?.addEventListener('click', doDelete);

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
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });
  setInterval(()=>{ if(!document.hidden) loadVouchers(); }, 15000);
});
