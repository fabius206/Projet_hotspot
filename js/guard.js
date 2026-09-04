// ===== SPA NAVIGATION — sidebar reste fixe, seul le blanc change =====
const prefetchCache = new Map();
history.pushState(null, '', window.location.href);
window.addEventListener('popstate', () => {
  loadPageContent(window.location.href, false);
});

// ===== THEME : init fluide + persistance =====
(function initTheme(){
  try{
    const saved = localStorage.getItem('hotspot-theme');
    if(saved === 'dark') document.documentElement.setAttribute('data-theme','dark');
    else if(saved === 'light') document.documentElement.removeAttribute('data-theme');
    else if(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.setAttribute('data-theme','dark');
  }catch(e){}
  if(!window.__guard_init) window.__guard_init = true;
})();

// ===== LANGUE : init globale + persistance =====
const i18nGlobal = {
  fr: { dash:"Tableau de bord", clients:"Clients", codes:"Codes d'accès", vouchers:"Vouchers", sessions:"Sessions", routeur:"MikroTik", stats:"Statistiques", offres:"Offres", comptes:"Comptes", param:"Paramètre", logout:"Déconnexion", search:"Rechercher", tous:"Tous les statuts", actif:"Actif", suspendu:"Suspendu", affichage:"Affichage",
        gestionClients:"Gestion des clients", comptesHotspot:"Comptes utilisateurs du hotspot", nouveauClient:"Nouveau client", nomComplet:"Nom complet", email:"Email", telephone:"Téléphone", identifiant:"Identifiant", nom:"Nom", statut:"Statut", connexions:"Connexions", derniere:"Dernière connexion", actions:"Actions", creer:"Créer le client", totalClients:"Total clients", actifs:"Actifs", suspendus:"Suspendus", aujourdhui:"Aujourd'hui",
        offresTitle:"Offres", offresSub:"Les formules d'accès vendues sur le hotspot", ajouterOffre:"Ajouter une offre", definirDuree:"Définissez la durée et le prix du forfait", nomOffre:"Nom de l'offre", duree:"Durée (heures)", prix:"Prix (Ariary)", ajouterBtn:"Ajouter l'offre", listeOffres:"Liste des offres", forfaitsActifs:"Forfaits actifs sur le hotspot", thNom:"NOM", thDuree:"DURÉE", thPrix:"PRIX", thCodes:"CODES LIÉS", thVisib:"VISIBILITÉ", thActions:"ACTIONS",
        codesTitle:"Codes d'accès", codesSub:"Générer et gérer les vouchers WiFi", genererCodes:"Générer des codes", offre:"Offre", quantite:"Quantité", genererBtn:"Générer", codesListe:"Liste des codes", filtrerStatut:"Filtrer par statut", tousCodes:"Tous les codes", code:"Code", cree:"Créé le", utilise:"Utilisé le", expire:"Expire le", filtrer:"Filtrer", exporter:"Exporter en CSV",
        comptesTitle:"Comptes administrateurs", comptesSub:"Gérez les accès au back-office", creerCompte:"Créer un compte", identifiantEmail:"Identifiant / Email", motDePasse:"Mot de passe", role:"Rôle", admin:"Admin", superAdmin:"Super Admin", annuler:"Annuler", creerCompteBtn:"Créer le compte", listeAdmins:"Liste des administrateurs", adminsTotaux:"Admins totaux", superAdmins:"Super Admins", tousComptes:"Tous les comptes", accesComplet:"Accès complet",
        dashSub:"Vue d'ensemble de votre réseau Hotspot", clientsConnectes:"Clients connectés", sessionsActives:"Sessions actives", vouchersDispos:"Vouchers disponibles", vouchersExpires:"Vouchers expirés", traficReseau:"Trafic réseau", statutRouteur:"Statut du routeur MikroTik", sessionsRecentes:"Sessions récentes", voirTout:"Voir tout", aucunConnecte:"Aucun client connecté",
        paramGeneral:"Général", paramProfil:"Profil", paramSecurite:"Sécurité", paramApparence:"Apparence", paramComptes:"Comptes", hotspotNom:"Nom du hotspot", langue:"Langue", enregistrer:"Enregistrer", gererPhoto:"Gérez votre photo et votre nom d'affichage", photoProfil:"Photo de profil", choisirPhoto:"Choisir une photo", retirer:"Retirer", nomAdmin:"Nom de l'administrateur", securiteDesc:"Modifiez le mot de passe de connexion au back-office" },
  en: { dash:"Dashboard", clients:"Clients", codes:"Access codes", vouchers:"Vouchers", sessions:"Sessions", routeur:"MikroTik", stats:"Statistics", offres:"Offers", comptes:"Accounts", param:"Settings", logout:"Logout", search:"Search", tous:"All statuses", actif:"Active", suspendu:"Suspended", affichage:"Display",
        gestionClients:"Client management", comptesHotspot:"Hotspot user accounts", nouveauClient:"New client", nomComplet:"Full name", email:"Email", telephone:"Phone", identifiant:"ID", nom:"Name", statut:"Status", connexions:"Connections", derniere:"Last connection", actions:"Actions", creer:"Create client", totalClients:"Total clients", actifs:"Active", suspendus:"Suspended", aujourdhui:"Today",
        offresTitle:"Offers", offresSub:"Access formulas sold on hotspot", ajouterOffre:"Add an offer", definirDuree:"Define duration and price", nomOffre:"Offer name", duree:"Duration (hours)", prix:"Price (MGA)", ajouterBtn:"Add offer", listeOffres:"Offer list", forfaitsActifs:"Active plans on hotspot", thNom:"NAME", thDuree:"DURATION", thPrix:"PRICE", thCodes:"LINKED CODES", thVisib:"VISIBILITY", thActions:"ACTIONS",
        codesTitle:"Access codes", codesSub:"Generate and manage WiFi vouchers", genererCodes:"Generate codes", offre:"Offer", quantite:"Quantity", genererBtn:"Generate", codesListe:"Code list", filtrerStatut:"Filter by status", tousCodes:"All codes", code:"Code", cree:"Created", utilise:"Used", expire:"Expires", filtrer:"Filter", exporter:"Export CSV",
        comptesTitle:"Administrator accounts", comptesSub:"Manage back-office access", creerCompte:"Create account", identifiantEmail:"Username / Email", motDePasse:"Password", role:"Role", admin:"Admin", superAdmin:"Super Admin", annuler:"Cancel", creerCompteBtn:"Create account", listeAdmins:"Administrator list", adminsTotaux:"Total admins", superAdmins:"Super Admins", tousComptes:"All accounts", accesComplet:"Full access",
        dashSub:"Overview of your Hotspot network", clientsConnectes:"Connected clients", sessionsActives:"Active sessions", vouchersDispos:"Available vouchers", vouchersExpires:"Expired vouchers", traficReseau:"Network traffic", statutRouteur:"MikroTik router status", sessionsRecentes:"Recent sessions", voirTout:"View all", aucunConnecte:"No client connected",
        paramGeneral:"General", paramProfil:"Profile", paramSecurite:"Security", paramApparence:"Appearance", paramComptes:"Accounts", hotspotNom:"Hotspot name", langue:"Language", enregistrer:"Save", gererPhoto:"Manage your photo and display name", photoProfil:"Profile photo", choisirPhoto:"Choose photo", retirer:"Remove", nomAdmin:"Administrator name", securiteDesc:"Change your back-office password" },
  mg: { dash:"Takelaka", clients:"Mpanjifa", codes:"Kaody", vouchers:"Vouchers", sessions:"Fivoriana", routeur:"MikroTik", stats:"Antontan'isa", offres:"Tolotra", comptes:"Kaonty", param:"Fikirana", logout:"Hiala", search:"Hitady", tous:"Sata rehetra", actif:"Mavitrika", suspendu:"Atsahatra", affichage:"Fampisehoana",
        gestionClients:"Fitantanana mpanjifa", comptesHotspot:"Kaonty mpampiasa hotspot", nouveauClient:"Mpanjifa vaovao", nomComplet:"Anarana feno", email:"E-mail", telephone:"Telefaonina", identifiant:"ID", nom:"Anarana", statut:"Sata", connexions:"Fifandraisana", derniere:"Fifandraisana farany", actions:"Hetsika", creer:"Mamorona mpanjifa", totalClients:"Mpanjifa rehetra", actifs:"Mavitrika", suspendus:"Atsahatra", aujourdhui:"Androany",
        offresTitle:"Tolotra", offresSub:"Rafitra fidirana amidy", ajouterOffre:"Manampy tolotra", definirDuree:"Farito ny faharetana sy ny vidiny", nomOffre:"Anaran'ny tolotra", duree:"Faharetana (ora)", prix:"Vidiny (Ar)", ajouterBtn:"Manampy tolotra", listeOffres:"Lisitry ny tolotra", forfaitsActifs:"Tolotra mavitrika", thNom:"ANARANA", thDuree:"FAHARETANA", thPrix:"VIDINY", thCodes:"KAODY MIARAKA", thVisib:"FAHITANA", thActions:"HETSIKA",
        codesTitle:"Kaody", codesSub:"Mamorona sy mitantana voucher WiFi", genererCodes:"Mamorona kaody", offre:"Tolotra", quantite:"Hatrany", genererBtn:"Mamorona", codesListe:"Lisitry ny kaody", filtrerStatut:"Sivana araka sata", tousCodes:"Kaody rehetra", code:"Kaody", cree:"Noforonina", utilise:"Nampiasaina", expire:"Lany", filtrer:"Sivana", exporter:"Export CSV",
        comptesTitle:"Kaonty mpitantana", comptesSub:"Tantano ny fidirana", creerCompte:"Mamorona kaonty", identifiantEmail:"Anarana / E-mail", motDePasse:"Tenimiafina", role:"Anjara", admin:"Mpandrindra", superAdmin:"Mpandrindra ambony", annuler:"Hanafoana", creerCompteBtn:"Mamorona kaonty", listeAdmins:"Lisitry ny mpitantana", adminsTotaux:"Kaonty rehetra", superAdmins:"Mpandrindra ambony", tousComptes:"Kaonty rehetra", accesComplet:"Fidirana feno",
        dashSub:"Topimaso ny tambajotra Hotspot", clientsConnectes:"Mpanjifa mifandray", sessionsActives:"Fivoriana mavitrika", vouchersDispos:"Voucher misy", vouchersExpires:"Voucher lany daty", traficReseau:"Fifamoivoizana", statutRouteur:"Satan'ny router MikroTik", sessionsRecentes:"Fivoriana farany", voirTout:"Hijery rehetra", aucunConnecte:"Tsy misy mpanjifa mifandray",
        paramGeneral:"Ankapobeny", paramProfil:"Mombamomba", paramSecurite:"Fiarovana", paramApparence:"Bika", paramComptes:"Kaonty", hotspotNom:"Anaran'ny hotspot", langue:"Fiteny", enregistrer:"Tehirizo", gererPhoto:"Tantano ny sarinao", photoProfil:"Sarin'ny mombamomba", choisirPhoto:"Misafidy sary", retirer:"Esory", nomAdmin:"Anaran'ny mpitantana", securiteDesc:"Ovay ny tenimiafina" }
};
function applyGlobalLang(l){
  const t = i18nGlobal[l] || i18nGlobal.fr;
  document.documentElement.lang = l;
  // Sidebar — traduction par href (fiable, sans dépendance de position)
  const nav = document.querySelector('.deuxieme nav');
  if(nav){
    const hrefMap = {
      'dash.php': t.dash,
      'clients.php': t.clients,
      'vouchers.php': t.vouchers,
      'codes.php': t.codes || t.vouchers,
      'sessions.php': t.sessions,
      'offres.php': t.offres,
      'stats.php': t.stats,
      'routeur.php': t.routeur,
      'comptes.php': t.comptes,
      'parametre.php': t.param,
      'logout.php': t.logout,
    };
    nav.querySelectorAll('a').forEach(a=>{
      const href = (a.getAttribute('href') || '').toLowerCase();
      const matchedKey = Object.keys(hrefMap).find(key => href.includes(key));
      if(!matchedKey || !hrefMap[matchedKey]) return;
      const textNode = Array.from(a.childNodes).find(n=> n.nodeType===3 && n.textContent.trim().length>0);
      if(textNode) textNode.textContent = ' ' + hrefMap[matchedKey];
      else a.appendChild(document.createTextNode(' ' + hrefMap[matchedKey]));
    });
  }
  // Search placeholder & statuts
  const search = document.getElementById('search-clients');
  if(search) search.placeholder = t.search + ' par nom...';
  const selStatut = document.getElementById('filter-statut');
  if(selStatut && selStatut.options.length>=1){
    if(selStatut.options[0]) selStatut.options[0].textContent = t.tous;
    if(selStatut.options[1]) selStatut.options[1].textContent = t.actif;
    if(selStatut.options[2]) selStatut.options[2].textContent = t.suspendu;
  }
  // Marque + Affichage — Hotspot Diego reste la marque, Affichage se traduit
  const brand = document.querySelector('.deuxieme .title');
  if(brand){
    // Si un nom custom est stocké, l'afficher, sinon garder Hotspot Diego
    const custom = localStorage.getItem('hotspot-nom');
    if(custom && brand.childNodes[0]) brand.childNodes[0].textContent = custom;
  }
  const smallAff = document.querySelector('.deuxieme .title small');
  if(smallAff) smallAff.textContent = t.affichage;
  // Topbar titles
  const h1 = document.querySelector('.topbar h1, .dash-topbar h1');
  if(h1){
    if(h1.textContent.includes('Gestion des clients') || h1.textContent.includes('Client management') || h1.textContent.includes('Fitantanana')) h1.textContent = t.gestionClients;
    else if(h1.textContent.includes('Offres') || h1.textContent.includes('Offers') || h1.textContent.includes('Tolotra')) h1.textContent = t.offresTitle;
    else if(h1.textContent.includes("Codes d'accès") || h1.textContent.includes('Access codes') || h1.textContent.includes('Kaody')) h1.textContent = t.codesTitle;
    else if(h1.textContent.includes('Comptes') || h1.textContent.includes('Administrator') || h1.textContent.includes('Kaonty mpitantana')) h1.textContent = t.comptesTitle;
    else if(h1.textContent.includes('Tableau')) h1.textContent = t.dash;
    else if(h1.textContent.includes('Paramètres') || h1.textContent.includes('Settings') || h1.textContent.includes('Fikirana')) h1.textContent = t.param;
  }
  const sub = document.querySelector('.topbar .subtitle');
  if(sub){
    if(sub.textContent.includes('Comptes utilisateurs')) sub.textContent = t.comptesHotspot;
    else if(sub.textContent.includes("formules d'accès") || sub.textContent.includes('Access formulas')) sub.textContent = t.offresSub;
    else if(sub.textContent.includes('Générer et gérer')) sub.textContent = t.codesSub;
    else if(sub.textContent.includes("Gérez les accès")) sub.textContent = t.comptesSub;
    else if(sub.textContent.includes("Vue d'ensemble")) sub.textContent = t.dashSub;
  }
  // Clients form & table
  const titreForm = document.getElementById('titre-form');
  if(titreForm){
    if(titreForm.textContent.includes('Nouveau') || titreForm.textContent.includes('New') || titreForm.textContent.includes('vaovao')) titreForm.lastChild.textContent = ' ' + t.nouveauClient;
    else if(titreForm.textContent.includes('Créer un compte') || titreForm.textContent.includes('Create account') || titreForm.textContent.includes('Mamorona kaonty')) titreForm.textContent = t.creerCompte;
  }
  const labNom = document.querySelector('label[for="cl-nom"]'); if(labNom) labNom.childNodes[0].textContent = t.nomComplet + ' ';
  const labEmail = document.querySelector('label[for="cl-email"]'); if(labEmail) labEmail.textContent = t.email;
  const labTel = document.querySelector('label[for="cl-tel"]'); if(labTel) labTel.textContent = t.telephone;
  const ths = document.querySelectorAll('#table-clients thead th');
  const thMap = [t.identifiant, t.nom, t.email, t.telephone, t.statut, t.connexions, t.derniere, t.actions];
  ths.forEach((th,i)=>{ if(thMap[i]) th.textContent = thMap[i]; });
  const btnSubmit = document.getElementById('btn-submit');
  if(btnSubmit){
    if(btnSubmit.textContent.includes('Créer le client') || btnSubmit.textContent.includes('Create client') || btnSubmit.textContent.includes('Mamorona mpanjifa')) btnSubmit.textContent = t.creer;
    else if(btnSubmit.textContent.includes('Créer le compte') || btnSubmit.textContent.includes('Create account') || btnSubmit.textContent.includes('Mamorona kaonty')) btnSubmit.textContent = t.creerCompteBtn;
  }
  // Offres
  const labNomOffre = document.querySelector('label[for="plan-nom"]'); if(labNomOffre) labNomOffre.textContent = t.nomOffre;
  const labDuree = document.querySelector('label[for="plan-duree"]'); if(labDuree) labDuree.textContent = t.duree;
  const labPrix = document.querySelector('label[for="plan-prix"]'); if(labPrix) labPrix.textContent = t.prix;
  const btnPlan = document.getElementById('btn-plan');
  if(btnPlan) btnPlan.textContent = t.ajouterBtn;
  const listeTitle = document.querySelector('#table-plans')?.closest('.card')?.querySelector('h3');
  if(listeTitle && (listeTitle.textContent.includes('Liste') || listeTitle.textContent.includes('Offer list') || listeTitle.textContent.includes('Lisitry'))) listeTitle.lastChild.textContent = ' ' + t.listeOffres;
  const forfaits = document.querySelector('#table-plans')?.closest('.card')?.querySelector('span');
  if(forfaits && forfaits.textContent.includes('Forfaits')) forfaits.textContent = t.forfaitsActifs;
  const thPlans = document.querySelectorAll('#table-plans thead th');
  const thPlanMap = [t.thNom, t.thDuree, t.thPrix, t.thCodes, t.thVisib, t.thActions];
  thPlans.forEach((th,i)=>{ if(thPlanMap[i]) th.textContent = thPlanMap[i]; });
  // Codes - supplémentaires
  const genererH3 = document.querySelector('#form-generer')?.closest('.card')?.querySelector('h3');
  if(genererH3 && genererH3.textContent.includes('Générer')) genererH3.textContent = t.genererCodes;
  const labOffre = document.querySelector('label[for="plan-select"], label[for="offre"]'); if(labOffre && labOffre.textContent.includes('Offre')) labOffre.textContent = t.offre;
  const labQuant = document.querySelector('label[for="quantite"]'); if(labQuant) labQuant.textContent = t.quantite;
  const btnGenerer = document.querySelector('#form-generer button[type="submit"]'); if(btnGenerer && btnGenerer.textContent.includes('Générer')) btnGenerer.textContent = t.genererBtn;
  const thCodes = document.querySelectorAll('#table-codes thead th');
  const thCodesMap = [t.code, t.offre, t.prix, t.statut, t.cree, t.utilise, t.expire, t.actions];
  thCodes.forEach((th,i)=>{ if(thCodesMap[i]) th.textContent = thCodesMap[i]; });
  const exporterBtn = document.querySelector('a[href*="export"]'); if(exporterBtn && exporterBtn.textContent.includes('Exporter')) exporterBtn.textContent = t.exporter;
  // Comptes
  const labUser = document.querySelector('label[for="c-username"]'); if(labUser) labUser.textContent = t.identifiantEmail;
  const labPass = document.querySelector('label[for="c-password"]'); if(labPass) labPass.textContent = t.motDePasse;
  const labRole = document.querySelector('label[for="c-role"]'); if(labRole) labRole.textContent = t.role;
  const thComptes = document.querySelectorAll('#table-comptes thead th');
  const thCompteMap = [t.identifiant, t.role, 'Créé le', t.actions];
  thComptes.forEach((th,i)=>{ if(thCompteMap[i]) th.textContent = thCompteMap[i]; });
  document.querySelectorAll('#table-comptes thead th').forEach(th=>{ if(th.textContent.includes('Créé')) th.textContent = th.textContent; });
  // Dash
  const dashLabels = document.querySelectorAll('.dash-card .label, .stat-card .label');
  dashLabels.forEach(l=>{
    const txt = l.textContent.trim();
    if(txt.includes('Clients connectés') || txt.includes('Connected clients') || txt.includes('Mpanjifa mifandray')) l.textContent = t.clientsConnectes;
    else if(txt.includes('Sessions actives') || txt.includes('Active sessions') || txt.includes('Fivoriana mavitrika')) l.textContent = t.sessionsActives;
    else if(txt.includes('Vouchers disponibles') || txt.includes('Available vouchers') || txt.includes('Voucher misy')) l.textContent = t.vouchersDispos;
    else if(txt.includes('Vouchers expirés') || txt.includes('Expired vouchers') || txt.includes('Voucher lany')) l.textContent = t.vouchersExpires;
    else if(txt.includes('Total clients') || txt.includes('Total clients')) l.textContent = t.totalClients;
    else if(txt === 'Actifs' || txt === 'Active' || txt === 'Mavitrika') l.textContent = t.actifs;
    else if(txt.includes('Suspendus') || txt.includes('Suspended') || txt.includes('Atsahatra')) l.textContent = t.suspendus;
    else if(txt.includes("Aujourd'hui") || txt.includes('Today') || txt.includes('Androany')) l.textContent = t.aujourdhui;
    else if(txt.includes('Revenus du jour')) l.textContent = txt; // keep
  });
  // Dash panels
  document.querySelectorAll('.dash-panel h3, .card h3').forEach(h=>{
    if(h.textContent.includes('Trafic réseau') || h.textContent.includes('Network traffic') || h.textContent.includes('Fifamoivoizana')) h.textContent = t.traficReseau;
    else if(h.textContent.includes('Statut du routeur')) h.textContent = t.statutRouteur;
    else if(h.textContent.includes('Sessions récentes') || h.textContent.includes('Recent sessions') || h.textContent.includes('Fivoriana farany')) h.textContent = t.sessionsRecentes;
  });
  const voirTout = document.querySelector('a.btn-sm');
  if(voirTout && voirTout.textContent.includes('Voir tout')) voirTout.textContent = t.voirTout;
  const aucun = document.getElementById('sessions-empty');
  if(aucun && aucun.textContent.includes('Aucun')) aucun.textContent = t.aucunConnecte;
  // Parametre
  document.querySelectorAll('.tab').forEach(el=>{
    const k = el.dataset.tab;
    if(k==='general' && t.paramGeneral) el.textContent = t.paramGeneral;
    else if(k==='profil' && t.paramProfil) el.textContent = t.paramProfil;
    else if(k==='securite' && t.paramSecurite) el.textContent = t.paramSecurite;
    else if(k==='apparence' && t.paramApparence) el.textContent = t.paramApparence;
    else if(k==='comptes' && t.paramComptes) el.textContent = t.paramComptes;
  });
  const hsLabel = document.querySelector('label[for="hotspot-nom"]'); if(hsLabel) hsLabel.textContent = t.hotspotNom;
  const langLabel = document.querySelector('label[for="systeme-langue"]'); if(langLabel) langLabel.textContent = t.langue;
  // Annuler boutons
  document.querySelectorAll('#btn-cancel, #btn-annuler, .btn-outline').forEach(b=>{ if(b.textContent.trim() === 'Annuler' || b.textContent.trim() === 'Cancel' || b.textContent.trim() === 'Hanafoana') b.textContent = t.annuler; });
  localStorage.setItem('hotspot-lang', l);
}
(function initLang(){
  try{
    const saved = localStorage.getItem('hotspot-lang') || 'fr';
    applyGlobalLang(saved);
    // Charge depuis backend si dispo (écrase local)
    fetch('../login_php/settings.php', {credentials:'same-origin'}).then(r=>r.json()).then(d=>{
      if(d.hotspot_nom){
        localStorage.setItem('hotspot-nom', d.hotspot_nom);
        const brand = document.querySelector('.deuxieme .title');
        if(brand && brand.childNodes[0]) brand.childNodes[0].textContent = d.hotspot_nom;
      }
      if(d.systeme_langue && ['fr','en','mg'].includes(d.systeme_langue) && d.systeme_langue!==saved){
        applyGlobalLang(d.systeme_langue);
      }
    }).catch(()=>{});
  }catch(e){}
})();
window.addEventListener('hotspot:lang-changed', e=> applyGlobalLang(e.detail?.lang || 'fr'));

function toggleDarkMode() { toggleTheme(); }
function toggleTheme(){
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if(isDark){
    document.documentElement.removeAttribute('data-theme');
    try{ localStorage.setItem('hotspot-theme','light'); }catch(e){}
  } else {
    document.documentElement.setAttribute('data-theme','dark');
    try{ localStorage.setItem('hotspot-theme','dark'); }catch(e){}
  }
  updateDarkToggleUI();
  updateThemedImages();
  // notifier les graphiques
  try{ if(typeof chartColors === 'function' && window.barChart) { /* charts will update on next refresh */ } }catch(e){}
}

function updateThemedImages(){
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('img[data-light-src]').forEach(img=>{
    const target = isDark ? img.dataset.darkSrc : img.dataset.lightSrc;
    if(target && img.getAttribute('src') !== target) img.src = target;
  });
}
function updateDarkToggleUI() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const iconEl = document.getElementById('dark-mode-icon');
  const textEl = document.getElementById('dark-mode-text');
  const trackEl = document.getElementById('dark-mode-track');
  const knobEl = document.getElementById('dark-mode-knob');
  if (iconEl) {
    iconEl.innerHTML = isDark
      ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
      : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
  if (textEl) textEl.textContent = isDark ? 'Mode clair' : 'Mode sombre';
  if (knobEl) knobEl.textContent = isDark ? '\u2600' : '\u263E';
  if (trackEl) trackEl.style.background = isDark ? 'var(--lagoon)' : 'rgba(255,255,255,0.15)';
  document.querySelectorAll('#theme-toggle').forEach(b=>{
    b.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
    b.setAttribute('title', isDark ? 'Mode clair' : 'Mode sombre');
  });
  updateThemedImages();
}
document.addEventListener('DOMContentLoaded', ()=>{ updateDarkToggleUI(); updateThemedImages(); });
document.addEventListener('click', (e)=>{
  const t = e.target.closest('#theme-toggle');
  if(t){ e.preventDefault(); toggleTheme(); }
});

// ===== CSRF helper — attache le token à tous les POST/PUT/DELETE =====
let csrfToken = '';
function setCsrf(t) { if (t) csrfToken = t; }
(function patchFetch(){
  const origFetch = window.fetch;
  window.fetch = function(url, opts){
    opts = opts || {};
    const method = (opts.method || 'GET').toUpperCase();
    if (['POST','PUT','PATCH','DELETE'].includes(method) && csrfToken) {
      opts.headers = opts.headers || {};
      // headers peut être un objet ou un Headers
      if (opts.headers instanceof Headers) {
        opts.headers.set('X-CSRF-Token', csrfToken);
      } else if (typeof opts.headers === 'object') {
        opts.headers['X-CSRF-Token'] = csrfToken;
      }
      // Si body JSON, injecte aussi _csrf
      if (opts.body && typeof opts.body === 'string') {
        try {
          const j = JSON.parse(opts.body);
          if (j && typeof j === 'object' && !j._csrf) {
            j._csrf = csrfToken;
            opts.body = JSON.stringify(j);
          }
        } catch(e){}
      }
    }
    // Toujours same-origin pour les cookies de session
    if (!opts.credentials) opts.credentials = 'same-origin';
    return origFetch.call(this, url, opts).then(r => {
      if (r.status === 401) {
        // Session expirée
        const ct = r.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          window.location.replace('../index.php');
        }
      }
      return r;
    });
  };
})();

