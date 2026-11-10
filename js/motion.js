/* The Reef · v2 · появление блоков.
   Приёмы из референса: строки заголовков выезжают из-под маски, фото открываются шторкой снизу,
   списки и карточки идут каскадом. Быстрее референса (0.55–0.9 с против 1.1–2 с) и без «плавного» скролла.
   Без библиотек: классы + CSS-переходы (css/styles.css, раздел motion). */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('rv-ready');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* что и как анимируется */
  var SPLIT = '[data-split], .h2';
  var PHOTO = '.away__media, .included__media figure, .day__item figure, .kite__media, .tile, .zmap';
  var STAGGER = [
    '.sec-head', '.own__intro', '.final__body', '.offer__main', '.kite__foot',
    '.facts__list', '.cards4', '.units__track', '.counters', '.flow', '.guests', '.guests ul', '.why3', '.rates__table tbody', '.calc__steps',
    '.amen', '.wind', '.kite__points', '.points', '.bignums', '.why__lines', '.checklist', '.terms', '.netcard ul', '.eng__list',
    '.devnums', '.portfolio', '.stages__list', '.offer__figs', '.countdown__nums', '.steps', '.faq__list', '.checks'
  ].join(', ');

  /* ---------- счётчики ---------- */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count'));
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    if (reduce || isNaN(to) || el._counted) return;
    el._counted = true;
    var t0 = null, dur = 1100;
    el.textContent = (0).toFixed(dec);
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur);
      var v = to * (k === 1 ? 1 : 1 - Math.pow(2, -10 * k));
      el.textContent = v.toFixed(dec);
      if (k < 1) requestAnimationFrame(step); else el.textContent = to.toFixed(dec);
    }
    requestAnimationFrame(step);
  }

  /* ---------- разбивка заголовка на слова под маской ---------- */
  function split(el) {
    if (el.classList.contains('is-split')) return;
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach(function (tn) {
      if (!/\S/.test(tn.nodeValue)) return;
      var frag = document.createDocumentFragment();
      tn.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span'); w.className = 'w';
        var wi = document.createElement('span'); wi.className = 'wi'; wi.textContent = part;
        w.appendChild(wi); frag.appendChild(w);
      });
      tn.parentNode.replaceChild(frag, tn);
    });
    el.classList.add('is-split');
    lines(el);
  }
  /* номер строки для каждого слова: слова одной строки выезжают вместе, строки — лесенкой */
  function lines(el) {
    var top = null, n = -1;
    $$('.w', el).forEach(function (w) {
      var t = w.getBoundingClientRect().top;
      if (top === null || t - top > 4) { n++; top = t; }
      w.style.setProperty('--l', n);
    });
  }

  /* ---------- reduced motion или старый браузер: всё сразу ---------- */
  if (reduce || !hasIO) {
    $$('.reveal, .rv-stagger, [data-split], [data-hero-media]').forEach(function (el) { el.classList.add('is-in'); });
    $$('[data-split]').forEach(function (el) { el.classList.add('is-split'); });
    return;
  }

  /* ---------- раскладка классов ---------- */
  $$(STAGGER).forEach(function (el) {
    if (el.closest('.rv-photo')) return;
    el.classList.add('rv-stagger');
    el.classList.remove('reveal');
    Array.prototype.forEach.call(el.children, function (c, i) {
      c.classList.remove('reveal');
      c.style.setProperty('--i', Math.min(i, 10));
    });
  });
  $$(PHOTO).forEach(function (el) {
    el.classList.add('rv-photo');
    el.classList.remove('reveal');
  });
  $$(SPLIT).forEach(split);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { $$('.is-split:not(.is-in)').forEach(lines); });
  }

  /* ---------- первый экран: сразу после загрузки ---------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    var heroBody = hero.querySelector('.hero__body');
    if (heroBody) {
      heroBody.style.setProperty('--step', '90ms');
      heroBody.style.setProperty('--d', '.12s');
      Array.prototype.forEach.call(heroBody.children, function (c, i) { c.style.setProperty('--i', i); });
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        $$('[data-hero-media], .hero__body, .hero [data-split]', hero).forEach(function (el) { el.classList.add('is-in'); });
      });
    });
  }

  /* ---------- остальное: по мере прокрутки ---------- */
  var io = new IntersectionObserver(function (entries) {
    var batch = 0;
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      /* элементы, появившиеся одновременно (карточки в ряд), идут с шагом 80 мс */
      if (!el.matches('[data-split]') && !el.classList.contains('h2')) {
        el.style.setProperty('--d', (batch * 0.08).toFixed(2) + 's');
        batch++;
      }
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(countUp);
      if (el.hasAttribute('data-count')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0, rootMargin: '0px 0px -9% 0px' });

  $$('.reveal, .rv-stagger, .rv-photo, .h2, [data-split]').forEach(function (el) {
    if (el.closest('.hero')) return;
    io.observe(el);
  });
})();
