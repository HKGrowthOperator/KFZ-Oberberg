/* KFZ Oberberg – Interaktionen & Scroll-Animationen (GSAP + ScrollTrigger + Lenis) */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Öffnungszeiten (hier mit den echten Zeiten abgleichen) ---------- */
  const OPEN = { 1: [7.5, 17.5], 2: [7.5, 17.5], 3: [7.5, 17.5], 4: [7.5, 17.5], 5: [7.5, 17.5], 6: [9, 12] };
  const fmt = (h) => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  (function status() {
    const now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes() / 60;
    const slot = OPEN[d], isOpen = slot && h >= slot[0] && h < slot[1];
    const text = isOpen ? `Geöffnet bis ${fmt(slot[1])}` : 'Gerade geschlossen';
    $$('[data-status]').forEach((el) => { el.classList.toggle('open', !!isOpen); el.querySelector('span').textContent = text; });
    $$('[data-hours] li').forEach((li) => {
      const [a, b = a] = li.dataset.d.split('-').map(Number);
      li.classList.toggle('today', d >= a && d <= b);
    });
    $('#year').textContent = now.getFullYear();
  })();

  /* ---------- Formular: ohne Backend als E-Mail (später an Formular-Dienst anbinden) ---------- */
  const form = $('#anfrage'), note = $('#form-note'), select = $('#leistung');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = 'Bitte Name, Telefon und Einverständnis ausfüllen.'; note.classList.add('err'); return; }
    const data = new FormData(form);
    const body = [...data.entries()].map(([k, v]) => `${k}: ${v}`).join('\n');
    location.href = 'mailto:info@example.de?subject=' + encodeURIComponent('Terminanfrage – ' + data.get('leistung')) + '&body=' + encodeURIComponent(body);
    note.classList.remove('err'); note.textContent = 'Ihr E-Mail-Programm öffnet sich mit der Anfrage.';
  });
  // Klick auf eine Leistung wählt sie im Formular vor
  $$('[data-leistung]').forEach((a) => a.addEventListener('click', () => {
    select.value = a.dataset.leistung;
    form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
  }));

  /* ---------- Mobile Anruf-Leiste erst nach dem Hero ---------- */
  const callbar = $('.callbar'), header = $('.site-header');
  let lastY = 0;
  const onScroll = (y) => {
    callbar.classList.toggle('show', y > window.innerHeight * 0.7);
    header.classList.toggle('scrolled', y > 40);
    header.classList.toggle('hidden', y > lastY && y > 400);
    lastY = y;
  };

  if (reduce || !hasGsap) {
    document.body.classList.remove('is-loading');
    const intro = $('.intro'); if (intro) intro.remove();
    if (!hasGsap) $$('.statement-text').forEach((el) => (el.style.opacity = 1));
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    if (reduce) $$('video').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });
    if (window.matchMedia('(max-width:900px)').matches || reduce) document.documentElement.classList.add('no-pin');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Weiches Scrollen ---------- */
  let lenis = null;
  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true });
    lenis.on('scroll', (e) => { ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const target = $(id); if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -70, duration: 1.4 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- Text in Wörter zerlegen ---------- */
  const splitWords = (el, cls) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => cls === 'mask'
      ? `<span class="wm" style="display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.06em;margin-bottom:-.06em"><span class="wi" style="display:inline-block">${w}</span></span>`
      : `<span class="w">${w}</span>`).join(' ');
  };

  /* ---------- Intro + Hero ---------- */
  const heroLines = $$('.hero-title .line > span');
  gsap.set(heroLines, { yPercent: 105 });
  gsap.set('.reveal-up', { y: 24, opacity: 0 });
  gsap.set('.site-header', { yPercent: -100 });
  const intro = gsap.timeline({ defaults: { ease: 'power4.inOut' }, onComplete: () => { $('.intro')?.remove(); document.body.classList.remove('is-loading'); } });
  intro
    .from('.intro-word', { scale: 0.86, opacity: 0, duration: 0.6, ease: 'power3.out' })
    .to('.intro-word', { yPercent: -40, opacity: 0, duration: 0.45, ease: 'power3.in' }, '+=0.35')
    .to('.intro-stripes', { xPercent: 110, duration: 0.9 }, '-=0.15')
    .to(heroLines, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out' }, '-=0.45')
    .to('.reveal-up', { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, '-=0.8')
    .to('.site-header', { yPercent: 0, duration: 0.8, ease: 'power3.out' }, '-=0.8');

  // Hero-Video beim Rausscrollen leicht zoomen, Titel schiebt sich nach oben
  gsap.to('.hero-video', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-inner', { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center center', end: 'bottom top', scrub: true } });

  /* ---------- Statement: Wörter werden beim Scrollen „eingeschaltet“ ---------- */
  $$('.split-words').forEach((el) => {
    splitWords(el, 'w');
    gsap.to(el.querySelectorAll('.w'), { opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  });

  /* ---------- Überschriften: Wörter steigen aus einer Maske ---------- */
  $$('.split-lines').forEach((el) => {
    splitWords(el, 'mask');
    gsap.from(el.querySelectorAll('.wi'), { yPercent: 110, duration: 1, stagger: 0.06, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ---------- Zähler ---------- */
  $$('[data-count]').forEach((el) => {
    const obj = { v: 0 }, end = +el.dataset.count, suf = el.dataset.suffix || '';
    gsap.to(obj, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(obj.v) + suf),
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.stat', { y: 40, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  /* ---------- Leistungen: Zeilen + Bild folgt dem Mauszeiger ---------- */
  gsap.from('.svc', { y: 50, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.svc-list', start: 'top 82%' } });
  const follower = $('.svc-follower'), fImg = follower.querySelector('img');
  if (window.matchMedia('(hover:hover) and (min-width:861px)').matches) {
    const xTo = gsap.quickTo(follower, 'x', { duration: 0.55, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: 0.55, ease: 'power3' });
    const rTo = gsap.quickTo(follower, 'rotation', { duration: 0.8, ease: 'power3' });
    let px = 0;
    window.addEventListener('mousemove', (e) => { xTo(e.clientX + 30); yTo(e.clientY - 120); rTo(gsap.utils.clamp(-8, 8, (e.clientX - px) * 0.6)); px = e.clientX; });
    $$('.svc').forEach((li) => {
      li.addEventListener('mouseenter', () => { fImg.src = li.dataset.img; gsap.to(follower, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }); });
      li.addEventListener('mouseleave', () => gsap.to(follower, { opacity: 0, scale: 0.6, duration: 0.3, ease: 'power3.in' }));
    });
  }

  /* ---------- Ablauf: horizontal scrollen (Desktop), gestapelt (mobil) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.process-track');
    const dist = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.process', pin: '.process-pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.6, invalidateOnRefresh: true } });
    gsap.to('.process-progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + dist(), scrub: true } });
    $$('.step-no').forEach((n) => gsap.from(n, { yPercent: 60, opacity: 0, ease: 'power3.out',
      scrollTrigger: { trigger: n.closest('.step'), containerAnimation: tween, start: 'left 85%', toggleActions: 'play none none reverse' } }));
  });
  mm.add('(max-width: 900px)', () => {
    document.documentElement.classList.add('no-pin');
    $$('.step').forEach((s) => gsap.from(s, { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 88%' } }));
    return () => document.documentElement.classList.remove('no-pin');
  });

  /* ---------- Über uns: Bild wird aufgedeckt + Parallaxe ---------- */
  gsap.fromTo('.clip-reveal', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut',
    scrollTrigger: { trigger: '.clip-reveal', start: 'top 80%' } });
  gsap.fromTo('.about-img img', { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.about-img', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.checks li, .quote', { x: -30, opacity: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.checks', start: 'top 85%' } });

  // Bildleiste läuft gegen die Scrollrichtung
  gsap.fromTo('.gallery-row', { x: () => window.innerWidth * 0.1 }, { x: () => -($('.gallery-row').scrollWidth - window.innerWidth * 0.9), ease: 'none',
    scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });

  /* ---------- Kontakt & FAQ ---------- */
  gsap.from('.form', { y: 80, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.form', start: 'top 85%' } });
  gsap.from('.contact dl > div, .hours-card', { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.contact dl', start: 'top 85%' } });
  gsap.from('details', { y: 30, opacity: 0, stagger: 0.07, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.faq-list', start: 'top 85%' } });

  /* ---------- Footer: Riesen-Schriftzug steigt auf ---------- */
  gsap.from('.foot-word span', { yPercent: 100, duration: 1.2, stagger: 0.12, ease: 'power4.out', scrollTrigger: { trigger: '.foot-word', start: 'top 95%' } });

  // Nach dem Laden der Bilder Positionen neu berechnen
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