// ===== SESSION CHECK =====
fetch('../login_php/check_session.php', { credentials: 'same-origin' })
  .then((r) => r.json())
  .then((data) => {
    if (!data.authenticated) {
      window.location.replace('../index.php');
      return;
    }
    if (data.csrf) setCsrf(data.csrf);

    // Header profil (maquette 2) — remplit le topbar si présent
    (function(){
      const hpName = document.getElementById('profile-name');
      const hpEmail = document.getElementById('profile-email');
      const hpAvatar = document.getElementById('avatar-initial');
      if(hpName){
        const rawName = data.username || '';
        // Essaie de récupérer l'email via admin_info si dispo
        hpName.textContent = rawName;
        if(hpAvatar) hpAvatar.textContent = (rawName.trim().charAt(0) || 'N').toUpperCase();
        // fetch email en plus
        fetch('../login_php/admin_info.php', {credentials:'same-origin'}).then(r=>r.json()).then(info=>{
          const adm = info.admin || info;
          if(adm && adm.photo && hpAvatar){
            hpAvatar.innerHTML = '<img src="'+adm.photo+'" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            hpAvatar.style.padding='0'; hpAvatar.style.overflow='hidden';
          } else if(hpAvatar && hpName.textContent){
            hpAvatar.textContent = hpName.textContent.trim().charAt(0).toUpperCase();
          }
          if(adm && adm.email && hpEmail) hpEmail.textContent = adm.email;
          else if(adm && adm.username && hpEmail) hpEmail.textContent = adm.username.includes('@') ? adm.username : '';
          else if(info && info.email && hpEmail) hpEmail.textContent = info.email;
          if(adm && adm.username) hpName.textContent = adm.username;
          else if(info && info.nom_complet) hpName.textContent = info.nom_complet;
        }).catch(()=>{
          if(hpEmail) hpEmail.textContent = rawName.includes('@') ? rawName : '';
        });
      }
    })();

    // Sidebar badge retiré sur demande — infos utilisateur affichées uniquement dans le header
    // badge sidebar supprimé — pas d'insertion

    // Filtrage navigation selon rôle
    const role = data.role || '';
    if (role === 'utilisateur') {
      document.querySelectorAll('[data-role="admin"]').forEach(el => el.style.display = 'none');
      const adminCards = document.querySelectorAll('.admin-only');
      adminCards.forEach(c => {
        c.innerHTML = '<p style="padding:20px;text-align:center;color:var(--ink-soft);">Accès réservé aux administrateurs.</p>';
      });
    }

    // Inactivité : session persistante (30 jours via cookie), pas de popup
  })
  .catch(() => window.location.replace('../index.php'));

