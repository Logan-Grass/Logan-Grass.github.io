# logangrass.com

Personal site of Logan Grass — systems & infrastructure. Live at <https://logangrass.com>.

Static single-page site with no build step, package dependencies, or framework. The HTML
is the canonical content source; CSS owns presentation, and vanilla JavaScript adds
progressive enhancement.

## Editing

| What | Where |
|---|---|
| Page content, links, metadata, and Formspree endpoint | `index.html` |
| Styles, responsive layout, print, and reduced motion | `styles.css` |
| Terminal, filters, map, form enhancement, and live status | `script.js` |
| Resume PDF & certificates | `assets/` |

The contact form posts directly to Formspree and is enhanced with inline status messages
when JavaScript is available. The map uses Leaflet + standard OpenStreetMap tiles,
styled dark with CSS and requiring no API key. Keep the visible attribution and
follow the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/):
allow browser caching and referrers, and do not prefetch or bulk-download tiles.
An OpenStreetMap link remains available if the map library or tiles fail to load.

Project diagrams use locally stored Lucide icons in `assets/icons/`, with their ISC
license included in that directory. They require no JavaScript or external icon service.

## Deploying

Push to `master` — the workflow in `.github/workflows/deploy.yml` publishes the repo
root to GitHub Pages. Nothing to build. Live in under a minute.

## Local preview

```powershell
npx -y http-server . -p 3000 -c-1
```

Open <http://localhost:3000>.

## Notes

- GitHub Pages can't set custom HTTP headers. If CSP/HSTS ever matters, front the
  site with Cloudflare (proxied DNS) and add headers there.
- If the headline or stats change, regenerate `assets/og-card.png` (1200×630) and run
  the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) to bust its
  preview cache.
