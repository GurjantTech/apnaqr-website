/* Apna QR — site interactions (theme, nav, reveal, motion polish, Lottie, confetti). */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  var THEME_KEY = 'apnaqr-theme';

  function loadScript(src) {
    loadScript.cache = loadScript.cache || {};
    if (!loadScript.cache[src]) {
      loadScript.cache[src] = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    return loadScript.cache[src];
  }

  /* ---------- Theme ---------- */
  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return darkQuery.matches ? 'dark' : 'light';
  }

  function syncThemeButtons() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    });
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
      syncThemeButtons();
    });
  });
  if (darkQuery.addEventListener) darkQuery.addEventListener('change', syncThemeButtons);
  syncThemeButtons();

  /* ---------- Nav ---------- */
  var nav = document.querySelector('[data-nav]');
  var menuBtn = document.querySelector('[data-menu-toggle]');
  var links = document.getElementById('nav-links');

  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function setMenu(open) {
    if (!menuBtn || !links) return;
    links.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  if (menuBtn && links) {
    menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (links.classList.contains('is-open') && !links.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Pointer polish (desktop only) ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    // Hero cursor-follow glow
    var hero = document.querySelector('[data-hero]');
    if (hero) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
        hero.classList.add('is-pointer');
      });
      hero.addEventListener('pointerleave', function () { hero.classList.remove('is-pointer'); });
    }

    // Magnetic CTAs
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.25;
        var y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });

    // Bento hover tilt
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--rx', (py * -5).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.removeProperty('--rx');
        el.style.removeProperty('--ry');
      });
    });
  }

  /* ---------- Lottie (lazy) ---------- */
  var lottieEls = document.querySelectorAll('[data-lottie]');
  if (lottieEls.length && 'IntersectionObserver' in window) {
    var lottieObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        lottieObserver.unobserve(el);
        loadScript('/assets/vendor/lottie-light-5.12.2.min.js').then(function () {
          var anim = window.lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: true,
            autoplay: !reduceMotion.matches,
            path: el.getAttribute('data-lottie'),
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
          });
          if (reduceMotion.matches) {
            anim.addEventListener('DOMLoaded', function () { anim.goToAndStop(anim.totalFrames / 2, true); });
          }
        }).catch(function () { /* decorative only */ });
      });
    }, { rootMargin: '200px 0px' });
    lottieEls.forEach(function (el) { lottieObserver.observe(el); });
  }

  /* ---------- Confetti ---------- */
  function confetti() {
    var canvas = document.querySelector('[data-confetti]');
    if (!canvas || reduceMotion.matches) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.width = window.innerWidth * dpr;
    var h = canvas.height = window.innerHeight * dpr;
    var colors = ['#2D67E8', '#4F46E5', '#93C5FD', '#0E9F6E', '#DB2777', '#CA8A04', '#7C3AED'];
    var pieces = [];
    for (var i = 0; i < 140; i++) {
      pieces.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.2,
        y: h * 0.55,
        vx: (Math.random() - 0.5) * 16 * dpr,
        vy: (-Math.random() * 16 - 8) * dpr,
        s: (Math.random() * 6 + 5) * dpr,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        c: colors[i % colors.length]
      });
    }
    var start = performance.now();
    (function frame(now) {
      var t = now - start;
      ctx.clearRect(0, 0, w, h);
      pieces.forEach(function (p) {
        p.vy += 0.45 * dpr;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 2200);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
        ctx.restore();
      });
      if (t < 2200) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    })(start);
  }

  window.ApnaQR = { loadScript: loadScript, confetti: confetti, reduceMotion: reduceMotion };
})();
