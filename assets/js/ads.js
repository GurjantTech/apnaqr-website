/* Apna QR — Google AdSense banner slots.
   The mode is picked from the hostname, so nothing has to be toggled before deploying:
   - production (apnaqr.in, www.apnaqr.in): real AdSense units, adsbygoogle.js loaded once
   - demo (localhost, 127.0.0.1, ::1, private LAN IPs): labelled placeholders, no request to Google
   - anything else (github.io previews, file://, unknown hosts): slots stay hidden, no request
   Never use AdMob (app) IDs here. */
(function () {
  'use strict';

  var ADSENSE = {
    client: 'ca-pub-2294761279203706',
    // Horizontal Display units only. data-ad-slot-key on each <aside class="ad-slot"> picks one.
    units: {
      'horizontal-1': { slot: '1993165487', label: 'Horizontal ad 1', sizes: { mobile: [320, 100], desktop: [728, 90] } },
      'horizontal-2': { slot: '1076678798', label: 'Horizontal ad 2', sizes: { mobile: [320, 100], desktop: [728, 90] } }
    }
  };

  var PRODUCTION_HOSTS = ['apnaqr.in', 'www.apnaqr.in'];
  var LOADER = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=';

  var host = location.hostname.toLowerCase();
  var isProduction = location.protocol === 'https:' && PRODUCTION_HOSTS.indexOf(host) !== -1;
  var isDemo = !isProduction && (
    host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1' ||
    /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host) // phone on the same Wi-Fi
  );
  if (!isProduction && !isDemo) return;

  var boxes = [];
  document.querySelectorAll('[data-ad-slot-key]').forEach(function (box) {
    var unit = ADSENSE.units[box.getAttribute('data-ad-slot-key')];
    var ins = box.querySelector('ins.adsbygoogle');
    if (unit && ins) boxes.push({ box: box, ins: ins, unit: unit });
  });
  if (!boxes.length) return;

  // "Ad privacy choices" in the footer reopens Google's consent message when one is configured;
  // otherwise it simply links to the ads section of the privacy policy.
  document.querySelectorAll('[data-ad-privacy]').forEach(function (link) {
    link.hidden = false;
    link.addEventListener('click', function (e) {
      if (window.googlefc && window.googlefc.callbackQueue && window.googlefc.showRevocationMessage) {
        e.preventDefault();
        window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);
      }
    });
  });

  if (isDemo) {
    document.documentElement.setAttribute('data-ad-mode', 'demo');
    boxes.forEach(function (b) {
      var demo = document.createElement('div');
      var m = b.unit.sizes.mobile, d = b.unit.sizes.desktop;
      demo.className = 'ad-demo';
      demo.setAttribute('role', 'note');
      demo.innerHTML =
        '<strong>Demo Ad — Not a real advertisement</strong>' +
        '<span>' + b.unit.label + ' · slot ' + b.unit.slot + '</span>' +
        '<span class="ad-demo__size" data-mobile="' + m[0] + ' × ' + m[1] + '" data-desktop="' + d[0] + ' × ' + d[1] + '"></span>';
      b.ins.hidden = true; // the real unit is never filled or pushed in demo mode
      b.box.querySelector('.ad-slot__box').appendChild(demo);
      b.box.hidden = false;
    });
    return;
  }

  // Production: fill in the real IDs, load Google's script once after the page has loaded.
  boxes.forEach(function (b) {
    b.ins.setAttribute('data-ad-client', ADSENSE.client);
    b.ins.setAttribute('data-ad-slot', b.unit.slot);
    b.box.hidden = false;
  });

  function hideAll() { boxes.forEach(function (b) { b.box.hidden = true; }); }

  function load() {
    if (!document.querySelector('script[src^="' + LOADER + '"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = LOADER + encodeURIComponent(ADSENSE.client);
      s.crossOrigin = 'anonymous';
      s.onerror = hideAll; // blocked or offline: collapse the slots instead of leaving gaps
      document.head.appendChild(s);
    }
    window.adsbygoogle = window.adsbygoogle || [];
    boxes.forEach(function (b) {
      if (b.ins.getAttribute('data-adsbygoogle-status')) return;
      try { window.adsbygoogle.push({}); } catch (e) { b.box.hidden = true; }
    });
  }

  if (document.readyState === 'complete') load();
  else window.addEventListener('load', load, { once: true });
})();
