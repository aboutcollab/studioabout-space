// Studio About website 4.0: the page script (engine/studio_site4.mjs copies it to the site as sa.js).
// About Collab's 2.0 motion (round 46), calmer: the colour flows with the scroll (mixed in OKLab), the rails run
// round while in view, the invitation in the tagline turns; everything else only moves when you point at it.
(() => {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (q, r = document) => r.querySelector(q), $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const root = document.documentElement;
  // review shots: ?y=1200 opens the page scrolled that far
  { const m = location.search.match(/[?&]y=(\d+)/); if (m) { root.style.scrollBehavior = 'auto'; addEventListener('load', () => scrollTo(0, +m[1])); } }

  // ---- the colour: one flat colour behind the white fields, by meaning, flowing from part to part ------------
  // y Brazil Yellow (welcome, celebrate), w white (the space, the facts), p Purple Rain (photos, the closing call),
  // g Lush Green (trust, togetherness), i Ice Ice Baby (About Collab's part), s Brazil Yellow held (About Sabor's)
  const C = { y: '#FFCB00', w: '#FFFFFF', p: '#6400CC', g: '#019999', i: '#DEEBF7', s: '#FFCB00' };
  // OKLab, so purple to yellow never passes through mud
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  const lab = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
  const rgb = ([L, a, b]) => { const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const v = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    return '#' + v.map((x) => Math.round(Math.min(1, Math.max(0, gam(x))) * 255).toString(16).padStart(2, '0')).join(''); };
  const LAB = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, lab(v)]));
  const mix = (A, B, t) => A.map((x, i) => x + (B[i] - x) * t);
  const stops = $$('main [data-c], footer[data-c]').map((el) => ({ el, k: el.dataset.c, c: LAB[el.dataset.c] || LAB.w }));
  // held: About Sabor's yellow (Peter: "only real yellow"), and every part that says so (data-hold: a rail, or
  // words on the colour); such a colour stays pure while its part is on the screen
  const isHeld = (s) => s.k === 's' || s.el.hasAttribute('data-hold');
  const setColour = () => {
    if (!stops.length) return;
    const vh = innerHeight, y = scrollY, maxY = root.scrollHeight - vh;
    const vis = stops.filter((s) => s.el.getClientRects().length);
    const R = vis.map((s) => { const r = s.el.getBoundingClientRect(); return [r.top + y, r.bottom + y]; });
    let col = vis[0] ? vis[0].c : LAB.w, prevEnd = -Infinity, prevHeld = false;
    const hold = (s) => s.el.getAttribute('data-hold');
    // the last run of stops in the foot's own colour (the closing call and the foot): the colour reaches it before
    // the foot's top comes into view, so the flat purple foot never meets another colour in a hard line
    const last = vis.length - 1, footTop = last >= 0 && vis[last].el.matches('footer') ? R[last][0] : null;
    let run = last; while (footTop !== null && run > 0 && C[vis[run - 1].k] === C[vis[last].k]) run--;
    // the top bar's bottom: squares that end a part (data-hold="sq") keep its colour until they are under it
    const hd = $('.sa-top'), barB = hd ? hd.getBoundingClientRect().bottom : 0;
    const titled = (s) => isHeld(s) && hold(s) === 'rail' && s.el.matches('.sa-railsec') && !!s.el.querySelector('h2');
    for (let n = 1; n < vis.length; n++) {
      const same = vis[n - 1].k === vis[n].k || C[vis[n - 1].k] === C[vis[n].k];
      const held = isHeld(vis[n - 1]) && !same;
      let a, b;
      // About Sabor's yellow first (Peter: "only real yellow"): pure while any of its part is on the screen, whatever comes
      // next; the next colour starts once its last part is under the top bar
      if (held && vis[n - 1].k === 's') { a = R[n - 1][1] - barB; b = a + vh * 0.3; if (b > maxY + 1) break; }
      else if (held && hold(vis[n - 1]) === 'text') { a = R[n - 1][1] - vh * 0.15; b = R[n - 1][1] + vh * 0.05; }
      // squares that end a part: the next colour comes while they slide up, complete just after the last one has gone
      // under the bar (so the next part arrives on its own colour, and no square ever stands on its own colour pure)
      else if (held && hold(vis[n - 1]) === 'sq') { a = R[n - 1][1] - vh * 0.5; b = R[n - 1][1] - barB + vh * 0.08; }
      else if (held && hold(vis[n - 1]) === 'rail') { a = R[n - 1][1] - vh * 0.5; b = R[n - 1][1] - vh * 0.2; }
      else if (isHeld(vis[n]) && hold(vis[n]) === 'rail' && vis[n].el.querySelector('h2')) { a = R[n][0] - vh * 1.25; b = R[n][0] - vh * 0.95; }
      else if (isHeld(vis[n]) && hold(vis[n]) === 'rail') { a = R[n][0] - vh * 0.95; b = R[n][0] - vh * 0.7; }
      else if (held && hold(vis[n - 1])) { a = R[n - 1][1] - vh * 0.75; b = R[n - 1][1] - vh * 0.35; }
      else if (held) { a = R[n - 1][1] - vh * 0.35; b = R[n - 1][1]; if (b > maxY + 1) break; }
      else if (vis[n].k === 's') { a = R[n][0] - vh * 1.25; b = R[n][0] - vh; }
      else { a = R[n][0] - vh * 1.4; b = R[n][0] - vh * 0.9; }   // the colour arrives before the part
      // a part has its own moment: the next colour never starts before this part stands in the middle of the
      // screen (a short part would otherwise never show its colour pure), nor before the page has been scrolled
      const mPrev = Math.max(0, (R[n - 1][0] + R[n - 1][1]) / 2 - vh / 2);
      if (a < mPrev) { a = mPrev; b = Math.max(b, a + vh * 0.35); }
      if (prevHeld && a < prevEnd + vh * 0.25) { const d = Math.min(prevEnd + vh * 0.25 - a, Math.max(0, maxY - b)); a += d; b += d; }
      // a rail's white title never comes in on another colour: its rail's colour is complete as the title enters the
      // screen, reached over a fifth of a screen where there is room; where the part before it is short, that part
      // first keeps its own colour for a tenth of a screen, and the change still takes at least an eighth (no switch)
      if (titled(vis[n]) && !same) { const lim = R[n][0] - vh * 0.97;
        if (b > lim) { b = lim; a = Math.min(a, b - vh * 0.2); if (a < prevEnd + vh * 0.1) a = Math.min(b - vh * 0.12, prevEnd + vh * 0.1); a = Math.max(0, a); if (b < a + vh * 0.12) b = a + vh * 0.12; } }
      if (footTop !== null && n === run && b > footTop - vh) { const d = b - Math.max(0, footTop - vh); a -= d; b -= d; if (a < 0) a = 0; if (b <= a) b = a + 1; }
      prevEnd = b; prevHeld = held;
      if (same) continue;
      const t = Math.min(1, Math.max(0, (y - a) / (b - a)));
      if (t <= 0) break;
      col = mix(col, vis[n].c, t * t * (3 - 2 * t));
    }
    // a rail's white title keeps its rail's colour while it can still be read under the bar and the pills
    let top = barB;
    const wn = $('.sa-wnav'); if (wn) { const r = wn.getBoundingClientRect(); if (r.top <= top + 20) top = Math.max(top, r.bottom); }
    $$('main .sa-railsec[data-hold="rail"][data-c] h2').forEach((h) => { if (!h.getClientRects().length) return; const r = h.getBoundingClientRect(), d = Math.min(r.bottom - top, vh - r.top); if (d <= 0) return;
      const rc = LAB[h.closest('[data-c]').dataset.c]; if (rc) col = mix(col, rc, Math.min(1, d / r.height)); });
    const hex = rgb(col); root.style.setProperty('--c', hex);
    // words that stand on the moving colour itself (the reviews' heading) take black or white, whichever
    // stands out more on the colour of this moment (letters black or white only: rule 3)
    const L = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255)), Y = 0.2126 * L[0] + 0.7152 * L[1] + 0.0722 * L[2];
    const onWhite = 1.05 / (Y + 0.05) > (Y + 0.05) / 0.05;
    root.style.setProperty('--on', onWhite ? '#fff' : '#000'); root.style.setProperty('--off', onWhite ? '#000' : '#fff');
  };
  addEventListener('scroll', setColour, { passive: true }); addEventListener('resize', setColour); addEventListener('load', setColour); setColour();

  // ---- the top bar: the menu on a phone, back to the top -----------------------------------------------------
  const burger = $('.sa-burger'), panel = $('#sa-panel');
  if (burger && panel) burger.addEventListener('click', () => { const open = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', open); panel.hidden = !open; });
  if (panel) panel.addEventListener('click', (e) => { if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); panel.hidden = true; } });
  const totop = $('.sa-totop');
  if (totop) { const show = () => totop.classList.toggle('on', scrollY >= 300); addEventListener('scroll', show, { passive: true }); show();
    totop.addEventListener('click', () => scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })); }

  // ---- the floating pills: the part you are in is marked ---------------------------------------------------
  const wn = $('.sa-wnav');
  if (wn) { const links = $$('a', wn), parts = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
    const mark = () => { const line = innerHeight * 0.35; let on = -1; parts.forEach((p, i) => { if (p && p.getBoundingClientRect().top < line) on = i; });
      links.forEach((a, i) => { if (i === on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      // on a phone the row of pills scrolls sideways: the marked one comes into view, never a sliver of the one before it;
      // above the first part the row goes back to its start
      if (on !== last && wn.scrollWidth > wn.clientWidth) wn.scrollTo({ left: rowLeft(on), behavior: still ? 'auto' : 'smooth' }); last = on; };
    // where the row stands for pill i: the pill before it whole at the left and the marked one beside it, or (when both do
    // not fit) the marked one first; never a pill cut at the left edge. Near the row's end it gets the room to scroll
    // that far (a little space after the last pill)
    const rowLeft = (i) => { if (i <= 0) return 0; const gap = parseFloat(getComputedStyle(wn).columnGap) || 8;
      const a = links[i], p = links[i - 1], right = a.offsetLeft + a.offsetWidth;
      // (the first pill in view stands one gap from the edge: the one before it then ends exactly at the edge)
      const want = right - (p.offsetLeft - gap) <= wn.clientWidth - gap ? Math.max(0, i === 1 ? 0 : p.offsetLeft - gap) : a.offsetLeft - gap;
      const max = wn.scrollWidth - wn.clientWidth; if (want > max) wn.style.paddingRight = (parseFloat(getComputedStyle(wn).paddingRight) || 0) + want - max + 'px';
      return want; };
    let last = -1;
    addEventListener('scroll', mark, { passive: true }); mark(); }

  // ---- a tap plays an icon on a phone (pointing does it on a laptop) ----------------------------------------
  document.addEventListener('touchstart', (e) => { const h = e.target.closest('.hov'); if (!h) return; h.classList.remove('tap'); void h.offsetWidth; h.classList.add('tap'); setTimeout(() => h.classList.remove('tap'), 900); }, { passive: true });

  // ---- the turning tagline: the core stays, the invitation rolls on, one shape in front changes softly ------
  const inv = $$('.inv'), bullet = $('.sa-tbullet'), ttag = $('.sa-ttag');
  const SH = [['s', '#FF6501'], ['c', '#27EEEA'], ['s', '#019999'], ['c', '#6400CC']];
  if (!still && inv.length > 1) { let k = 0;
    setInterval(() => { if (document.visibilityState !== 'visible') return;
      const a = inv[k]; k = (k + 1) % inv.length; const b = inv[k];
      a.classList.remove('on'); a.classList.add('out'); b.classList.remove('out'); b.classList.add('on');
      setTimeout(() => a.classList.remove('out'), 900);
      if (ttag) ttag.setAttribute('aria-label', b.dataset.t + ' Studio About, making connection an Art');
      if (bullet) { const [cls, col] = SH[k % 4]; bullet.style.opacity = '0';
        setTimeout(() => { bullet.className = 'sa-tbullet ' + cls; bullet.style.background = col; bullet.style.opacity = '1'; }, 350); } }, 3200); }

  // ---- films play muted while you see them (not when you ask for less motion) -------------------------------
  if (!still && 'IntersectionObserver' in window) { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.preload = 'auto'; e.target.play().catch(() => {}); } else e.target.pause(); }), { threshold: 0.4 });
    $$('video[data-auto]').forEach((v) => io.observe(v)); }

  // ---- the rails: photos 80 px a second, reviews 45, only while in view; drag, swipe, point to zoom, click to lift
  $$('.sa-rail, .sa-revtrack').forEach((box) => {
    const isRev = box.matches('.sa-revtrack');
    const list = () => [...(isRev ? box.children : box.firstElementChild.children)];
    const rounds = isRev ? (+box.dataset.rounds || 3) : 2;
    const half = () => { const it = list(); return it.length > 1 ? it[Math.floor(it.length / rounds)].offsetLeft - it[0].offsetLeft : 0; };
    const speed = isRev ? 45 : 80;
    let seen = false, rest = 0, mine = 0, carry = 0, last = 0, pinned = null, drag = null, smooth = 0, touch = null;
    let raf = 0;   // the loop runs only while the rail is in view and may move (no idle frames off screen)
    const run = () => { if (!raf && !still && seen) raf = requestAnimationFrame(step); };
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; run(); }).observe(box);
    const pause = (ms) => { rest = Math.max(rest, performance.now() + ms); };
    const letGo = (ms) => { if (pinned) { pinned.classList.remove('pin'); pinned = null; } rest = performance.now() + ms; };
    box.addEventListener('touchstart', (e) => { pause(1e9); touch = { x: e.touches[0].clientX, moved: false }; }, { passive: true });
    box.addEventListener('touchmove', (e) => { if (touch && Math.abs(e.touches[0].clientX - touch.x) > 5) touch.moved = true; }, { passive: true });
    box.addEventListener('touchend', () => { if (touch && touch.moved) letGo(2500); else if (!pinned) rest = performance.now() + 2500; touch = null; }, { passive: true });
    box.addEventListener('wheel', (e) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) letGo(2000); }, { passive: true });
    const sec = box.closest('section');
    if (isRev && sec) $$('.sa-arr', sec).forEach((a) => a.addEventListener('click', () => {
      letGo(4000); const it = list(), w = it.length > 1 ? it[1].offsetLeft - it[0].offsetLeft : 365, hl = half(), dir = a.classList.contains('prev') ? -1 : 1;
      const max = box.scrollWidth - box.clientWidth; let x = box.scrollLeft, to = x + dir * w;
      if (hl) { if (to > max) { x -= hl; to -= hl; } else if (to < 0) { x += hl; to += hl; } }
      mine = performance.now(); box.scrollLeft = x; smooth = performance.now() + 700; box.scrollTo({ left: to, behavior: still ? 'auto' : 'smooth' }); }));
    box.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a,button')) return; drag = { x: e.clientX, left: box.scrollLeft, moved: false }; });
    addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5) { drag.moved = true; letGo(1e9); let x = drag.left - dx; const hl = half();
        if (hl) { while (x < 0) { x += hl; drag.left += hl; } while (x >= hl) { x -= hl; drag.left -= hl; } }
        mine = performance.now(); box.scrollLeft = x; } });
    addEventListener('pointerup', () => { if (drag && drag.moved) letGo(1500); setTimeout(() => { drag = null; }, 0); });
    box.addEventListener('click', (e) => { if (e.target.closest('a,button') || (drag && drag.moved)) return;
      const it = e.target.closest(isRev ? '.sa-card' : '.sa-ph'); if (!it) return;
      if (pinned === it) { letGo(400); return; }
      if (pinned) pinned.classList.remove('pin');
      pinned = it; it.classList.add('pin'); pause(1e9); });
    box.addEventListener('dragstart', (e) => e.preventDefault());
    box.addEventListener('scroll', () => { const hl = half(); if (!hl) return;
      if (performance.now() - mine > 100 && pinned && !drag) letGo(2000);
      if (performance.now() < smooth) return;
      if (box.scrollLeft > hl) { mine = performance.now(); box.scrollLeft -= hl; } else if (box.scrollLeft < 1 && drag === null && performance.now() - mine > 100) { mine = performance.now(); box.scrollLeft += hl; } }, { passive: true });
    function step(t) { raf = 0; const dt = last ? Math.min(64, t - last) : 0; last = t;
      if (!still && seen && t > rest) { carry += speed * dt / 1000; const px = Math.floor(carry); if (px) { carry -= px; mine = t; box.scrollLeft += px; } }
      if (!still && seen) raf = requestAnimationFrame(step); else last = 0; }
    run();
  });

  // ---- the reviews: how long ago, and the whole review in a box --------------------------------------------
  const now = Date.now();
  $$('.sa-when[data-date]').forEach((t) => { const d = Math.round((now - new Date(t.dataset.date + 'T12:00:00').getTime()) / 864e5); if (!(d >= 0)) return;
    t.textContent = d < 14 ? (d === 1 ? '1 day ago' : d + ' days ago') : d <= 84 ? Math.round(d / 7) + ' weeks ago' : d < 365 ? Math.round(d / 30.4) + ' months ago' : (Math.round(d / 365) === 1 ? 'a year ago' : Math.round(d / 365) + ' years ago'); });
  const lb = $('.sa-lb');
  if (lb) { const body = $('.sa-lb-body', lb); let back = null;
    const close = () => { lb.hidden = true; body.innerHTML = ''; if (back) back.focus(); };
    const open = (card, btn) => { body.innerHTML = card.innerHTML; back = btn; lb.hidden = false; $('.sa-lb-x', lb).focus(); };
    document.addEventListener('click', (e) => { const b = e.target.closest('.sa-more'); if (b && !lb.contains(b)) { open(b.closest('.sa-card'), b); return; } if (e.target.closest('[data-close]')) close(); });
    addEventListener('keydown', (e) => { if (!lb.hidden && e.key === 'Escape') close(); }); }

  // ---- the 3D drawing: if the module is not there (no space3d.js yet, or it failed), the stills stand in --------
  addEventListener('load', () => {
    if (window.SA3D || !$('.sa3d')) return;
    const set = (el, id) => { const still = $('.sa3d-still', el), b = $(`.sa-pill[data-setup="${id}"]`, el); if (!b) return;
      el.dataset.setup = id; el.dataset.sa3d = 'still'; still.src = 'media/space/' + id + '.jpg'; still.hidden = false; $('.sa3d-canvas', el).hidden = true; const z = $('.sa3d-zoom', el); if (z) z.hidden = true;
      $$('.sa-pill', el).forEach((p) => p.setAttribute('aria-pressed', p === b));
      const cap = $('.sa3d-cap', el); if (cap && b.dataset.cap) cap.innerHTML = '<b>' + b.textContent.trim() + '</b> · ' + b.dataset.cap; };
    $$('.sa3d').forEach((el) => { const still = $('.sa3d-still', el); still.addEventListener('error', () => { still.hidden = true; });
      set(el, el.dataset.setup); el.addEventListener('click', (e) => { const p = e.target.closest('.sa-pill[data-setup]'); if (p) set(el, p.dataset.setup); }); });
    $$('[data-sa3d-setup]').forEach((a) => a.addEventListener('click', () => { const el = $('.sa3d'); if (el) set(el, a.dataset.sa3dSetup); }));
  });

  // ---- the booking page: the choices build up "your day" on the right; nothing is sent ----------------------
  const B = window.SA_BOOK, fev = $('#fevent');
  if (B && fev) {
    const CAP = Object.fromEntries(B.setups.map((s) => [s.id, s.cap])), SUM = Object.fromEntries(B.setups.map((s) => [s.id, s.sum]));
    // hand-set lines (rule 10), as the pages': a line is a block, ' | ' marks where a narrow screen may break it again
    const LN = (lines) => lines.map((l) => '<span class="ln">' + l.split(' | ').map((g) => '<span class="sg">' + g + '</span>').join(' ') + '</span>').join('');
    // a chip's words inside a sentence: only the first letter small ("an About Collab event", "with wine and beer")
    const low = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    const S = { tab: 'event', what: '', people: 24, setup: B.def, date: null, food: 'none', drinks: 'none', ac: 'none', host: '' };
    const label = (name, v) => { const b = $(`.sa-chips[data-name="${name}"] .sa-chip[data-v="${CSS.escape(v)}"]`); return b ? b.textContent : ''; };
    const choose = (g, c) => $$('.sa-chip', g).forEach((x) => { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); });
    const pick = (name, v) => { const g = $(`.sa-chips[data-name="${name}"]`), c = g && $(`.sa-chip[data-v="${CSS.escape(v)}"]`, g); if (!c) return; choose(g, c); S[name] = v; };
    const tab = (t) => { S.tab = t; $$('.sa-tab').forEach((b) => { b.classList.toggle('on', b.dataset.t === t); b.setAttribute('aria-selected', b.dataset.t === t); }); $$('.sa-pane').forEach((p) => p.classList.toggle('on', p.dataset.p === t)); draw(); };
    $$('.sa-tab').forEach((b) => b.addEventListener('click', () => tab(b.dataset.t)));
    $$('.sa-chips').forEach((g) => g.addEventListener('click', (e) => { const c = e.target.closest('.sa-chip'); if (!c) return; choose(g, c); S[g.dataset.name] = c.dataset.v; draw(); }));
    // arriving from a square on another page: what you clicked is already chosen
    const q = new URLSearchParams(location.search);
    if (q.get('what')) pick('what', q.get('what'));
    if (q.get('ac')) pick('ac', q.get('ac'));
    if (q.get('what') === 'dinner') pick('food', 'dinner');
    const ppl = $('#people'), sl = $('#pslide');
    const setP = (n) => { n = Math.max(2, Math.min(B.max, Math.round(+n || 2))); S.people = n; ppl.value = n; sl.value = n; draw(); };
    ppl.addEventListener('input', () => setP(ppl.value)); sl.addEventListener('input', () => setP(sl.value));
    $$('.sa-pm').forEach((b) => b.addEventListener('click', () => setP(S.people + +b.dataset.d)));
    $$('.sa-sp').forEach((b) => b.addEventListener('click', () => { if (b.classList.contains('no')) return; $$('.sa-sp').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); S.setup = b.dataset.v; draw(); }));
    let month = new Date(2027, 0, 1);
    const cal = $('#cal'), MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const drawCal = () => {
      const y = month.getFullYear(), m = month.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
      let h = '<div class="sa-calh"><button type="button" data-m="-1" aria-label="Previous month">←</button><b>' + MONTHS[m] + ' ' + y + '</b><button type="button" data-m="1" aria-label="Next month">→</button></div><div class="sa-calg">';
      h += ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => '<span class="sa-dw">' + d + '</span>').join('');
      for (let i = 0; i < first; i++) h += '<span></span>';
      for (let d = 1; d <= days; d++) { const on = S.date && new Date(y, m, d).getTime() === S.date.getTime(); h += '<button type="button" class="sa-day' + (on ? ' on' : '') + '" data-d="' + d + '" aria-pressed="' + !!on + '">' + d + '</button>'; }
      cal.innerHTML = h + '</div>';
    };
    cal.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) { const n = new Date(month.getFullYear(), month.getMonth() + +b.dataset.m, 1); if (n >= new Date(2027, 0, 1)) month = n; drawCal(); return; }
      S.date = new Date(month.getFullYear(), month.getMonth(), +b.dataset.d); cal.classList.remove('bad'); drawCal(); draw(); });
    ['from', 'until'].forEach((id) => $('#' + id).addEventListener('change', draw));
    const hours = () => { const t = (v) => { const [h, m] = v.split(':').map(Number); return h + m / 60; }; return t($('#until').value) - t($('#from').value); };
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const line = (k, v, warn) => '<div class="sa-sl' + (warn ? ' warn' : '') + '"><span>' + k + '</span><b>' + LN([].concat(v)) + '</b></div>';
    function draw() {
      const out = [];
      if (S.tab === 'event') {
        const fits = S.people <= CAP[S.setup];
        $$('.sa-sp').forEach((b) => { const no = S.people > CAP[b.dataset.v]; b.classList.toggle('no', no); b.setAttribute('aria-disabled', no); });
        $('#sizehint').innerHTML = LN(fits ? ['Up to <b>' + CAP[S.setup] + '</b> in this set-up: | you fit.'] : ['That is more than this set-up holds.', 'Standing, the floor | takes up to ' + B.max + '.']);
        const h = hours();
        $('#winhint').innerHTML = LN(h > 0 ? ['Your window: ' + $('#from').value + ' until ' + $('#until').value + ', | ' + h + (h === 1 ? ' hour.' : ' hours.'), 'Setting up and clearing out | sit inside it.'] : ['Pick an end time | after the start.']);
        out.push(line('What', S.what ? low(label('what', S.what)) : 'an event'));
        out.push(line('When', S.date ? [S.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), $('#from').value + ' until ' + $('#until').value] : 'pick a day', !S.date));
        out.push(line('People', S.people + (fits ? ' people' : ', too many | for this set-up'), !fits));
        out.push(line('Set-up', SUM[S.setup]));
        // one word for nothing chosen, everywhere: none
        out.push(line('Food', S.food === 'none' ? 'none' : 'About&nbsp;Sabor: | ' + label('food', S.food)));
        out.push(line('Drinks', S.drinks === 'none' ? 'none' : low(label('drinks', S.drinks))));
        out.push(line('About&nbsp;Collab', S.ac === 'none' ? 'none' : S.ac === 'help' ? low(label('ac', S.ac)) : label('ac', S.ac)));
        out.push(line('With the room', 'a projector'));
      } else {
        out.push(line('What', 'a studio of your own'));
        out.push(line('You make', esc($('#smake').value || 'tell us')));
        out.push(line('Hosting', S.host ? low(label('host', S.host)) : 'tell us'));
        out.push(line('From', $('#sfrom').value));
        out.push(line('Next', 'a coffee together'));
      }
      $('#sumlines').innerHTML = out.join('');
      $('.sa-price').hidden = S.tab !== 'event';
      place();
    }
    const sum = $('.sa-sum'), grid = $('.sa-bgrid'), narrow = matchMedia('(max-width: 999px)');
    function place() { if (!sum || !grid) return;
      const send = $('.sa-pane.on .sa-send'), want = narrow.matches && send ? send : null;
      if (want) { if (sum.nextElementSibling !== want) want.before(sum); } else if (sum.parentElement !== grid) grid.append(sum); }
    narrow.addEventListener('change', place);
    $$('#smake, #sfrom').forEach((el) => el.addEventListener('input', draw));
    const need = (ids) => { let ok = true; ids.forEach((id) => { const el = $('#' + id), bad = !el.value.trim() || (el.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value)); el.classList.toggle('bad', bad); if (bad) ok = false; }); return ok; };
    const thanks = (name) => { $('#thx').textContent = 'Thank you' + (name ? ', ' + name.trim().split(' ')[0] : '') + '.'; $('#thanks').hidden = false; $('#thclose').focus(); };
    fev.addEventListener('submit', (e) => { e.preventDefault(); const ok = need(['name', 'email']);
      if (!S.date) { cal.classList.add('bad'); cal.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' }); }
      if (ok && S.date) thanks($('#name').value); });
    $('#fstudio').addEventListener('submit', (e) => { e.preventDefault(); if (need(['sname', 'semail'])) thanks($('#sname').value); });
    $('#thclose').addEventListener('click', () => { $('#thanks').hidden = true; });
    drawCal(); draw();
    if (location.hash === '#studio') tab('studio');
  }
})();
