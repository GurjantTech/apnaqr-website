# apnaqr.in

Official website for **Apna QR** (Android, `com.app.apnaqrscanner`). The homepage leads with a free in-browser QR generator, then promotes the scanner app and our other apps. It also hosts the privacy policy and terms linked from Play Console.

Pure static HTML, CSS and vanilla JS with no build step. GitHub Pages serves the `main` branch root as-is.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Use a local server rather than opening the files directly: the site uses root-relative paths (`/assets/...`), and the generator loads its library on demand.

## Structure

```
index.html              Home: QR generator first, then the Apna QR app, our apps and FAQ
create/index.html       Standalone QR generator
privacy.html            Privacy policy (link this in Play Console)
terms.html              Terms of use
404.html                Not-found page (GitHub Pages serves it automatically)
assets/css/styles.css   Design tokens (light/dark) + all components
assets/js/main.js       Theme toggle, nav, scroll reveal, magnetic buttons, confetti
assets/js/generator.js  QR generator (payloads mirror the app's QrPayloadBuilder.kt)
assets/vendor/          qr-code-styling 1.9.2, with licence
assets/img/             Icons, logos (SVG), OG image, app icons (apps/), Play Store screenshots used in the app promo (screens/)
assets/js/ads.js        AdSense units, hostname-based demo/production mode, loader
CNAME, .nojekyll, ads.txt, app-ads.txt, robots.txt, sitemap.xml, manifest.webmanifest
```

The generator markup appears in both `index.html` and `create/index.html`, between `<!-- GENERATOR:START -->` and `<!-- GENERATOR:END -->`. If you change one copy, change the other too.

## Our apps

The "Our apps" cards in `index.html` link to the Play Store listings. Icons live in `assets/img/apps/` (192×192 WebP). To add an app, copy an `<li class="app-card">` block, set its `--accent` colour, icon, text and Play link.

## Replace the placeholders

| What | Where | How |
| --- | --- | --- |
| AdMob publisher ID | `app-ads.txt` | Replace `pub-XXXXXXXXXXXXXXXX` with your real ID from AdMob → Settings → Account information. |
| Support email | all `*.html` files | Currently `gtech10926@gmail.com`. To change it, search the HTML files for that address. |
| App screenshots | `assets/img/screens/` | `apnaqr-1.webp` to `apnaqr-3.webp` are Play Store screenshots (480×853) shown in the app promo card. If the listing changes, overwrite them with the same names and a 9:16 ratio, keeping each under 150 KB. Example: `cwebp -q 76 -resize 480 0 shot.png -o apnaqr-1.webp`. |

## Google AdSense (website ads)

Publisher ID `ca-pub-2294761279203706` is set in `assets/js/ads.js`, the `google-adsense-account` meta tag in `index.html`, and `ads.txt`. The site uses only two horizontal Display units:

| Unit | Slot ID | Where | Sizes (mobile / desktop) |
| --- | --- | --- | --- |
| Horizontal ad 1 | `1993165487` | Below the QR generator (home and `/create/`) | 320×100 / 728×90 |
| Horizontal ad 2 | `1076678798` | Between "Our apps" and the FAQ (home only) | 320×100 / 728×90 |

`ads.js` picks the mode from the hostname, so nothing needs toggling before you deploy:

- **Production:** `https://apnaqr.in` and `https://www.apnaqr.in`. Fills the real units and loads `adsbygoogle.js` once per page, after page load.
- **Demo:** `localhost`, `127.0.0.1` and private LAN IPs (e.g. `192.168.x.x`). Shows dashed "Demo Ad — Not a real advertisement" boxes with the same size and placement. Nothing is requested from Google.
- **Anything else:** `*.github.io`, `file://`, plain `http://`. No ads and no requests.

Privacy, terms and the 404 page never show ads.

### Preview ad placements locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` and scroll below the generator for horizontal ad 1, and below "Our apps" for horizontal ad 2. To check other widths, use your browser's device toolbar (Ctrl+Shift+M in Chrome or Firefox): try 360px (mobile) and 1280px or wider (desktop). The size label in each box switches at 768px. To preview on your phone, open `http://<your-computer's-LAN-IP>:8000` on the same Wi-Fi.

### Before real ads can show

1. Google must approve `apnaqr.in` in AdSense. Until then the production boxes may stay empty, and an unfilled unit hides itself.
2. Check that `https://apnaqr.in/ads.txt` is reachable after deploying.
3. In AdSense → Privacy & messaging, publish the **European regulations** (GDPR) message, and optionally the US state regulations message. Google's script shows it automatically. The footer link "Ad privacy choices" reopens it.
4. To change units later, edit only the `ADSENSE` object at the top of `assets/js/ads.js`. Never use AdMob (`ca-app-pub-…`) IDs there.

## Host on GitHub Pages with apnaqr.in

1. Push this folder to the repo root on `main`. `CNAME` (containing `apnaqr.in`) and an empty `.nojekyll` are already included.
2. At your domain registrar, add these DNS records:

   | Type | Host | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | YOUR_USERNAME.github.io |

3. In the repo, open **Settings → Pages**:
   - Source: **Deploy from a branch**, branch `main`, folder `/ (root)`
   - Custom domain: `apnaqr.in`, then save
   - Once the DNS check passes and the certificate is issued (this can take up to an hour), tick **Enforce HTTPS**.
4. In Play Console, set the developer website to `https://apnaqr.in` and the privacy policy URL to `https://apnaqr.in/privacy.html`. AdMob then crawls `https://apnaqr.in/app-ads.txt`.

### Check after deploying

All of these should load over HTTPS:

- https://apnaqr.in
- https://www.apnaqr.in (redirects to the apex domain)
- https://apnaqr.in/privacy.html
- https://apnaqr.in/app-ads.txt
- https://apnaqr.in/create/
- https://apnaqr.in/some-random-page (shows the custom 404)

## Notes

- **Theme:** follows the system light/dark setting. The toggle saves the visitor's choice in `localStorage` under `apnaqr-theme`.
- **Motion:** all animation is turned off under `prefers-reduced-motion`.
- **Fonts:** Poppins and Inter are the only assets loaded from a CDN (Google Fonts). Everything else is self-hosted.
- **Payload formats** match the app exactly. For example, Wi-Fi adds `H:true;` only for hidden networks, and UPI puts `cu=INR` last.
