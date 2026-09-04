const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('active', t === tab));
    panels.forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tab.dataset.tab));
  });
});

/* ===== DARK MODE TOGGLE IN PARAMETRE ===== */
const darkBtn = document.getElementById('dark-mode-btn');
if (darkBtn) {
  darkBtn.addEventListener('click', () => {
    if (typeof toggleDarkMode === 'function') toggleDarkMode();
    updateParametreDarkUI();
  });
  updateParametreDarkUI();
}

function updateParametreDarkUI() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const label = document.getElementById('dark-mode-label');
  const desc = document.getElementById('dark-mode-desc');
  const icon = document.getElementById('dark-mode-icon');
  if (label) label.textContent = isDark ? 'Mode clair' : 'Mode sombre';
  if (desc) desc.textContent = isDark ? 'Passez à un thème clair pour un affichage classique.' : 'Passez à un thème sombre pour reposer vos yeux.';
  if (icon) {
    icon.innerHTML = isDark
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
  // Also sync guard.js UI
  if (typeof updateDarkToggleUI === 'function') updateDarkToggleUI();
}

function makeShow(box) {
  return (text, ok) => {
    // Utilise le toast global comme dans clients.php si dispo, sinon fallback
    const toast = document.getElementById('toast-container');
    const toastText = document.getElementById('toast-text');
    if (toast && toastText) {
      toastText.textContent = text;
      toast.className = 'toast-container ' + (ok ? 'toast-success' : 'toast-error');
      toast.style.display = 'flex';
      setTimeout(() => { toast.style.display = 'none'; }, 5000);
      if (box) { box.textContent = text; box.className = ok ? 'success-banner' : 'error-banner'; box.style.display = 'none'; }
      return;
    }
    box.textContent = text;
    box.classList.toggle('success-banner', ok);
    box.classList.toggle('error-banner', !ok);
    box.style.display = 'block';
  };
}

const showNom = makeShow(document.getElementById('message-nom'));
const showPass = makeShow(document.getElementById('message'));

// --- Profil : photo + nom de l'admin ---
let currentPhoto = null;
fetch('../login_php/admin_info.php')
  .then((r) => r.json())
  .then((data) => {
    const admin = data.admin || data;
    if (admin && admin.username) {
      document.getElementById('nom-admin').value = admin.username;
    }
    const photoUrl = admin.photo || data.photo || null;
    const preview = document.getElementById('photo-preview');
    const placeholder = document.getElementById('photo-placeholder');
    const removeBtn = document.getElementById('btn-remove-photo');
    if (photoUrl) {
      preview.src = photoUrl;
      preview.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      if (removeBtn) removeBtn.style.display = '';
      currentPhoto = photoUrl;
      notifyAvatar(photoUrl);
      // met à jour l'initiale du placeholder au cas où
      if (placeholder && admin.username) placeholder.textContent = admin.username.trim().charAt(0).toUpperCase();
    } else {
      if (admin.username && placeholder) placeholder.textContent = admin.username.trim().charAt(0).toUpperCase();
    }
  })
  .catch(() => {});

// Photo : choisir / prévisualiser / uploader
const photoInput = document.getElementById('photo-input');
const photoPreview = document.getElementById('photo-preview');
const photoPlaceholder = document.getElementById('photo-placeholder');
const btnChoose = document.getElementById('btn-choose-photo');
const btnUpload = document.getElementById('btn-upload-photo');
const btnRemove = document.getElementById('btn-remove-photo');
const msgPhoto = document.getElementById('message-photo');
let pendingFile = null;

// Met à jour l'avatar du header immédiatement + notifie guard.js
function notifyAvatar(photoUrl, fallbackInitial) {
  const av = document.getElementById('avatar-initial');
  if (av) {
    if (photoUrl) {
      av.innerHTML = '<img src="' + photoUrl + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
      av.style.padding = '0';
      av.style.overflow = 'hidden';
      av.setAttribute('data-photo', photoUrl);
    } else {
      av.removeAttribute('data-photo');
      av.innerHTML = '';
      const n = (document.getElementById('nom-admin')?.value || document.getElementById('profile-name')?.textContent || '').trim();
      av.textContent = (n.charAt(0) || fallbackInitial || 'N').toUpperCase();
      av.style.padding = '';
      av.style.background = '';
    }
  }
  window.dispatchEvent(new CustomEvent('hotspot:avatar-updated', { detail: { photo: photoUrl || null } }));
}

function showPhotoMsg(text, ok){
  if(!msgPhoto) return;
  msgPhoto.textContent = text;
  msgPhoto.style.display = 'block';
  msgPhoto.style.color = ok ? 'var(--success)' : 'var(--danger)';
  msgPhoto.style.background = ok ? 'rgba(63,163,77,0.08)' : 'rgba(196,67,43,0.08)';
  msgPhoto.style.border = '1px solid ' + (ok ? 'rgba(63,163,77,0.2)' : 'rgba(196,67,43,0.2)');
  msgPhoto.style.padding = '8px 10px';
  msgPhoto.style.borderRadius = '8px';
}