// Force l'arrangement correct sans refresh (Chart.js + grilles)
window.addEventListener('load', () => {
  setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
  setTimeout(() => window.dispatchEvent(new Event('resize')), 400);
});

// ===== SPA NAVIGATION — sidebar fixe, contenu fluide =====
let isNavigating = false;

function updateSidebarActive(url) {
  const sidebar = document.querySelector('.deuxieme');
  if (!sidebar) return;
  const fileName = url.split('/').pop().split('?')[0];
  sidebar.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const hrefFile = href.split('/').pop().split('?')[0];
    if (hrefFile === fileName) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

function loadPageContent(url, pushState) {
  if (isNavigating) return;
  if (url === window.location.href && pushState) return;
  isNavigating = true;

  const main = document.querySelector('.main');
  if (!main) { window.location.href = url; return; }

  // Transition ultra-fluide : fetch et animation en parallèle
  main.style.willChange = 'opacity, transform';
  main.style.opacity = '0';
  main.style.transform = 'translateY(8px)';
  main.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  const cached = prefetchCache.get(url);
  const htmlPromise = cached ? Promise.resolve(cached) : fetch(url, { credentials: 'same-origin' }).then(r => { if (!r.ok) throw new Error('Nav error'); return r.text(); });
  const fadePromise = new Promise(r=> setTimeout(r, 190));
  Promise.all([htmlPromise, fadePromise]).then(([html]) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newMain = doc.querySelector('.main');
        const newSidebar = doc.querySelector('.deuxieme');

        if (!newMain) { window.location.href = url; return; }

        // Injecter le contenu du main
        main.innerHTML = newMain.innerHTML;

        // Mettre à jour le title
        const newTitle = doc.querySelector('title');
        if (newTitle) document.title = newTitle.textContent;

        // Update URL
        if (pushState) {
          history.pushState(null, '', url);
        }

        // Update sidebar active
        updateSidebarActive(url);

        // Charger les scripts séquentiellement (ordre important : Chart.js avant dashboard.js)
        const scripts = Array.from(newMain.querySelectorAll('script'));
        let chain = Promise.resolve();
        scripts.forEach(oldScript => {
          // guard.js est déjà actif dans le document courant : le réinjecter
          // provoquerait des redéclarations et casserait la navigation SPA.
          if (oldScript.src && oldScript.src.includes('/js/guard.js')) return;
          chain = chain.then(() => new Promise(resolve => {
            const s = document.createElement('script');
            if (oldScript.src) {
              s.src = oldScript.src.startsWith('http') ? oldScript.src : oldScript.getAttribute('src');
              s.onload = resolve; s.onerror = resolve;
            } else {
              s.textContent = oldScript.textContent;
              // inline s'exécute immédiatement
              setTimeout(resolve, 0);
            }
            document.body.appendChild(s);
            if (!oldScript.src) resolve();
          }));
        });
        chain.then(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          requestAnimationFrame(() => {
            main.style.opacity = '1';
            main.style.transform = 'translateY(0)';
            main.style.filter = '';
            isNavigating = false;
            // Force Chart.js à prendre sa place sans refresh manuel
            setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
          });
        });
      }).catch(() => {
        window.location.href = url;
      });
}

