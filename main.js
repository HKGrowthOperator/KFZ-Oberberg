/* KFZ Oberberg: Öffnungszeiten, HU-Plakette, Formular, Einblenden beim Scrollen. Ohne Bibliotheken. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Öffnungszeiten (mit den echten Zeiten abgleichen) ---------- */
  const OPEN = { 1: [7.5, 17.5], 2: [7.5, 17.5], 3: [7.5, 17.5], 4: [7.5, 17.5], 5: [7.5, 17.5], 6: [9, 12] };
  const fmt = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
  const slot = OPEN[d], isOpen = !!slot && h >= slot[0] && h < slot[1];
  $$('[data-status]').forEach((el) => {
    el.classList.toggle('open', isOpen);
    el.querySelector('span').textContent = isOpen ? 'Geöffnet' : 'Geschlossen';
  });
  const today = $('[data-today]');
  if (today) {
    if (isOpen) today.textContent = `bis ${fmt(slot[1])} Uhr`;
    else {
      let n = 1, next = null;
      for (; n <= 7; n++) { const nd = (d + n) % 7; if (OPEN[nd]) { next = nd; break; } }
      const tage = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
      today.textContent = slot && h < slot[0] ? `öffnet um ${fmt(slot[0])} Uhr` : (next !== null ? `wieder ${n === 1 ? 'morgen' : tage[next]} ab ${fmt(OPEN[next][0])} Uhr` : '');
    }
  }
  $$('[data-hours] li').forEach((li) => {
    const [a, b = a] = li.dataset.d.split('-').map(Number);
    li.classList.toggle('today', d >= a && d <= b);
  });
  $('#year').textContent = now.getFullYear();

  /* ---------- HU-Plakette ---------- */
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  // Farbfolge der Plakette, alle 6 Jahre gleich (2020 blau, 2021 gelb, 2022 braun, 2023 grün, 2024 orange, 2025 rosa)
  const FARBEN = [
    { n: 'blau', bg: '#2d62b4', fg: '#ffffff' }, { n: 'gelb', bg: '#f2cf1d', fg: '#1b1700' },
    { n: 'braun', bg: '#8b5a2b', fg: '#ffffff' }, { n: 'grün', bg: '#2e9e5b', fg: '#ffffff' },
    { n: 'orange', bg: '#ef7d1a', fg: '#1b0e00' }, { n: 'rosa', bg: '#e86fa8', fg: '#2a0014' },
  ];
  const selM = $('#hu-m'), selY = $('#hu-y'), ring = $('#hu-ring'), bg = $('#hu-bg'), yr = $('#hu-year'), res = $('#hu-result');
  const NS = 'http://www.w3.org/2000/svg';
  let rot = 0;
  if (selM && ring) {
    MONATE.forEach((m, i) => selM.add(new Option(`${i + 1}  (${m})`, i + 1)));
    const y0 = now.getFullYear();
    for (let y = y0 - 2; y <= y0 + 3; y++) selY.add(new Option(String(y), y));
    selM.value = 5; selY.value = y0 + 1;          // Beispielwerte, werden vom Besucher geändert

    const nums = [];
    for (let i = 0; i < 12; i++) {
      const t = document.createElementNS(NS, 'text');
      const a = i * 30;
      t.setAttribute('transform', `rotate(${a} 160 160)`);
      t.setAttribute('x', 160); t.setAttribute('y', 52);
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('font-family', 'Barlow Condensed, sans-serif');
      t.setAttribute('font-weight', '800'); t.setAttribute('font-size', '34');
      t.textContent = String(i + 1);
      ring.appendChild(t); nums.push(t);
    }
    const update = () => {
      const m = +selM.value, y = +selY.value;
      const f = FARBEN[(((y - 2020) % 6) + 6) % 6];
      bg.setAttribute('fill', f.bg); nums.forEach((t) => t.setAttribute('fill', f.fg));
      yr.textContent = String(y).slice(-2);
      const target = -(m - 1) * 30;                // gewählter Monat dreht nach oben (kürzester Weg)
      rot += ((target - rot) % 360 + 540) % 360 - 180;
      ring.style.transform = `rotate(${rot}deg)`;
      const diff = (y * 12 + m) - (now.getFullYear() * 12 + now.getMonth() + 1);
      let kopf, text, cls;
      if (diff > 1) { kopf = `Fällig Ende ${MONATE[m - 1]} ${y}`; text = `Noch ${diff} Monate Zeit. Die Plakette für ${y} ist ${f.n}.`; cls = 'ok'; }
      else if (diff === 1) { kopf = `Fällig Ende ${MONATE[m - 1]} ${y}`; text = 'Das ist nächsten Monat. Jetzt einen Termin machen, dann haben Sie Luft.'; cls = 'soon'; }
      else if (diff === 0) { kopf = 'Diesen Monat fällig'; text = `Bis Ende ${MONATE[m - 1]} muss die HU erledigt sein.`; cls = 'soon'; }
      else if (diff >= -2) { kopf = `Seit ${-diff} Monat${diff === -1 ? '' : 'en'} überfällig`; text = 'Bis zu zwei Monate Überziehung bleiben ohne Bußgeld. Besser jetzt noch zur HU.'; cls = 'late'; }
      else { kopf = `Seit ${-diff} Monaten überfällig`; text = 'Mehr als zwei Monate drüber wird kostenpflichtig. Bitte bald zur HU.'; cls = 'late'; }
      res.className = `hu-result ${cls}`;
      res.innerHTML = `<b></b><span></span>`; res.firstChild.textContent = kopf; res.lastChild.textContent = text;
    };
    selM.addEventListener('change', update); selY.addEventListener('change', update);
    update();
  }

  /* ---------- Formular ---------- */
  const form = $('#anfrage'), note = $('#form-note'), select = $('#leistung'), kz = $('#f-kz');
  kz.addEventListener('input', () => { kz.value = kz.value.toUpperCase(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = 'Bitte Name, Telefon und Einverständnis ausfüllen.'; note.classList.add('err'); return; }
    note.classList.remove('err');
    note.textContent = 'Entwurf: Das Formular ist noch nicht angebunden. Ihre Angaben wurden nicht gesendet.';
  });
  $$('[data-leistung]').forEach((a) => a.addEventListener('click', () => {
    select.value = a.dataset.leistung;
    form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
  }));

  /* ---------- Mobile Anruf-Leiste ---------- */
  const callbar = $('.callbar');
  const onScroll = () => callbar.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Einblenden beim Scrollen ---------- */
  const items = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  // Karten und Schritte nacheinander, nicht alle gleichzeitig
  $$('.cards, .steps, .team').forEach((g) => [...g.children].forEach((c, i) => c.style.setProperty('--d', `${(i % 4) * 0.08}s`)));
  items.forEach((el) => io.observe(el));
})();
