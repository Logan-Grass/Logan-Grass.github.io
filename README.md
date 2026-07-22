# logangrass.com

Personal site of Logan Grass — systems & infrastructure. Live at <https://logangrass.com>.

Static single-page site: no build step, no dependencies, no framework. HTML, CSS, and a
little vanilla JS.

## Editing

| What | Where |
|---|---|
| Page content (experience, projects, stack, reviews) | `index.html` |
| Contact links & Formspree endpoint | `CONTACT` block at the top of `script.js` |
| Styles (incl. print + reduced-motion) | `styles.css` |
| Resume PDF & certificates | `assets/` |

The contact form relays through Formspree, so the email address never appears in the
page source. The map is Leaflet + CARTO tiles; the OSM/CARTO attribution is a license
requirement and stays.

## Deploying

Push to `master` — the workflow in `.github/workflows/deploy.yml` publishes the repo
root to GitHub Pages. Nothing to build. Live in under a minute.

## Local preview

```powershell
npx -y http-server -p 8080 -c-1
```

Open <http://localhost:8080>.

## Notes

- GitHub Pages can't set custom HTTP headers. If CSP/HSTS ever matters, front the
  site with Cloudflare (proxied DNS) and add headers there.
- If the headline or stats change, regenerate `assets/og-card.png` (1200×630) and run
  the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to bust its
  preview cache.
