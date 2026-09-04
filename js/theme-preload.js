(function () {
  try {
    var saved = localStorage.getItem('hotspot-theme');
    var dark = saved === 'dark' || (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch (error) {
    // Le thème par défaut reste clair si le stockage local est indisponible.
  }
})();
