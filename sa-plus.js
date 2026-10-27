// Studio About sites: small additions to Peter's sa.js (which stays unchanged).
(() => {
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  // the map: Google only loads when someone asks for it (no third-party cookies before a click)
  $$('[data-map]').forEach((b) => b.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = b.dataset.map; f.title = 'Map: ' + (b.dataset.label || 'Studio About'); f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    b.replaceWith(f);
  }));
  // the 3D model: a still first, the live model only when someone taps "turn it"
  $$('[data-model]').forEach((b) => b.addEventListener('click', () => {
    const box = b.closest('.sa-model'); if (!box) return;
    const f = document.createElement('iframe');
    f.src = b.dataset.model; f.title = b.dataset.label || 'The 3D model'; f.allow = 'fullscreen';
    box.querySelectorAll('img').forEach((i) => i.remove());
    b.replaceWith(f);
  }));
})();
