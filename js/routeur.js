/**
 * routeur.js — Gestion du routeur MikroTik (Super-Admin)
 * Appelle router_detect_sync.php
 */

'use strict';

// ─── API ─────────────────────────────────────────────────────────────────
const ROUTER_API = '../router_detect_sync.php';

async function rApi(params = {}) {
  const qs  = new URLSearchParams(params).toString();
  const res = await fetch(ROUTER_API + (qs ? '?' + qs : ''), {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'same-origin',
  });
  return res.json();
}

async function rApiPost(body = {}) {
  const res = await fetch(ROUTER_API, {
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

// ─── TABS ─────────────────────────────────────────────────────────────────
const rtabIds = ['config', 'detection', 'sync', 'logs'];

function switchRTab(tab) {
  rtabIds.forEach(id => {
    const panel = document.getElementById(`rtab-${id}`);
    const btn   = document.querySelector(`.rtab[data-rtab="${id}"]`);
    if (panel) panel.style.display = id === tab ? 'block' : 'none';
    if (btn)   btn.classList.toggle('active', id === tab);
  });
  if (tab === 'logs') loadLogs();
}

// ─── FORMAT ──────────────────────────────────────────────────────────────
function fmt(dt) {
  if (!dt) return '—';
  const d = new Date(dt);
  return isNaN(d) ? dt : d.toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit' });
}

// ─── LOG APPEND ──────────────────────────────────────────────────────────
function appendLog(containerId, msg, level = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const time = new Date().toLocaleTimeString('fr-FR');
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-${level}">${msg}</span>`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

function clearLog(containerId) {
  const c = document.getElementById(containerId);
  if (c) c.innerHTML = '';
}

// ─── PROGRESS ────────────────────────────────────────────────────────────
function setProgress(progressId, fillId, labelId, pctId, pct, label) {
  const prog = document.getElementById(progressId);
  const fill = document.getElementById(fillId);
  const lbl  = document.getElementById(labelId);
  const pctEl= document.getElementById(pctId);
  if (prog) prog.classList.add('visible');
  if (fill) fill.style.width = `${pct}%`;
  if (lbl)  lbl.textContent = label;
  if (pctEl)pctEl.textContent = `${Math.round(pct)}%`;
}

function hideProgress(progressId) {
  const prog = document.getElementById(progressId);
  if (prog) prog.classList.remove('visible');
}

// ─── CHARGER CONFIG ───────────────────────────────────────────────────────
async function loadConfig() {
  try {
    const data = await rApi({ action: 'get_config' });
    if (!data.config) return;
    const c = data.config;
    document.getElementById('cfg-ip')?.setAttribute('value', c.router_ip || '');
    if (document.getElementById('cfg-ip'))
      document.getElementById('cfg-ip').value = c.router_ip || '';
    const setV = (id, v) => { const e = document.getElementById(id); if (e) e.value = v || ''; };
    setV('cfg-port',      c.router_port      || '8728');
    setV('cfg-user',      c.router_user      || 'admin');
    setV('cfg-interface', c.router_interface || '');
    const freq = document.getElementById('cfg-sync-freq');
    if (freq) freq.value = c.sync_freq || '0';
    const dir = document.getElementById('cfg-sync-dir');
    if (dir) dir.value = c.sync_dir || 'both';
  } catch (e) {
    console.error('loadConfig', e);
  }
}

// ─── CHARGER STATUT ROUTEUR ──────────────────────────────────────────────
async function loadRouterStatus() {
  try {
    const data = await rApi({ action: 'status' });
    updateHeroPill(data.online, data.latency);
    if (data.ip) {
      setEl('r-ip', `IP: ${data.ip}:${data.port || 8728}`);
      setEl('di-ip', data.ip);
    }
    if (data.last_sync) {
      setEl('r-last-sync', fmt(data.last_sync).split(' ')[1] || '—');
      setEl('r-sync-status', data.last_sync_type ? `Type: ${data.last_sync_type}` : '—');
    }
  } catch (e) {
    updateHeroPill(false, null);
  }
}

function setEl(id, val) {
  const e = document.getElementById(id);
  if (e) e.textContent = val ?? '—';
}

function updateHeroPill(online, latency) {
  const pill  = document.getElementById('r-status-pill');
  const text  = document.getElementById('r-status-text');
  const dot   = pill?.querySelector('.router-dot');
  if (!pill || !text) return;
  if (online) {
    pill.className = 'router-status-pill rsp-online';
    text.textContent = latency ? `En ligne · ${latency}` : 'En ligne';
    if (dot) dot.classList.add('pulse');
  } else {
    pill.className = 'router-status-pill rsp-offline';
    text.textContent = 'Hors ligne';
    if (dot) dot.classList.remove('pulse');
  }
}

// ─── CHARGER INFOS ROUTEUR ───────────────────────────────────────────────
async function loadRouterInfo() {
  try {
    showToast('Récupération des informations…', 'info');
    const data = await rApi({ action: 'info' });
    if (!data.connected) {
      showToast(data.error || 'Routeur non accessible', 'error');
      return;
    }
    // Hero
    setEl('r-name',        data.hostname || 'MikroTik');
    setEl('r-model',       data.model    || '—');
    setEl('r-ip',          `IP: ${document.getElementById('cfg-ip')?.value || '—'}`);
    setEl('r-ros-version', data.ros_version || '—');
    setEl('r-ros-channel', data.architecture || '—');
    setEl('r-uptime',      data.uptime || '—');
    setEl('r-board',       `Board: ${data.model || '—'}`);

    // Detected info panel
    setEl('di-hostname', data.hostname  || '—');
    setEl('di-model',    data.model     || '—');
    setEl('di-ros',      data.ros_version || '—');
    setEl('di-arch',     data.architecture || '—');
    setEl('di-cpu',      data.cpu       || '—');
    setEl('di-ram',      data.total_ram || '—');
    setEl('di-uptime',   data.uptime    || '—');
    setEl('di-serial',   data.serial    || '—');

    // Hotspot
    if (data.hotspot?.count >= 0) {
      setEl('ni-active-users', data.hotspot.count + ' hotspot(s)');
      if (data.hotspot.list?.length) {
        const h = data.hotspot.list[0];
        setEl('ni-interface', h.interface || '—');
        setEl('ni-profile',   h.profile   || '—');
      }
    }

    // API status
    const apiEl = document.getElementById('r-api-status');
    if (apiEl) apiEl.innerHTML = `<span class="api-badge ab-ok">✓ API Opérationnelle</span>`;
    const apiPortEl = document.getElementById('r-api-port');
    if (apiPortEl) apiPortEl.textContent = `Port: ${document.getElementById('cfg-port')?.value || '8728'}`;

    showToast('Informations récupérées', 'success');
  } catch (e) {
    showToast('Erreur récupération infos', 'error');
  }
}

// ─── CHARGER RESSOURCES ──────────────────────────────────────────────────
async function loadResources() {
  try {
    const data = await rApi({ action: 'resources' });
    if (!data.connected) { showToast(data.error || 'Non connecté', 'error'); return; }

    setEl('res-cpu-val', `${data.cpu_load ?? '—'}%`);
    const cpuBar = document.getElementById('res-cpu-bar');
    if (cpuBar) cpuBar.style.width = (data.cpu_load || 0) + '%';

    setEl('res-ram-val', `${data.ram_pct ?? '—'}% (${data.ram_used_mb ?? '—'} / ${data.ram_total_mb ?? '—'} Mo)`);
    const ramBar = document.getElementById('res-ram-bar');
    if (ramBar) ramBar.style.width = (data.ram_pct || 0) + '%';

    const fmtBytes = b => b >= 1073741824 ? (b/1073741824).toFixed(1)+' GB' : b >= 1048576 ? (b/1048576).toFixed(1)+' MB' : b >= 1024 ? (b/1024).toFixed(0)+' KB' : b+' B';
    setEl('res-up',   data.up_bytes   ? fmtBytes(data.up_bytes)   : '—');
    setEl('res-down', data.down_bytes ? fmtBytes(data.down_bytes) : '—');
    setEl('res-temp', data.temperature ? `${data.temperature}°C` : '—');
    setEl('r-uptime', data.uptime || '—');
  } catch (e) {
    showToast('Erreur ressources', 'error');
  }
}

// ─── TEST CONNEXION ───────────────────────────────────────────────────────
async function testConnection() {
  const ip   = document.getElementById('cfg-ip')?.value.trim();
  const port = document.getElementById('cfg-port')?.value || '8728';
  const user = document.getElementById('cfg-user')?.value.trim();
  const pass = document.getElementById('cfg-pass')?.value;
  if (!ip) { showToast('Entrez l\'IP du routeur', 'warn'); return; }

  const res = document.getElementById('test-connect-result');
  if (res) { res.style.display = 'block'; res.innerHTML = '<span style="color:#94A3B8;">Test en cours…</span>'; }
  updateHeroPill(null, null);

  try {
    const data = await rApi({ action: 'test', ip, port, user, pass: pass || '' });
    if (res) {
      if (data.connected) {
        res.innerHTML = `<div style="color:#4ADE80; display:flex; align-items:center; gap:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Connexion réussie · ${data.latency} · ${data.identity} · RouterOS ${data.ros}
        </div>`;
        updateHeroPill(true, data.latency);
      } else {
        res.innerHTML = `<div style="color:#F87171; display:flex; align-items:center; gap:8px;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          ${data.error || 'Connexion échouée'}
        </div>`;
        updateHeroPill(false, null);
      }
    }
  } catch (e) {
    if (res) res.innerHTML = '<span style="color:#F87171;">Erreur réseau</span>';
    updateHeroPill(false, null);
  }
}

// ─── SAUVEGARDER CONFIG ───────────────────────────────────────────────────
async function saveConfig() {
  const config = {
    ip:        document.getElementById('cfg-ip')?.value.trim(),
    port:      document.getElementById('cfg-port')?.value || '8728',
    user:      document.getElementById('cfg-user')?.value.trim(),
    pass:      document.getElementById('cfg-pass')?.value || '',
    interface: document.getElementById('cfg-interface')?.value.trim(),
    sync_freq: document.getElementById('cfg-sync-freq')?.value || '0',
    sync_dir:  document.getElementById('cfg-sync-dir')?.value  || 'both',
  };
  if (!config.ip) { showToast('Entrez l\'IP du routeur', 'warn'); return; }
  try {
    const data = await rApi({ action: 'save_config', ...config });
    if (data.success) showToast('Configuration sauvegardée', 'success');
    else showToast(data.error || 'Erreur sauvegarde', 'error');
  } catch { showToast('Erreur réseau', 'error'); }
}

// ─── DÉTECTION API ────────────────────────────────────────────────────────
async function runDetection() {
  const ip = document.getElementById('cfg-ip')?.value.trim();
  clearLog('detect-log');
  appendLog('detect-log', `Scan démarré vers ${ip || 'plage par défaut'}…`, 'info');

  const ports = [8728, 8729, 80, 443, 22];
  setProgress('detect-progress', 'detect-prog-fill', 'detect-prog-label', 'detect-prog-pct', 5, 'Initialisation…');
  document.getElementById('detect-results')?.style !== undefined
    && (document.getElementById('detect-results').style.display = 'none');
  document.getElementById('api-result-card')?.style !== undefined
    && (document.getElementById('api-result-card').style.display = 'none');

  try {
    appendLog('detect-log', 'Envoi de la requête de scan…', 'info');
    setProgress('detect-progress', 'detect-prog-fill', 'detect-prog-label', 'detect-prog-pct', 30, 'Scan des ports…');

    const data = await rApi({ action: 'detect', ip: ip || '' });

    setProgress('detect-progress', 'detect-prog-fill', 'detect-prog-label', 'detect-prog-pct', 90, 'Analyse des résultats…');

    if (data.detected_ip) {
      appendLog('detect-log', `✓ Routeur détecté : ${data.detected_ip}`, 'ok');
    } else {
      appendLog('detect-log', '✗ Aucun routeur détecté', 'err');
    }

    // Affiche les résultats par port
    const grid = document.getElementById('detect-ports-grid');
    const resultsDiv = document.getElementById('detect-results');
    if (grid && data.findings) {
      const ip_key = data.detected_ip || Object.keys(data.findings)[0];
      const portRes = data.findings[ip_key] || {};
      grid.innerHTML = Object.values(portRes).map(p => `
        <div style="background:${p.status === 'open' ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${p.status === 'open' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}; border-radius:12px; padding:14px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="width:8px; height:8px; border-radius:50%; background:${p.status === 'open' ? '#4ADE80' : '#F87171'}; display:inline-block;"></span>
            <span style="color:#fff; font-weight:700; font-size:0.85rem;">Port ${p.port}</span>
          </div>
          <div style="color:#94A3B8; font-size:0.75rem;">${p.name}</div>
          ${p.latency ? `<div style="color:#60A5FA; font-size:0.73rem; margin-top:4px;">Latence: ${p.latency}</div>` : ''}
          <div style="color:${p.status === 'open' ? '#4ADE80' : '#F87171'}; font-size:0.73rem; margin-top:4px; font-weight:600;">${p.status === 'open' ? '✓ Ouvert' : '✗ Fermé'}</div>
        </div>
      `).join('');

      ports.forEach(pn => {
        const pInfo = portRes[pn];
        if (pInfo) appendLog('detect-log', `Port ${pn} (${pInfo.name}): ${pInfo.status === 'open' ? '✓ Ouvert ' + (pInfo.latency || '') : '✗ Fermé'}`, pInfo.status === 'open' ? 'ok' : 'warn');
      });

      if (resultsDiv) resultsDiv.style.display = 'block';
    }

    // Best API
    if (data.best_api) {
      const r = data.best_api;
      setEl('api-method',     r.method  || '—');
      setEl('api-port-found', r.port    || '—');
      setEl('api-latency',    r.latency || '—');
      setEl('api-ssl',        r.ssl ? 'Oui' : 'Non');
      const card = document.getElementById('api-result-card');
      if (card) card.style.display = 'block';
      appendLog('detect-log', `★ Meilleure API : ${r.method} sur port ${r.port}`, 'ok');

      // Met à jour hero
      const apiEl = document.getElementById('r-api-status');
      if (apiEl) apiEl.innerHTML = `<span class="api-badge ab-ok">✓ ${r.method}</span>`;
      setEl('r-api-port', `Port: ${r.port}`);

      // Stocker pour "Appliquer"
      window._detectedApi = r;
    } else {
      appendLog('detect-log', '✗ Aucune API RouterOS détectée', 'err');
      const apiEl = document.getElementById('r-api-status');
      if (apiEl) apiEl.innerHTML = `<span class="api-badge ab-nok">✗ Non détectée</span>`;
    }

    setProgress('detect-progress', 'detect-prog-fill', 'detect-prog-label', 'detect-prog-pct', 100, 'Terminé');
    setTimeout(() => hideProgress('detect-progress'), 1500);
    showToast(data.detected_ip ? 'Routeur détecté !' : 'Aucun routeur trouvé', data.detected_ip ? 'success' : 'warn');

  } catch (e) {
    appendLog('detect-log', 'Erreur : ' + e.message, 'err');
    hideProgress('detect-progress');
    showToast('Erreur de détection', 'error');
  }
}

// ─── SYNC ─────────────────────────────────────────────────────────────────
async function runSync(type) {
  clearLog('sync-log');
  appendLog('sync-log', `Démarrage de la synchronisation (${type})…`, 'info');
  setProgress('sync-progress', 'sync-prog-fill', 'sync-prog-label', 'sync-prog-pct', 10, 'Connexion au routeur…');

  const actionMap = { push: 'sync_push', pull: 'sync_pull', full: 'sync_full' };
  const action    = actionMap[type] || 'sync_full';

  try {
    setProgress('sync-progress', 'sync-prog-fill', 'sync-prog-label', 'sync-prog-pct', 40, 'Synchronisation en cours…');
    const data = await rApi({ action });
    setProgress('sync-progress', 'sync-prog-fill', 'sync-prog-label', 'sync-prog-pct', 100, 'Terminé');

    if (data.success) {
      if (type === 'push' || type === 'full') {
        const push = data.push || data;
        appendLog('sync-log', `✓ Push: ${push.sent} envoyés, ${push.skipped || 0} ignorés, ${push.errors || 0} erreurs`, push.errors ? 'warn' : 'ok');
        setEl('sc-sent', push.sent ?? '—');
        setEl('sc-errors', push.errors ?? '0');
      }
      if (type === 'pull' || type === 'full') {
        const pull = data.pull || data;
        appendLog('sync-log', `✓ Pull: ${pull.imported} importés, ${pull.conflicts || 0} conflits`, 'ok');
        setEl('sc-imported', pull.imported ?? '—');
        setEl('sc-conflicts', pull.conflicts ?? '0');
      }
      if (data.synced_at) appendLog('sync-log', `Synchro terminée à ${fmt(data.synced_at)}`, 'info');
      setEl('r-last-sync', new Date(data.synced_at || Date.now()).toLocaleTimeString('fr-FR'));
      showToast('Synchronisation réussie', 'success');
    } else {
      appendLog('sync-log', `✗ Erreur: ${data.error || 'Inconnue'}`, 'err');
      showToast(data.error || 'Erreur synchronisation', 'error');
    }

    setTimeout(() => hideProgress('sync-progress'), 2000);
  } catch (e) {
    appendLog('sync-log', 'Erreur réseau: ' + e.message, 'err');
    hideProgress('sync-progress');
    showToast('Erreur réseau lors de la synchro', 'error');
  }
}

// ─── CHARGER LOGS ─────────────────────────────────────────────────────────
async function loadLogs() {
  try {
    const level = document.getElementById('log-filter-level')?.value || '';
    const data  = await rApi({ action: 'logs', limit: 100, level });
    const tbody = document.getElementById('logs-tbody');
    if (!tbody) return;

    if (!data.logs?.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>Aucun journal</p></div></td></tr>`;
      return;
    }

    const colorMap = { ok: '#4ADE80', error: '#F87171', warn: '#FCD34D', info: '#60A5FA' };
    tbody.innerHTML = data.logs.map(l => `<tr>
      <td style="color:#94A3B8; font-size:0.78rem; font-family:monospace; white-space:nowrap;">${fmt(l.created_at)}</td>
      <td><span style="display:inline-flex; align-items:center; gap:5px; font-size:0.75rem; font-weight:700; padding:2px 10px; border-radius:20px; background:rgba(255,255,255,0.05); color:${colorMap[l.result] || '#94A3B8'};">${l.action_type || '—'}</span></td>
      <td style="color:#E2E8F0; font-size:0.82rem;">${l.action_name || '—'}</td>
      <td style="color:#94A3B8; font-size:0.78rem;">${l.details || '—'}</td>
      <td><span style="width:8px; height:8px; border-radius:50%; background:${colorMap[l.result] || '#64748B'}; display:inline-block;"></span></td>
    </tr>`).join('');
  } catch (e) {
    showToast('Erreur chargement journaux', 'error');
  }
}

function exportLogs() {
  window.open(ROUTER_API + '?action=logs&limit=200&format=csv', '_blank');
}

// ─── INIT ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadConfig();
  loadRouterStatus();

  // Tabs
  document.querySelectorAll('.rtab').forEach(btn => {
    btn.addEventListener('click', () => switchRTab(btn.dataset.rtab));
  });

  // Bouton sauvegarder
  document.getElementById('btn-save-config')?.addEventListener('click', saveConfig);

  // Test connexion
  document.getElementById('btn-test-connect')?.addEventListener('click', testConnection);

  // Détecter (topbar)
  document.getElementById('btn-detect-router')?.addEventListener('click', () => {
    switchRTab('detection');
    setTimeout(runDetection, 100);
  });

  // Synchroniser (topbar)
  document.getElementById('btn-sync-now')?.addEventListener('click', () => {
    switchRTab('sync');
    setTimeout(() => runSync('full'), 100);
  });

  // Détection tab
  document.getElementById('btn-run-detection')?.addEventListener('click', runDetection);

  // Appliquer API détectée
  document.getElementById('btn-apply-detected-api')?.addEventListener('click', () => {
    const api = window._detectedApi;
    if (!api) return;
    const portEl = document.getElementById('cfg-port');
    if (portEl) portEl.value = api.port;
    switchRTab('config');
    showToast('Configuration mise à jour avec le port détecté', 'success');
  });

  // Sync buttons
  document.getElementById('btn-sync-vouchers')?.addEventListener('click', () => runSync('push'));
  document.getElementById('btn-sync-users')?.addEventListener('click',    () => runSync('pull'));
  document.getElementById('btn-sync-full')?.addEventListener('click',     () => runSync('full'));

  // Save sync config
  document.getElementById('btn-save-sync-config')?.addEventListener('click', saveConfig);

  // Ressources refresh
  document.getElementById('btn-refresh-resources')?.addEventListener('click', () => {
    loadResources();
    showToast('Ressources actualisées', 'info');
  });

  // Info refresh (charger infos au clic sur "Détecter")
  document.getElementById('btn-detect-router')?.addEventListener('click', loadRouterInfo);

  // Logs
  document.getElementById('log-filter-level')?.addEventListener('change', loadLogs);
  document.getElementById('btn-clear-logs')?.addEventListener('click', async () => {
    if (!confirm('Effacer tous les journaux ?')) return;
    try {
      await rApiPost({ action: 'clear_logs' });
      loadLogs();
      showToast('Journaux effacés', 'success');
    } catch { showToast('Erreur', 'error'); }
  });
  document.getElementById('btn-export-logs')?.addEventListener('click', exportLogs);

  // Theme toggle
  const tt = document.getElementById('theme-toggle');
  if (tt) {
    tt.addEventListener('click', () => {
      const dark = document.documentElement.hasAttribute('data-theme');
      dark ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme','dark');
      localStorage.setItem('hotspot-theme', dark ? 'light' : 'dark');
    });
  }

  // Fermer modals
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.style.display = 'none'; });
  });

  // Auto-refresh ressources toutes les 30s si tab config ouvert
  setInterval(() => {
    if (document.getElementById('rtab-config')?.style.display !== 'none') {
      loadResources();
    }
  }, 30000);
});
