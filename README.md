# logangrass.com

Logan Grass's personal portfolio — systems, infrastructure, and hands-on homelab engineering.
Live site: <https://logangrass.com>.

Static HTML, CSS, and vanilla JavaScript. No application dependencies, framework, or build step.
Core content, project details, downloads, and contact submission remain usable without JavaScript.

## Editing

| Content | File |
|---|---|
| Biography, projects, career history, metadata, and contact endpoint | `index.html` |
| Catppuccin Mocha palette, layout, responsive rules, print, and reduced motion | `styles.css` |
| Local-only terminal, interactive map, progressive enhancements, and contact feedback | `script.js` |
| Resume, certificates, social preview, and locally stored icons | `assets/` |
| Hero background: `assets/img/contours.svg`, faint contour lines (10% opacity, masked), not a grid | `assets/img/` |
| Tab icon: `favicon.svg` (a `>_` prompt drawn as shapes, no font), `favicon.ico`, `apple-touch-icon.png` | repository root |
| Public-safe source excerpts and provenance | `assets/evidence/` |
| Technical write-up (lab detail, field work, tools, all ticket responses, certificates) | `details.html` |
| Not-found page | `404.html` |
| Site integrity and public-content checks | `tests/test_site.py` |

### Design direction

Preserve the owner's coder-meets-IT identity: Mocha/lavender, terminal prompts, an interactive
Los Angeles map, and a personal operations-workbench feel. The original terminal and map are
intentional character, not clutter to replace with a generic editorial portfolio. Avoid
italic-serif marketing headlines and anonymous profile-card layouts. Improve hierarchy,
spacing, and navigation without removing personality.

