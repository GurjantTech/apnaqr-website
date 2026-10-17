# apnaqr.in

Official website for **Apna QR Scanner** (Android, `com.app.apnaqrscanner`): landing page, a free in-browser QR generator, and the privacy policy and terms linked from Play Console.

Pure static HTML, CSS and vanilla JS with no build step. GitHub Pages serves the `main` branch root as-is.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Use a local server rather than opening the files directly: the site uses root-relative paths (`/assets/...`), and the generator loads its library on demand.

## Structure

```
index.html              Home (hero, features, generator, apps, FAQ)
create/index.html       Standalone QR generator
privacy.html            Privacy policy (link this in Play Console)
terms.html              Terms of use
404.html                Not-found page (GitHub Pages serves it automatically)
assets/css/styles.css   Design tokens (light/dark) + all components
assets/js/main.js       Theme toggle, nav, scroll reveal, tilt/magnetic, Lottie, confetti
assets/js/generator.js  QR generator (payloads mirror the app's QrPayloadBuilder.kt)
assets/vendor/          qr-code-styling 1.9.2, lottie-web 5.12.2 (light), with licences
assets/lottie/          Lottie animations copied from the app
assets/img/             Icons, logos (SVG), OG image, app icons, screenshot placeholders
CNAME, .nojekyll, app-ads.txt, robots.txt, sitemap.xml, manifest.webmanifest
```

The generator markup appears in both `index.html` and `create/index.html`, between `<!-- GENERATOR:START -->` and `<!-- GENERATOR:END -->`. If you change one copy, change the other too.

## Replace the placeholders

| What | Where | How |
| --- | --- | --- |
| AdMob publisher ID | `app-ads.txt` | Replace `pub-XXXXXXXXXXXXXXXX` with your real ID from AdMob → Settings → Account information. |
| Support email | all `*.html` files | Search for `support@apnaqr.in` and replace it if you use a different address. Make sure the mailbox exists. |
| App screenshots | `assets/img/screens/` | Overwrite `scan.webp`, `create.webp`, `styles.webp` and `history.webp`. Keep the same names and a 360×780 size (or any 9:19.5 ratio) and keep each file under 150 KB. Example: `cwebp -q 78 -resize 360 0 shot.png -o scan.webp`. |

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
