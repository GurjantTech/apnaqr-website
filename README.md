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
assets/js/ads.js        AdSense config (publisher + slot IDs) and loader
CNAME, .nojekyll, ads.txt, app-ads.txt, robots.txt, sitemap.xml, manifest.webmanifest
```

The generator markup appears in both `index.html` and `create/index.html`, between `<!-- GENERATOR:START -->` and `<!-- GENERATOR:END -->`. If you change one copy, change the other too.

## Our apps

The "Our apps" cards in `index.html` link to the Play Store listings. Icons live in `assets/img/apps/` (192×192 WebP). To add an app, copy an `<li class="app-card">` block, set its `--accent` colour, icon, text and Play link.

## Replace the placeholders

| What | Where | How |
| --- | --- | --- |
| AdSense IDs | `assets/js/ads.js`, `index.html` meta tag, `ads.txt` | See [Google AdSense](#google-adsense-website-ads) below. |
| AdMob publisher ID | `app-ads.txt` | Replace `pub-XXXXXXXXXXXXXXXX` with your real ID from AdMob → Settings → Account information. |
| Support email | all `*.html` files | Currently `gtech10926@gmail.com`. To change it, search the HTML files for that address. |
| App screenshots | `assets/img/screens/` | `apnaqr-1.webp` to `apnaqr-3.webp` are Play Store screenshots (480×853) shown in the app promo card. If the listing changes, overwrite them with the same names and a 9:16 ratio, keeping each under 150 KB. Example: `cwebp -q 76 -resize 480 0 shot.png -o apnaqr-1.webp`. |

## Google AdSense (website ads)

The site has two banner slots, both switched **off** until you add real IDs: one below the QR generator (home and `/create/`) and one between "Our apps" and the FAQ (home only). While the IDs are placeholders, the slots stay hidden and Google's script never loads. Privacy, terms and the 404 page never show ads.

Do these steps only after Google approves apnaqr.in in AdSense. Use your **AdSense** publisher ID (`ca-pub-…`), never AdMob app IDs (`ca-app-pub-…`).

1. **Get approved.** In AdSense, add the site `apnaqr.in`. For ownership verification, use the meta tag (step 2) or `ads.txt` (step 3). Wait for approval.
2. **Meta tag.** In `index.html`, replace `ca-pub-XXXXXXXXXXXXXXXX` in `<meta name="google-adsense-account" …>` with your publisher ID.
3. **ads.txt.** In `/ads.txt`, replace `pub-XXXXXXXXXXXXXXXX` with your ID, without the `ca-` prefix. Keep `f08c47fec0942fa0`, which is Google's fixed certification ID. This file is separate from `app-ads.txt` (AdMob).
4. **Ad units.** In AdSense → Ads → By ad unit, create two **Display ads** set to *Responsive*. Copy each unit's `data-ad-slot` number.
5. **Config.** In `assets/js/ads.js`, set `client` to your `ca-pub-…` ID and paste the two slot numbers into `below-generator` and `between-sections`. A slot left as `XXXXXXXXXX` stays hidden.
6. **Consent (EEA, UK, Switzerland).** In AdSense → Privacy & messaging, create and publish a **European regulations** (GDPR) message, using Google's certified CMP. Optionally add the **US state regulations** message too. Google's script shows these automatically; no extra code is needed. The footer's "Ad privacy choices" link appears once ads are on, and reopens the consent message.
7. **Deploy.** Commit and push to `main`. Then check that `https://apnaqr.in/ads.txt` loads and that the ad boxes appear. New units can take a while to fill, and an unfilled unit hides itself.

Ad slots use Google's official responsive `<ins class="adsbygoogle">` markup. `ads.js` loads `adsbygoogle.js` once per page, after the page has loaded. Each slot carries an "Advertisement" label and sits well away from the QR preview, inputs and download buttons. Don't add slots inside the generator, and never ask visitors to click ads.

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
