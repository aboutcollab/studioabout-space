// The studios site, the deal page: "your month here". Helena's calculator of 29 Aug (tenant page BM2 v2),
// in Peter's booking layout. Helena, 26 Oct 2026, the order: what kind of event, how many people (the range
// picks the size of the floor), how often, how long. On the right the floor three ways, line on line: at the
// typical Amsterdam price, at our guests' price, and yours as a maker; "it's two comparisons".
// Every number comes from window.SA_MONTH, which the build writes from the engines (web/shared/site_data.py;
// the market from strategy/event_venues.py). No hours are added: the hours you book hold your setting up and
// clearing out (Helena, 31 Aug). The market counts only your hours, with its cleaning inside its price; many
// venues rent by the half day only, so a short booking costs more there than this shows.
(() => {
  const M = window.SA_MONTH, box = document.getElementById('month');
  if (!M || !box) return;
  const $ = (q) => box.querySelector(q), $$ = (q) => [...box.querySelectorAll(q)];
  const eur = (v) => '€' + Math.round(v).toLocaleString('nl-NL');
  const eurc = (v) => '€' + (v % 1 ? v.toFixed(2) : String(v));
  const S = { n: M.start.n, h: M.start.h, setup: M.start.setup, band: M.start.band };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+v || lo)));
  const bandOf = (k) => M.bands.find((b) => b.key === k);
  const fits = (b) => !!b.ranges[S.setup];
  const line = (label, sub, v, cls) => `<div class="r-line${cls ? ' ' + cls : ''}"><span>${label}${sub ? `<small>${sub}</small>` : ''}</span><span class="v">${v}</span></div>`;

  function people() {
    if (!fits(bandOf(S.band))) { const ok = M.bands.filter(fits); S.band = ok[ok.length - 1].key; }
    $('#m_people').innerHTML = M.bands.filter(fits).map((b) => {
      const r = b.ranges[S.setup], lab = r[0] <= 1 ? `up to ${r[1]}` : `${r[0]} to ${r[1]}`;
      return `<button type="button" class="sa-chip" data-band="${b.key}" aria-pressed="false">${lab}<small>${b.chip}</small></button>`;
    }).join('');
    $$('#m_people .sa-chip').forEach((c) => c.addEventListener('click', () => { S.band = c.dataset.band; draw(); }));
  }

  function draw() {
    $('#m_n').value = S.n; $('#m_h').value = S.h;
    $$('.sa-chip[data-setup]').forEach((c) => { const on = c.dataset.setup === S.setup; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    $$('#m_people .sa-chip').forEach((c) => { const on = c.dataset.band === S.band; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    const b = bandOf(S.band);
    const market = S.n * S.h * b.market;                    // the typical Amsterdam venue, your hours, its cleaning inside
    const theirs = S.n * (S.h * b.price + b.clean);         // our outside guests
    const mine = S.n * (S.h * M.rate + b.tclean);           // you, at the studio rate
    const offM = market - mine, offG = theirs - mine;
    const pct = (off, ref) => (ref ? Math.round(100 * off / ref) : 0);
    const times = S.n === 1 ? 'once' : `${S.n} times`;
    let x = line('Your studio', 'everything in', eur(M.studio));
    if (S.n) {
      x += `<p class="r-meta">The floor, ${times} a month, ${S.h} ${S.h === 1 ? 'hour' : 'hours'}, ${b.name.toLowerCase()}:</p>` +
           line('At the typical Amsterdam price', `${eurc(b.market)} an hour, their cleaning inside`, eur(market), 'r-ref') +
           line('At our guests’ price', `${eur(b.price)} an hour and ${eur(b.clean)} cleaning`, eur(theirs), 'r-ref') +
           line('Your price as a maker', `${eur(M.rate)} an hour and ${eur(b.tclean)} cleaning`, eur(mine), 'r-you');
    }
    x += `<div class="r-total"><span>Your month</span><span>${eur(M.studio + mine)}</span></div>` +
         `<div class="r-sub"><span>plus BTW</span><span></span></div>`;
    if (!S.n) x += `<p class="r-note">Host something downstairs and see what you save on the floor.</p>`;
    else if (offM > 0) x += `<p class="r-save">On the floor you pay <b>${eur(offM)}</b> less than the Amsterdam market (<b>${pct(offM, market)}%</b>) and <b>${eur(offG)}</b> less than our guests (<b>${pct(offG, theirs)}%</b>).</p>`;
    else x += `<p class="r-save">You pay <b>${eur(offG)}</b> less than our guests (<b>${pct(offG, theirs)}%</b>). For so short a booking the market looks cheaper here, but many venues only rent by the half day.</p>`;
    $('#mlines').innerHTML = x;
  }

  $$('.sa-chip[data-setup]').forEach((c) => c.addEventListener('click', () => { S.setup = c.dataset.setup; people(); draw(); }));
  $$('.sa-pm[data-k]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.k; S[k] = clamp(S[k] + +b.dataset.d, M.lim[k][0], M.lim[k][1]); draw();
  }));
  ['n', 'h'].forEach((k) => $('#m_' + k).addEventListener('input', (e) => { S[k] = clamp(e.target.value, M.lim[k][0], M.lim[k][1]); draw(); }));
  people(); draw();
  window.__saMonth = { S, draw, people };
})();

// The venues behind each market price (Helena, 26 Oct 2026): opens on hover with a mouse, on a tap on a phone,
// and stays open to click a venue's link; Esc, the ×, or a tap elsewhere closes it.
(() => {
  const srcs = [...document.querySelectorAll('.sa-src')];
  if (!srcs.length) return;
  const set = (s, on) => { s.classList.toggle('open', on); s.querySelector('.sa-srcb').setAttribute('aria-expanded', String(on)); };
  const hover = window.matchMedia('(hover: hover)').matches;
  srcs.forEach((s) => {
    let t;
    s.querySelector('.sa-srcb').addEventListener('click', (e) => { e.stopPropagation(); const on = !s.classList.contains('open'); srcs.forEach((o) => set(o, false)); set(s, on); });
    s.querySelector('.sa-popx').addEventListener('click', (e) => { e.stopPropagation(); set(s, false); });
    s.querySelector('.sa-pop').addEventListener('click', (e) => e.stopPropagation());
    if (hover) {
      s.addEventListener('mouseenter', () => { clearTimeout(t); srcs.forEach((o) => o !== s && set(o, false)); set(s, true); });
      s.addEventListener('mouseleave', () => { t = setTimeout(() => set(s, false), 250); });
    }
  });
  document.addEventListener('click', () => srcs.forEach((s) => set(s, false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') srcs.forEach((s) => set(s, false)); });
})();