The November 2026 pass applied the anti-template guidance from
[Impeccable](https://github.com/pbakaus/impeccable), then the owner asked for less text and
the AI agent work up front (2026-11-27). Every main-page section is a "scene", modelled on the
404 page the owner likes: a terminal line, one plain headline, a sentence or two, one picture
in the flow, and one action. Pictures alternate sides. The terminal and map are the only
boxed panels. Body text is 17px or larger and secondary text meets WCAG AA contrast on the
Mocha background. Do not reintroduce eyebrow labels or section numbers above headings, grids
of identical cards, fake window-control dots (also none inside the drawings), decorative glass
blur, glow, gradients on illustrations, one-sided accent bars, or a scroll-reveal animation on
every section. No robots, brains, sparkles or chatbot widgets for the AI story: it is told with
plain words, the scripted terminal exchange and one coordinator-to-agents-to-approval drawing.
`tests/test_site.py` guards the mechanical parts of this, including a word budget for the main page.

The main page stays short (under 1,000 visible words). Anything technical lives on
`details.html` ("the technical detail"): the lab diagrams and evidence, field work, the full tool list,
all thirteen ticket responses and certificate PDFs. History dates sit in the left column. The
hero terminal plays a short scripted agent exchange: static text in the HTML, revealed a line at a
time only when JavaScript is on and reduced motion is off, and labelled as a scripted example. No
model is called.

Lead with a clear professional introduction, then make the homelab a substantial engineering
showcase rather than an afterthought below the skills list. Professional client work and
personal projects are distinct. Use readable body text, progressive disclosure, accessible
controls, and layouts that work from small phones to wide desktops. Technical UI must be
functional and honest: no simulated live fleet health or fake telemetry.

The redesign's homelab copy describes documented work from October and November 2026, **not live telemetry**.
It covers infrastructure as code, automated guest monitoring, certificate-based access,
federated identity, observability, persistent-memory AI workflows, and the review gate that AI
coding agents and Renovate go through before a change merges. It deliberately avoids
volatile fleet counts and does not imply that off-host backups, disaster-recovery exercises,
or end-to-end alert delivery have been established.

When updating lab projects, verify the underlying work first. Publish architecture and
outcomes, not private addresses, guest IDs, internal service URLs, account identifiers,
credentials, or operational security gaps. Never turn historical observations into an
"all systems operational" badge.

Keep professional employment dates, certifications, testimonials, and claimed outcomes
consistent with the owner's source material. Do not update the resume PDF without reviewing
its content separately.

### Background and layout

The backdrop is a static Mocha gradient with restrained lavender/blue illumination, not a
repeating grid. Essential content stays visible without waiting for scroll-reveal callbacks.
The main page shows three ticket responses; `details.html` lists all thirteen, visible without JavaScript.
Grid children may shrink, and desktop navigation wraps when enlarged text needs more room.
The sticky header's full-width background is its own 100%-width box, not a `100vw`
pseudo-element: `100vw` includes desktop scrollbars and can make the page scroll sideways.
Test with visible scrollbars because default headless screenshots hide them.
Check work headings, ticket text and contact credentials at intermediate widths as well as
common device sizes; include 200% text enlargement rather than just checking page scroll width.

### Project evidence

The two source notes in `assets/evidence/` are exact selected excerpts from the owner's
private infrastructure source snapshot `6df1c56` (October 2026): the busy-guest selection
test and the managed-target identity/running/address guard. Their downloadable notes explain
omitted context and limitations. These are not screenshots, full source exports, or live
service-health results. Nine `NewGuestSelection` unit tests were run locally without
connecting to infrastructure; the site does not run those infrastructure tests for visitors.

Keep evidence truthful and inspect every addition for private addresses, identifiers,
hostnames, credential values and security-sensitive configuration. Publish only the minimum
necessary excerpt. Do not replace genuine evidence with staged dashboards or invented logs.

### Existing integrations

- Contact form posts to the existing Formspree endpoint. Native POST is the no-JavaScript
  fallback; JavaScript adds inline success/error feedback. Do not send test messages to
  the real endpoint during automated checks: intercept requests locally instead.
- Downloadable resume and certificates remain in `assets/`.
- The two inline contact icons are Lucide paths (ISC license).
- The terminal is a browser-only interaction with a fixed command vocabulary. Never execute
  input as JavaScript, send it to a shell, or insert it as untrusted HTML.
- Leaflet and OpenStreetMap provide the interactive city-level Los Angeles map. No user
  location permission is required. Retain attribution, a usable fallback link, and sensible
  behaviour if the CDN or tile network is unavailable. Follow the OpenStreetMap tile usage
  policy: https://operations.osmfoundation.org/policies/tiles/ (no bulk downloads/prefetch).
- JetBrains Mono is the only typeface, for all text (owner preference, confirmed
  2026-11-26). It is self-hosted in `assets/fonts/` under the SIL Open Font License (licence
  beside it); do not add a second typeface or load fonts from a third-party CDN.
- `assets/og-card.svg` is the editable source for the 1200×630 PNG social-sharing card.
- `assets/img/` holds the wordless line illustrations (WebP with alpha, each under 150 KB, 2–3
  widths for `srcset`). They were generated with an image model, cropped, and the background
  keyed out so they sit on the page's own Mocha base; lavender fills are softened. One style
  only: flat line work, Mocha slate and restrained lavender, no brown, no text or letters, no
  faces, no mascots, no robots or brains. Add new ones the same way, with `width`/`height`,
  `loading="lazy"` (the 404 image is the exception), and `alt=""` when they only decorate nearby text.
  `tests/test_site.py` checks size, format, attributes and that no unused files linger.

## Preview and checks

Serve the repository root:

```sh
python3 -m http.server 4173
```

Open <http://localhost:4173>.

Run the dependency-free integrity checks:

```sh
python3 -m unittest discover -s tests -v
```

Before publishing, also check desktop and mobile widths (320, 390, 768, 1024, and 1440px),
keyboard navigation, terminal commands and clickable shortcuts, compact mobile introduction,
feedback expansion/filter counts and print restoration, evidence excerpts/downloads,
map loading/reset and attribution, CDN/tile failures,
project disclosures, reduced motion, 200% text zoom, no-JavaScript content, and contact
success/error handling with mocked requests. Check for
horizontal overflow, browser errors, missing assets, and WCAG AA contrast with a browser
audit such as axe. Do not submit real contact messages during testing.

## Publishing

The workflow in `.github/workflows/deploy.yml` checks site integrity, then publishes the
repository root to GitHub Pages on pushes to `main` or `master`, or on manual dispatch.
The `CNAME` must remain `logangrass.com`; `.nojekyll` preserves plain static serving.

A feature-branch preview or local redesign is **not** a live deployment. Review the changes,
then merge/push using an authenticated GitHub account and verify the Pages workflow and
public site. Never assume a successful push means a completed deployment.

GitHub Pages cannot configure custom response headers. If the hosting layer changes,
review CSP and security headers there. If the professional title or hero changes, review
`assets/og-card.png` (1200×630) and metadata for consistency; social networks may cache it.