// Navigation classique (SPA désactivée) pour garantir l'arrangement sans refresh
// L'ancienne SPA causait des pages mal arrangées jusqu'au refresh (Chart.js + let redeclaration)
// On laisse le navigateur faire un vrai chargement — fluide via CSS page-in
document.addEventListener('click', (e) => {
  const link = e.target.closest('.deuxieme nav a');
  if (!link) return;
  const href = link.href;
  if (!href || link.target === '_blank' || href.includes('/logout.php')) return;
  e.preventDefault();
  loadPageContent(href, true);
});
// Prefetch désactivé

// ===== SWITCH ACCOUNT =====
async function loadSwitchList() {
  const list = document.getElementById('switch-list');
  if (!list) return;
  list.innerHTML = '<div style="padding:12px;text-align:center;color:var(--ink-soft);font-size:0.8rem;">Chargement...</div>';
  try {
    const r = await fetch('../login_php/switch_account.php');
    const d = await r.json();
    if (!d.accounts || d.accounts.length === 0) {
      list.innerHTML = '<div style="padding:12px;text-align:center;color:var(--ink-soft);">Aucun compte</div>';
      return;
    }
    list.innerHTML = d.accounts.map(a => {
      const isCurrent = a.is_current;
      const badgeClass = a.role === 'super_admin' ? 'badge-super_admin' : 'badge-admin';
      return '<div class="switch-item' + (isCurrent ? ' switch-current' : '') + '" data-id="' + a.id + '">' +
        '<div><span style="font-weight:600;color:var(--ink);">' + escHtml(a.username) + '</span>' +
        (isCurrent ? ' <span style="font-size:0.68rem;color:var(--lagoon);">(actuel)</span>' : '') +
        '<br><span class="badge ' + badgeClass + '" style="font-size:0.62rem;padding:1px 6px;">' + a.role + '</span></div>' +
        (isCurrent ? '' : '<button class="btn btn-sm btn-outline switch-btn" data-id="' + a.id + '">Basculer</button>') +
        '</div>';
    }).join('');

    list.querySelectorAll('.switch-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        btn.disabled = true;
        btn.textContent = '...';
        try {
          const r = await fetch('../login_php/switch_account.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          });
          const d = await r.json().catch(() => ({}));
          if (r.ok && d.success) {
            window.location.reload();
          } else {
            window.showToast(d.error || 'Erreur lors du changement', 'error');
            btn.disabled = false;
            btn.textContent = 'Basculer';
          }
        } catch (err) {
          window.showToast('Erreur réseau', 'error');
          btn.disabled = false;
          btn.textContent = 'Basculer';
        }
      });
    });
  } catch (e) {
    list.innerHTML = '<div style="padding:12px;text-align:center;color:var(--danger);">Erreur de chargement</div>';
  }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== AVATAR LIVE : mis à jour sans refresh (evt envoyé par parametre.js) =====
