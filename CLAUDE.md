# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

- **Owner:** shawnE1976 — repo `shawnE1976.github.io` (GitHub Pages user site)
- **Live URL:** https://shawne1976.github.io
- Deployment is automatic on push to `main` — there is no CI, no build step, no package manager. Anything committed at the repo root is served as-is.

## What this repo is

A GitHub Pages site that hosts **PhenoMap** at the root (`/index.html`) plus a handful of unrelated static pages living alongside it:

- `/` — **PhenoMap**: a global UAP/UFO sighting map + database (the primary app).
- `/higgsfield/` — "HiggsField Hub", a separate AI-video-platform prototype that shares PhenoMap's shell structure (sidebar + panels + map). Self-contained: its own `index.html`, `app.js`, `data.js`, `style.css`, `manifest.json`. Treat as a separate app; do not share code between them.
- `/{chatorganizer-pro,focusflow-pro,snapfull-pro,summarizeai-pro}-privacy.html` — standalone privacy-policy pages for Chrome extensions. Unrelated to PhenoMap; edit only when asked.
- `Phenomap.com` — 1-byte leftover (previous CNAME experiment). Do not rely on it.

## Running locally

No build tools. Because `sw.js` registers at scope `/` and `manifest.json` uses `"start_url": "/"`, serve from the repo root over HTTP (opening `file://` will break the service worker and the ES fetch paths in `sw.js`):

```
python3 -m http.server 8000   # then open http://localhost:8000
```

For quick dev without PWA noise, unregister the service worker in DevTools → Application, or test in an incognito window — otherwise cached assets will mask edits.

## PhenoMap architecture

Vanilla HTML/CSS/JS, no framework, no bundler. Leaflet + MarkerCluster are loaded from unpkg CDN in `index.html`. Three files do all the work:

- `data.js` — exposes a global `const SIGHTINGS = [...]` array of ~30 hardcoded records (government + civilian). This is the seed dataset.
- `app.js` — all runtime logic. Depends on `SIGHTINGS` being defined globally (loaded first in `index.html`).
- `index.html` — single-page shell. Every "page" is a `<div class="panel">` toggled by `showPanel(name, btn)`; they are not routes. There is no router and no URL state.

### Data flow

All state is in-memory globals in `app.js`, hydrated from `localStorage` on `DOMContentLoaded`:

- `SIGHTINGS` (from `data.js`) + `userSightings` (from `localStorage['phenomap_user_sightings']`) are the two data sources. Almost every render function computes `[...SIGHTINGS, ...userSightings]` on the fly — there is no merged cache. If you add a new render path, follow the same pattern or you will miss user-submitted entries.
- `settings` — persisted at `localStorage['phenomap_settings']` via `saveSettings()`. Loaded but **not reapplied to the DOM** on startup — toggles read their own checked state when clicked, which is why reloading the page appears to "reset" visual settings even though the value was saved.
- `isPremium` — `localStorage['phenomap_premium'] === 'true'`. `activatePremium()` is the only writer and is not currently wired to any Stripe webhook; the Stripe link (`STRIPE_URL` constant at the top of `app.js`) just opens the checkout page.

### Sighting ID conventions (important)

Seed sightings in `data.js` use numeric `id` (e.g. `id: 1`). User-submitted sightings use `uid: Date.now()` instead, and are referenced throughout the UI as the string `"u" + uid`. `openModal(id)` branches on `typeof id === 'string' && id.startsWith('u')` — if you add new entry points (cards, popups, share links), match that convention or the modal lookup will silently fail.

### Filtering / rendering

- Map markers are built once by `buildMarkers()` into `allMarkers[]` with `marker._sightingData` attached. `applyFilters()` re-populates the cluster layer from `allMarkers` without rebuilding; `buildMarkers()` must be called any time the underlying data changes (e.g. after `handleSubmit()`).
- `renderSightingsList()`, `renderGovIncidents()`, `renderAnalytics()` each read the combined array directly and rebuild `innerHTML`. Any field used in these renderers must also be handled for user-submitted records (which lack `id`, `gov_ref`, etc.).
- `geoGuess()` / `geoGuessLng()` are a tiny hardcoded city → lat/lng lookup used as a fallback in the submit form. No real geocoder is wired up. Submissions without explicit lat/lng for unknown cities end up at `(0, 0)`.

### PWA / icons

- `sw.js` uses a network-first strategy with cache fallback and a hardcoded `CACHE_NAME = 'phenomap-v1'`. **Bump the version string whenever cached assets (`index.html`, `app.js`, `data.js`, `style.css`) change** or users will keep loading the old bundle.
- `manifest.json` references both PNG (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) and SVG icons; iOS needs the PNGs. Keep both in sync if regenerating.
- Service worker is registered from `index.html` with `navigator.serviceWorker.register('/sw.js')` — the absolute path matters; don't change it to `./sw.js` without also fixing scope.

### Styling

`style.css` is one file with CSS custom properties at `:root` (`--bg`, `--accent`, `--gov`, `--mil`, etc.). The "dark mode" toggle is a hack — `toggleDarkMode()` applies `filter: invert(0.85) hue-rotate(180deg)` to `<body>` rather than swapping the variables. Source-color mapping lives in two places that must stay aligned: `SOURCE_COLORS` in `app.js` and the `--gov`/`--mil`/`--civ`/`--aaro` variables in `style.css`.

## Conventions and gotchas

- Always use `escHtml()` when interpolating sighting fields into `innerHTML`. Many renderers build HTML strings directly from user-submitted data.
- Video URLs are normalized to embed form by `toEmbedUrl()` (YouTube watch/short, Vimeo, Rumble embed). Add new providers there, not at call sites.
- The paywall auto-opens 2.5s after load via `showPaywallDelayed()` unless `isPremium` is true. This is intentional — if you add new post-init UI, don't fight it.
- Don't add build tooling (webpack, Vite, npm scripts) without explicit instruction. The "no build" constraint is why this deploys instantly on GitHub Pages.
- When editing `higgsfield/`, treat it as a separate project: do not pull in PhenoMap's `data.js` or share state. The roadmap calls for it to move to its own repo eventually.

## Git workflow

- Default branch is `main`; GitHub Pages serves from it.
- Session work may happen on a `claude/...` feature branch — push to the branch specified by the task, not directly to `main`.
- Commit messages in history are short imperative sentences (e.g. "Fix iOS compatibility — PNG icons, viewport height, touch scrolling"). Match that style.

## Roadmap (priority order, from prior sessions)

1. PWA installable on iOS/Android — in progress (PNG icons + apple-touch-icon landed).
2. Move `/higgsfield/` to its own repo.
3. Real backend for accounts, DB, API (currently 100% frontend + localStorage).
4. Stripe subscription management (link-only today, no webhook / entitlement sync).
5. Live NUFORC / MUFON feeds instead of hardcoded `SIGHTINGS`.
6. Real push notifications for nearby sightings (requires backend).
7. App Store wrap via PWABuilder or Capacitor.

## Session notes

- 2026-04-08: Created CLAUDE.md, PWA setup for mobile install, cleaned `manifest.json`.
- 2026-04-?? (`36001ed`): iOS compatibility — PNG icons, `100dvh`, touch scrolling.
- 2026-04-?? (`d982212`): Added Chrome-extension privacy policy HTML pages at the repo root.
- 2026-04-16: Rewrote CLAUDE.md with architecture + local-dev notes.