if(btnChoose && photoInput){
  btnChoose.addEventListener('click', ()=> photoInput.click());
  photoInput.addEventListener('change', ()=>{
    const file = photoInput.files[0];
    if(!file) return;
    if(file.size > 2*1024*1024){ showPhotoMsg('Fichier trop volumineux (2 Mo max)', false); return; }
    if(!file.type.match(/^image\/(jpeg|png|webp|gif)$/)){ showPhotoMsg('Format non supporté (jpg, png, webp, gif)', false); return; }
    pendingFile = file;
    const url = URL.createObjectURL(file);
    if (photoPreview.dataset.blob) URL.revokeObjectURL(photoPreview.dataset.blob);
    photoPreview.dataset.blob = url;
    photoPreview.src = url;
    photoPreview.style.display = 'block';
    if(photoPlaceholder) photoPlaceholder.style.display = 'none';
    btnUpload.style.display = '';
    if(msgPhoto) msgPhoto.style.display='none';
  });
}
if(btnUpload){
  btnUpload.addEventListener('click', async ()=>{
    if(!pendingFile) return;
    btnUpload.disabled = true; btnUpload.textContent = 'Envoi…';
    try{
      // récupère CSRF
      let csrf = '';
      try{ const r=await fetch('../login_php/check_session.php',{credentials:'same-origin'}); const d=await r.json(); csrf=d.csrf||''; }catch(e){}
      const fd = new FormData();
      fd.append('photo', pendingFile);
      const headers = {};
      if(csrf) headers['X-CSRF-Token'] = csrf;
      const resp = await fetch('../login_php/upload_photo.php', {method:'POST', headers, body: fd, credentials:'same-origin'});
      const data = await resp.json().catch(()=>({}));
      if(!resp.ok) throw new Error(data.error||'Échec envoi');
      showPhotoMsg(data.message||'Photo mise à jour', true);
      if (data.photo) {
        if (photoPreview.dataset.blob) { URL.revokeObjectURL(photoPreview.dataset.blob); photoPreview.removeAttribute('data-blob'); }
        photoPreview.src = data.photo;   // URL serveur (fiable) au lieu du blob
      }
      currentPhoto = data.photo || currentPhoto;
      pendingFile = null;
      btnUpload.style.display='none';
      if(btnRemove) btnRemove.style.display='';
      notifyAvatar(currentPhoto);        // affiche direct dans l'en-tête, sans refresh
    }catch(err){
      showPhotoMsg(err.message||'Erreur', false);
    }finally{
      btnUpload.disabled=false; btnUpload.textContent='Enregistrer';
    }
  });
}
if(btnRemove){
  btnRemove.addEventListener('click', async ()=>{
    if(!confirm('Retirer la photo de profil ?')) return;
    try{
      let csrf=''; try{ const r=await fetch('../login_php/check_session.php',{credentials:'same-origin'}); const d=await r.json(); csrf=d.csrf||''; }catch(e){}
      const resp = await fetch('../login_php/upload_photo.php', {method:'POST', headers: {'Content-Type':'application/json', ...(csrf?{'X-CSRF-Token':csrf}:{})}, body: JSON.stringify({action:'remove'}), credentials:'same-origin'});
      const data = await resp.json().catch(()=>({}));
      if(!resp.ok) throw new Error(data.error||'Échec');
      showPhotoMsg(data.message||'Photo retirée', true);
      photoPreview.style.display='none';
      if (photoPreview.dataset.blob) { URL.revokeObjectURL(photoPreview.dataset.blob); photoPreview.removeAttribute('data-blob'); }
      photoPreview.src='';
      if(photoPlaceholder){ photoPlaceholder.style.display='flex'; const nm=document.getElementById('nom-admin').value.trim(); if(nm) photoPlaceholder.textContent=nm.charAt(0).toUpperCase(); }
      btnRemove.style.display='none';
      if(pendingFile){ pendingFile=null; photoInput.value=''; }
      notifyAvatar(null);               // revient à l'initiale, sans refresh
    }catch(e){
      showPhotoMsg(e.message||'Erreur', false);
    }
  });
}

