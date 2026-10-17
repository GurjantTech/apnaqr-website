/* Apna QR — Google AdSense banner slots.
   Ads stay switched off (slots hidden, no Google script loaded) until real IDs are set below.
   Set these only after your site is approved in AdSense. Never use AdMob (app) IDs here. */
(function () {
  'use strict';

  var ADSENSE = {
    // Your AdSense publisher ID: AdSense → Account → Settings → Account information.
    client: 'ca-pub-XXXXXXXXXXXXXXXX',
    // Display ad unit slot IDs: AdSense → Ads → By ad unit → Display ads (copy data-ad-slot).
    slots: {
      'below-generator': 'XXXXXXXXXX',
      'between-sections': 'XXXXXXXXXX'
    }
  };

  var CLIENT_RE = /^ca-pub-\d{16}$/;
  var SLOT_RE = /^\d{6,}$/;
  var LOADER = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=';

  if (!CLIENT_RE.test(ADSENSE.client)) return;

  var units = [];
  document.querySelectorAll('[data-ad-slot-key]').forEach(function (box) {
    var slot = ADSENSE.slots[box.getAttribute('data-ad-slot-key')];
    var ins = box.querySelector('ins.adsbygoogle');
    if (!ins || !SLOT_RE.test(slot || '')) return;
    ins.setAttribute('data-ad-client', ADSENSE.client);
    ins.setAttribute('data-ad-slot', slot);
    box.hidden = false;
    units.push({ box: box, ins: ins });
  });
  if (!units.length) return;

  // "Ad privacy choices" link in the footer reopens Google's consent message when one is configured.
  document.querySelectorAll('[data-ad-privacy]').forEach(function (link) {
    link.hidden = false;
    link.addEventListener('click', function (e) {
      if (window.googlefc && window.googlefc.callbackQueue && window.googlefc.showRevocationMessage) {
        e.preventDefault();
        window.googlefc.callbackQueue.push(window.googlefc.showRevocationMessage);
      }
    });
  });

  function hideAll() { units.forEach(function (u) { u.box.hidden = true; }); }

  function fill() {
    window.adsbygoogle = window.adsbygoogle || [];
    units.forEach(function (u) {
      if (u.ins.getAttribute('data-adsbygoogle-status')) return;
      try { window.adsbygoogle.push({}); } catch (e) { u.box.hidden = true; }
    });
  }

  // Load Google's script once, after the page (and the QR generator) has loaded.
  function load() {
    if (!document.querySelector('script[src^="' + LOADER + '"]')) {
      var s = document.createElement('script');
      s.async = true;
      s.src = LOADER + encodeURIComponent(ADSENSE.client);
      s.crossOrigin = 'anonymous';
      s.onerror = hideAll; // blocked or offline: collapse the slots instead of leaving gaps
      document.head.appendChild(s);
    }
    fill();
  }

  if (document.readyState === 'complete') load();
  else window.addEventListener('load', load, { once: true });
})();