window.addEventListener('hotspot:avatar-updated', (e) => {
  const url = e.detail && e.detail.photo;
  const av = document.getElementById('avatar-initial');
  if (!av) return;
  if (url) {
    av.innerHTML = '<img src="' + url + '" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
    av.style.padding = '0';
    av.style.overflow = 'hidden';
    av.setAttribute('data-photo', url);
  } else {
    av.removeAttribute('data-photo');
    av.innerHTML = '';
    const name = document.getElementById('profile-name');
    av.textContent = ((name && name.textContent.trim()) || '').charAt(0).toUpperCase() || 'N';
    av.style.padding = '';
    av.style.background = '';
  }
});

// ===== MESSAGE BOX TOAST UNIFIÉ GLOBALE (Style Offre) =====
window.showToast = function(text, ok = true) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('role', 'status');
    container.innerHTML = '<span id="toast-text"></span>';
    document.body.appendChild(container);
  }
  let textEl = container.querySelector('#toast-text');
  if (!textEl) {
    textEl = document.createElement('span');
    textEl.id = 'toast-text';
    container.appendChild(textEl);
  }
  textEl.textContent = text;
  const isErr = (ok === false || ok === 'error');
  const isWarn = (ok === 'warn');
  const isInfo = (ok === 'info');
  const cls = isErr ? 'toast-error' : (isWarn ? 'toast-warn' : (isInfo ? 'toast-info' : 'toast-success'));
  container.className = 'toast-container ' + cls;
  container.style.display = 'flex';
  clearTimeout(container._toastTimer);
  container._toastTimer = setTimeout(() => {
    container.style.display = 'none';
  }, 4500);
};
window.showMessage = window.showToast;

window.showConfirm = function(text, options = {}) {
  const title = options.title || 'Confirmer l’action';
  const confirmLabel = options.confirmLabel || 'Confirmer';
  const existing = document.getElementById('global-confirm');
  if (existing) existing.remove();
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.id = 'global-confirm';
    modal.className = 'modal-overlay global-confirm-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal global-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="global-confirm-title">
        <div class="modal-header"><h3 id="global-confirm-title">${escHtml(title)}</h3>
          <button type="button" class="modal-close" aria-label="Fermer">&times;</button>
        </div>
        <div class="modal-body"><p>${escHtml(text)}</p></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline" data-confirm-cancel>Annuler</button>
          <button type="button" class="btn btn-danger" data-confirm-ok>${escHtml(confirmLabel)}</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const finish = value => { modal.remove(); resolve(value); };
    modal.querySelector('[data-confirm-cancel]').addEventListener('click', () => finish(false));
    modal.querySelector('[data-confirm-ok]').addEventListener('click', () => finish(true));
    modal.querySelector('.modal-close').addEventListener('click', () => finish(false));
    modal.addEventListener('click', event => { if (event.target === modal) finish(false); });
  });
};