document.getElementById('form-nom').addEventListener('submit', async (e) => {
  e.preventDefault();
  showNom('', true);
  document.getElementById('message-nom').style.display = 'none';

  const btn = e.target.querySelector('.btn');
  const newUsername = document.getElementById('nom-admin').value.trim();
  btn.disabled = true;

  try {
    const response = await fetch('../login_php/modifier_nom.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_username: newUsername }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    showNom(data.message || "Nom de l'administrateur mis à jour.", true);
  } catch (err) {
    showNom(err.message || 'Modification impossible.', false);
  } finally {
    btn.disabled = false;
  }
});

// --- Securite : mot de passe ---
document.getElementById('form-password').addEventListener('submit', async (e) => {
  e.preventDefault();
  document.getElementById('message').style.display = 'none';

  const username = document.getElementById('username').value.trim();
  const currentPassword = document.getElementById('current').value;
  const newPassword = document.getElementById('new').value;
  const confirmPassword = document.getElementById('confirm').value;

  if (newPassword !== confirmPassword) {
    showPass('Les nouveaux mots de passe ne correspondent pas.', false);
    return;
  }

  const btn = e.target.querySelector('.btn');
  btn.disabled = true;

  try {
    const response = await fetch('../login_php/modifier_admin.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Erreur ${response.status}`);
    }

    showPass(data.message || 'Mot de passe mis à jour avec succès.', true);
    e.target.reset();
  } catch (err) {
    showPass(err.message || 'Modification impossible.', false);
  } finally {
    btn.disabled = false;
  }
});

// ===== GÉNÉRAL : hotspot + langue =====
const i18n = {
  fr: { profil:"Profil", securite:"Sécurité", apparence:"Apparence", general:"Général", comptes:"Comptes", save:"Enregistrer", hotspot:"Nom du hotspot", lang:"Langue", saved:"Paramètres enregistrés" },
  en: { profil:"Profile", securite:"Security", apparence:"Appearance", general:"General", comptes:"Accounts", save:"Save", hotspot:"Hotspot name", lang:"Language", saved:"Settings saved" },
  mg: { profil:"Mombamomba", securite:"Fiarovana", apparence:"Bika", general:"Ankapobeny", comptes:"Kaonty", save:"Tehirizo", hotspot:"Anaran'ny hotspot", lang:"Fiteny", saved:"Voatahiry" }
};
function applyLang(l){
  const t = i18n[l] || i18n.fr;
  document.querySelectorAll('.tab').forEach(el=>{
    const k = el.dataset.tab;
    if(t[k]) el.textContent = t[k];
  });
  const hs = document.querySelector('label[for="hotspot-nom"]'); if(hs) hs.textContent = t.hotspot;
  const ll = document.querySelector('label[for="systeme-langue"]'); if(ll) ll.textContent = t.lang;
  document.documentElement.lang = l;
  localStorage.setItem('hotspot-lang', l);
}
const savedLang = localStorage.getItem('hotspot-lang') || 'fr';
applyLang(savedLang);
const selLang = document.getElementById('systeme-langue');
if(selLang) {
  selLang.value = savedLang;
  selLang.addEventListener('change', e=>{
    const l = e.target.value;
    applyLang(l);
    window.dispatchEvent(new CustomEvent('hotspot:lang-changed', {detail:{lang:l}}));
    fetch('../login_php/settings.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({systeme_langue:l})}).catch(()=>{});
  });
}
// Charge depuis backend
fetch('../login_php/settings.php').then(r=>r.json()).then(d=>{
  const hn = document.getElementById('hotspot-nom');
  if(hn && d.hotspot_nom) hn.value = d.hotspot_nom;
  if(selLang && d.systeme_langue && d.systeme_langue!==selLang.value){ selLang.value = d.systeme_langue; applyLang(d.systeme_langue); window.dispatchEvent(new CustomEvent('hotspot:lang-changed', {detail:{lang:d.systeme_langue}})); }
}).catch(()=>{});
const formGeneral = document.getElementById('form-general');
if(formGeneral){
  formGeneral.addEventListener('submit', async e=>{
    e.preventDefault();
    const hn = document.getElementById('hotspot-nom').value.trim();
    const lang = document.getElementById('systeme-langue').value;
    const btn = formGeneral.querySelector('.btn');
    const msg = document.getElementById('message-general');
    btn.disabled = true;
    try{
      const r = await fetch('../login_php/settings.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({hotspot_nom: hn, systeme_langue: lang})});
      const d = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Erreur');
      applyLang(lang);
      window.dispatchEvent(new CustomEvent('hotspot:lang-changed', {detail:{lang}}));
      if(hn) localStorage.setItem('hotspot-nom', hn);
      const title = document.querySelector('.deuxieme .title');
      if(title && hn) title.childNodes[0].textContent = hn;
    }catch(err){
      msg.textContent = err.message; msg.className='error-banner'; msg.style.display='block';
    }finally{ btn.disabled=false; }
  });
}
const formCompteParam = document.getElementById('form-compte-param');
if(formCompteParam){
  formCompteParam.addEventListener('submit', async e=>{
    e.preventDefault();
    const username = document.getElementById('cp-username').value.trim();
    const email = document.getElementById('cp-email').value.trim();
    const profil = document.getElementById('cp-profil').value;
    const password = document.getElementById('cp-password').value;
    const msg = document.getElementById('message-comptes');
    const btn = formCompteParam.querySelector('.btn');
    if(!username || !email || !password){ msg.textContent='Tous les champs requis'; msg.className='error-banner'; msg.style.display='block'; return; }
    btn.disabled=true;
    try{
      const r = await fetch('../login_php/admins.php', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({action:'creer', username, password, role: profil, email})});
      const d = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.error||'Erreur');
      msg.textContent = d.message || 'Compte créé'; msg.className='success-banner'; msg.style.display='block';
      formCompteParam.reset();
    }catch(err){ msg.textContent = err.message; msg.className='error-banner'; msg.style.display='block'; }
    finally{ btn.disabled=false; }
  });
}
