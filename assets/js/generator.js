/* Apna QR — in-browser QR generator. Runs 100% client-side; nothing is sent anywhere.
   Payload formats mirror the app's QrPayloadBuilder so codes behave the same in both. */
(function () {
  'use strict';

  var host = document.querySelector('[data-generator]');
  if (!host || !window.ApnaQR) return;

  var LIB = '/assets/vendor/qr-code-styling-1.9.2.min.js';
  var APP_LOGO = '/assets/img/logo-mark.svg';

  var form = host.tagName === 'FORM' ? host : host.querySelector('form');
  var out = host.querySelector('[data-qr-out]');
  var warn = host.querySelector('[data-contrast-warn]');
  var errorEl = host.querySelector('[data-error]');
  var payloadEl = host.querySelector('[data-payload]');
  var shareBtn = host.querySelector('[data-share]');
  var downloadBtns = host.querySelectorAll('[data-download]');
  var logoRemove = host.querySelector('[data-logo-remove]');
  var logoLabel = host.querySelector('[data-logo-label]');
  var geoBtn = host.querySelector('[data-geo]');

  /* ---------- Payload builders (ported from QrPayloadBuilder.kt) ---------- */
  // Java's URLEncoder + replace("+", "%20"): also escapes ! ' ( ) ~ which encodeURIComponent leaves alone.
  function enc(s) {
    return encodeURIComponent(s).replace(/[!'()~]/g, function (c) {
      return '%' + c.charCodeAt(0).toString(16).toUpperCase();
    });
  }
  function cleanPhone(n) { return n.trim().replace(/[^0-9+]/g, ''); }
  function escMe(s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/:/g, '\\:').replace(/"/g, '\\"'); }
  function escV(s) { return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function blank(s) { return !s || !s.trim(); }

  var build = {
    url: function (v) {
      var t = v.url.trim();
      if (!t) throw new Error('Add a link to get your QR.');
      return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(t) ? t : 'https://' + t;
    },
    wifi: function (v) {
      if (blank(v.ssid)) throw new Error('Add the Wi-Fi network name.');
      var s = 'WIFI:T:' + v.security + ';S:' + escMe(v.ssid) + ';';
      if (v.security !== 'nopass') s += 'P:' + escMe(v.password) + ';';
      if (v.hidden) s += 'H:true;';
      return s + ';';
    },
    whatsapp: function (v) {
      var digits = v.waNumber.replace(/\D/g, '');
      if (!digits) throw new Error('Add a WhatsApp number with country code.');
      return 'https://wa.me/' + digits + (blank(v.waMessage) ? '' : '?text=' + enc(v.waMessage));
    },
    upi: function (v) {
      if (!/^[^@\s]+@[^@\s]+$/.test(v.vpa.trim())) throw new Error('Add a valid UPI ID, like name@okbank.');
      if (!blank(v.amount) && !/^\d+(\.\d{1,2})?$/.test(v.amount.trim())) throw new Error('Amount should look like 50 or 49.99.');
      var s = 'upi://pay?pa=' + enc(v.vpa.trim());
      if (!blank(v.payee)) s += '&pn=' + enc(v.payee.trim());
      if (!blank(v.amount)) s += '&am=' + v.amount.trim();
      if (!blank(v.note)) s += '&tn=' + enc(v.note.trim());
      return s + '&cu=INR';
    },
    text: function (v) {
      if (blank(v.text)) throw new Error('Type something to share.');
      return v.text;
    },
    phone: function (v) {
      var n = cleanPhone(v.phone);
      if (!n) throw new Error('Add a phone number.');
      return 'tel:' + n;
    },
    email: function (v) {
      if (blank(v.emailTo)) throw new Error('Add an email address.');
      var params = [];
      if (!blank(v.emailSubject)) params.push('subject=' + enc(v.emailSubject));
      if (!blank(v.emailBody)) params.push('body=' + enc(v.emailBody));
      return 'mailto:' + v.emailTo.trim() + (params.length ? '?' + params.join('&') : '');
    },
    sms: function (v) {
      var n = cleanPhone(v.smsNumber);
      if (!n) throw new Error('Add a phone number.');
      return blank(v.smsMessage) ? 'SMSTO:' + n : 'SMSTO:' + n + ':' + v.smsMessage;
    },
    contact: function (v) {
      if (blank(v.cName)) throw new Error('Add a name for the contact.');
      var name = v.cName.trim();
      var parts = name.split(/\s+/);
      var last = parts.length > 1 ? parts[parts.length - 1] : '';
      var first = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0];
      var s = 'BEGIN:VCARD\nVERSION:3.0\n';
      s += 'N:' + escV(last) + ';' + escV(first) + ';;;\n';
      s += 'FN:' + escV(name) + '\n';
      if (!blank(v.cOrg)) s += 'ORG:' + escV(v.cOrg) + '\n';
      if (!blank(v.cPhone)) s += 'TEL;TYPE=CELL:' + cleanPhone(v.cPhone) + '\n';
      if (!blank(v.cEmail)) s += 'EMAIL:' + v.cEmail.trim() + '\n';
      if (!blank(v.cAddress)) s += 'ADR:;;' + escV(v.cAddress) + ';;;;\n';
      if (!blank(v.cWebsite)) s += 'URL:' + v.cWebsite.trim() + '\n';
      return s + 'END:VCARD';
    },
    location: function (v) {
      var lat = v.lat.trim(), lng = v.lng.trim();
      var la = Number(lat), ln = Number(lng);
      if (!lat || !lng || isNaN(la) || isNaN(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) {
        throw new Error('Add a latitude (−90 to 90) and longitude (−180 to 180).');
      }
      return 'geo:' + lat + ',' + lng + (blank(v.geoLabel) ? '' : '?q=' + lat + ',' + lng + '(' + enc(v.geoLabel) + ')');
    }
  };

  /* ---------- Templates (same as QrTemplates in the app) ---------- */
  var TEMPLATES = {
    brand:    { fg: '#2D67E8', bg: '#FFFFFF', eye: '#0A1F66', dot: 'classy-rounded', eyeStyle: 'rounded', logo: true },
    classic:  { fg: '#111827', bg: '#FFFFFF', dot: 'square', eyeStyle: 'square' },
    ocean:    { fg: '#1E3A8A', g2: '#2D67E8', bg: '#FFFFFF', eye: '#1E3A8A', dot: 'classy-rounded', eyeStyle: 'rounded' },
    sunset:   { fg: '#B91C1C', g2: '#C2410C', bg: '#FFFBF5', eye: '#9A3412', dot: 'dots', eyeStyle: 'circle' },
    forest:   { fg: '#065F46', g2: '#047857', bg: '#F0FDF4', dot: 'rounded', eyeStyle: 'rounded' },
    royal:    { fg: '#4C1D95', g2: '#7C3AED', bg: '#FFFFFF', eye: '#4C1D95', dot: 'classy-rounded', eyeStyle: 'circle', logo: true },
    midnight: { fg: '#0F172A', bg: '#FFFFFF', eye: '#2D67E8', dot: 'dots', eyeStyle: 'rounded' },
    candy:    { fg: '#BE185D', g2: '#7E22CE', bg: '#FFF7FB', dot: 'rounded', eyeStyle: 'circle' }
  };

  var EYES = {
    square: { outer: 'square', inner: 'square' },
    rounded: { outer: 'extra-rounded', inner: 'rounded' },
    circle: { outer: 'dot', inner: 'dot' }
  };

  var userLogo = null;   // data: URL from FileReader, never uploaded
  var templateLogo = false;
  var qr = null;
  var lastPayload = '';
  var downloaded = false;

  function el(name) { return form.elements[name]; }
  function val(name) { return el(name).value; }
  function radio(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ''; }
  function setRadio(name, value) { var r = form.querySelector('input[name="' + name + '"][value="' + value + '"]'); if (r) r.checked = true; }

  /* ---------- Contrast (WCAG relative luminance) ---------- */
  function lum(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (c) {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }).reduce(function (sum, c, i) { return sum + c * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function ratio(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }

  /* ---------- Options ---------- */
  function fillFor(c1, c2) {
    return c2
      ? { gradient: { type: 'linear', rotation: Math.PI / 4, colorStops: [{ offset: 0, color: c1 }, { offset: 1, color: c2 }] } }
      : { color: c1 };
  }

  function styleState() {
    var gradient = radio('fill') === 'gradient';
    var match = el('eyeMatch').checked;
    return {
      fg1: val('fg1'),
      fg2: gradient ? val('fg2') : null,
      eye: match ? null : val('eyeColor'),
      bg: val('bg'),
      dot: radio('dot'),
      eyeStyle: radio('eye'),
      logo: userLogo || (templateLogo ? APP_LOGO : null)
    };
  }

  // qr-code-styling's bundled encoder keeps only the low byte of each char, which garbles
  // Hindi, emoji etc. Hand it the UTF-8 bytes as a binary string so byte mode stores real UTF-8.
  function utf8(str) {
    var bytes = new TextEncoder().encode(str);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
    return out;
  }

  function options(data, s, size, margin, type) {
    var dots = fillFor(s.fg1, s.fg2);
    var eyes = s.eye ? { color: s.eye } : fillFor(s.fg1, s.fg2);
    var eye = EYES[s.eyeStyle] || EYES.square;
    return {
      type: type,
      width: size,
      height: size,
      margin: margin,
      data: utf8(data),
      qrOptions: { mode: 'Byte', errorCorrectionLevel: s.logo ? 'H' : 'Q' },
      image: s.logo || undefined,
      dotsOptions: Object.assign({ type: s.dot }, dots),
      cornersSquareOptions: Object.assign({ type: eye.outer }, eyes),
      cornersDotOptions: Object.assign({ type: eye.inner }, eyes),
      backgroundOptions: { color: s.bg },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.26, margin: 3, crossOrigin: 'anonymous' }
    };
  }

  function values() {
    var v = {};
    Array.prototype.forEach.call(form.elements, function (f) {
      if (!f.name || f.type === 'radio' || f.type === 'file') return;
      v[f.name] = f.type === 'checkbox' ? f.checked : f.value;
    });
    return v;
  }

  function setBusy(disabled) {
    downloadBtns.forEach(function (b) { b.disabled = disabled; });
    if (shareBtn) shareBtn.disabled = disabled;
  }

  /* ---------- Render ---------- */
  function render() {
    var type = radio('qr-type');
    var s = styleState();
    var data;

    try {
      data = build[type](values());
      errorEl.hidden = true;
    } catch (e) {
      errorEl.textContent = e.message;
      errorEl.hidden = false;
      setBusy(true);
      return;
    }

    var worst = Math.min(ratio(s.fg1, s.bg), s.fg2 ? ratio(s.fg2, s.bg) : 99, s.eye ? ratio(s.eye, s.bg) : 99);
    warn.hidden = worst >= 3;
    payloadEl.textContent = data;
    lastPayload = data;
    out.setAttribute('aria-label', 'QR code preview for: ' + data.slice(0, 120));

    if (!window.QRCodeStyling) return;
    try {
      var opts = options(data, s, 320, 12, 'svg');
      if (!qr) {
        qr = new window.QRCodeStyling(opts);
        out.textContent = '';
        qr.append(out);
      } else {
        qr.update(opts);
      }
      setBusy(false);
    } catch (e) {
      errorEl.textContent = 'That is too much for one QR. Try shorter text.';
      errorEl.hidden = false;
      setBusy(true);
    }
  }

  var timer;
  function queueRender() { clearTimeout(timer); timer = setTimeout(render, 90); }

  /* ---------- Controls ---------- */
  function showFields() {
    var type = radio('qr-type');
    host.querySelectorAll('[data-fields]').forEach(function (g) { g.hidden = g.getAttribute('data-fields') !== type; });
  }

  function syncStyleControls() {
    var gradient = radio('fill') === 'gradient';
    host.querySelectorAll('[data-grad-only]').forEach(function (n) { n.hidden = !gradient; });
    el('eyeColor').disabled = el('eyeMatch').checked;
    el('eyeColor').closest('.color').style.opacity = el('eyeMatch').checked ? '.5' : '';
    var hasLogo = !!(userLogo || templateLogo);
    logoRemove.hidden = !hasLogo;
    logoLabel.textContent = userLogo ? 'Change logo' : 'Add your logo';
  }

  function markTemplate(name) {
    host.querySelectorAll('[data-template]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-template') === name));
    });
  }

  function applyTemplate(name) {
    var t = TEMPLATES[name];
    if (!t) return;
    el('fg1').value = t.fg;
    el('fg2').value = t.g2 || t.fg;
    setRadio('fill', t.g2 ? 'gradient' : 'solid');
    el('bg').value = t.bg;
    el('eyeMatch').checked = !t.eye;
    el('eyeColor').value = t.eye || t.fg;
    setRadio('dot', t.dot);
    setRadio('eye', t.eyeStyle);
    templateLogo = !!t.logo;
    markTemplate(name);
    syncStyleControls();
    queueRender();
  }

  host.querySelectorAll('[data-template]').forEach(function (b) {
    b.addEventListener('click', function () { applyTemplate(b.getAttribute('data-template')); });
  });

  form.addEventListener('input', function (e) {
    var name = e.target.name;
    if (name === 'qr-type') showFields();
    if (['fg1', 'fg2', 'eyeColor', 'bg', 'dot', 'eye', 'fill', 'eyeMatch'].indexOf(name) !== -1) markTemplate(null);
    syncStyleControls();
    queueRender();
  });
  form.addEventListener('change', function (e) {
    if (e.target.name === 'qr-type') { showFields(); queueRender(); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  // Logo: read locally with FileReader, never uploaded.
  el('logo').addEventListener('change', function () {
    var file = this.files && this.files[0];
    if (!file) return;
    if (!/^image\//.test(file.type) || file.size > 3 * 1024 * 1024) {
      errorEl.textContent = 'Pick a PNG, JPG, WebP or SVG under 3 MB.';
      errorEl.hidden = false;
      return;
    }
    var reader = new FileReader();
    reader.onload = function () { userLogo = reader.result; syncStyleControls(); queueRender(); };
    reader.readAsDataURL(file);
  });
  logoRemove.addEventListener('click', function () {
    userLogo = null;
    templateLogo = false;
    el('logo').value = '';
    markTemplate(null);
    syncStyleControls();
    queueRender();
  });

  if (geoBtn) {
    if (!('geolocation' in navigator)) geoBtn.hidden = true;
    geoBtn.addEventListener('click', function () {
      geoBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(function (pos) {
        el('lat').value = pos.coords.latitude.toFixed(6);
        el('lng').value = pos.coords.longitude.toFixed(6);
        geoBtn.disabled = false;
        queueRender();
      }, function () {
        geoBtn.disabled = false;
        errorEl.textContent = 'Could not get your location. Type it in instead.';
        errorEl.hidden = false;
      }, { enableHighAccuracy: true, timeout: 10000 });
    });
  }

  /* ---------- Export ---------- */
  function exporter(ext) {
    var o = options(lastPayload, styleState(), 1024, 48, ext === 'svg' ? 'svg' : 'canvas');
    return new window.QRCodeStyling(o);
  }

  function celebrate() {
    if (downloaded) return;
    downloaded = true;
    window.ApnaQR.confetti();
  }

  downloadBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (!window.QRCodeStyling || !lastPayload) return;
      var ext = btn.getAttribute('data-download');
      exporter(ext).download({ name: 'apnaqr-' + radio('qr-type'), extension: ext }).then(celebrate, function () {});
    });
  });

  if (shareBtn && navigator.share && navigator.canShare) {
    shareBtn.hidden = false;
    shareBtn.addEventListener('click', function () {
      if (!window.QRCodeStyling || !lastPayload) return;
      exporter('png').getRawData('png').then(function (blob) {
        var file = new File([blob], 'apnaqr-' + radio('qr-type') + '.png', { type: 'image/png' });
        var data = navigator.canShare({ files: [file] })
          ? { files: [file], title: 'My QR code', text: 'Made with apnaqr.in' }
          : { title: 'Apna QR', text: 'Make your own QR at', url: 'https://apnaqr.in/create/' };
        return navigator.share(data);
      }).catch(function () { /* user cancelled */ });
    });
  }

  /* ---------- Boot ---------- */
  setBusy(true);
  showFields();
  applyTemplate('brand');
  render();

  function boot() {
    window.ApnaQR.loadScript(LIB).then(render).catch(function () {
      errorEl.textContent = 'The QR maker could not load. Check your connection and refresh.';
      errorEl.hidden = false;
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); boot(); }
    }, { rootMargin: '800px 0px' });
    io.observe(host);
  } else {
    boot();
  }
  form.addEventListener('focusin', boot, { once: true });
})();
