# PhenoMap -- Project Memory

> This file is read by Claude at the start of every session. Keep it updated.

## Owner
- **GitHub:** ShawnE1976
- **Repo:** shawnE1976.github.io (GitHub Pages)
- **Live URL:** https://shawne1976.github.io
- **Default branch:** main

## What Is PhenoMap?
A **Global UAP Intelligence Platform** -- an interactive map and database of UAP/UFO sightings sourced from government records (AARO, DoD, Project Blue Book), congressional testimony, and civilian reports (NUFORC, MUFON, community).

## Business Model
- **Free tier:** Global map, 30 key sightings, basic search/filters
- **Pro ($4.99/mo):** Real-time alerts, advanced analytics, data export, ad-free
- **Premium ($12.99/mo):** Historical NUFORC data, API access, custom alert zones, satellite overlay
- **Payments:** Stripe (link in app.js `STRIPE_URL` constant, line 5)

## Tech Stack
- **Frontend only** -- vanilla HTML/CSS/JS, no build tools, no bundler, no framework
- **Mapping:** Leaflet.js 1.9.4 + MarkerCluster 1.5.3 (loaded from unpkg CDN)
- **Data:** Hardcoded `SIGHTINGS` array in data.js (30 records); user submissions stored in localStorage
- **Storage:** `localStorage` for settings (`phenomap_settings`), user sightings (`phenomap_user_sightings`), and premium status (`phenomap_premium`)
- **PWA:** manifest.json + sw.js (network-first caching strategy, cache name `phenomap-v1`)
- **Hosting:** GitHub Pages (free, HTTPS included)
- **No build step** -- edit files directly; changes go live on push to `main`

## File Structure
```
/index.html           -- Main app shell: sidebar, all panels, paywall overlay, modal (542 lines)
/app.js               -- All application logic: map, filters, analytics, settings, paywall (670 lines)
/data.js              -- Sighting database: SIGHTINGS array with 30 records (438 lines)
/style.css            -- Full dark-theme UI with CSS variables (889 lines)
/manifest.json        -- PWA manifest for mobile install
/sw.js                -- Service worker: network-first with cache fallback (49 lines)
/icon-192.png         -- App icon 192x192 (PNG, for PWA)
/icon-512.png         -- App icon 512x512 (PNG, for PWA)
/icon-192.svg         -- App icon SVG fallback
/icon-512.svg         -- App icon SVG fallback
/apple-touch-icon.png -- iOS home screen icon
/cover.svg            -- Marketing cover image
/thumbnail.svg        -- Thumbnail asset
/Phenomap.com         -- Empty placeholder file (vestigial from custom domain setup)
/CLAUDE.md            -- This file (project memory for AI assistants)
/higgsfield/          -- SEPARATE PROJECT (AI video platform) -- should be its own repo
```

## Architecture & Code Conventions

### HTML (index.html)
- Single-page app with panel-based navigation; all panels live in `<main id="main">`
- Panels: `panel-map`, `panel-sightings`, `panel-report`, `panel-analytics`, `panel-govdata`, `panel-settings`
- Sidebar navigation uses `onclick="showPanel('name', this)"` pattern
- CDN dependencies loaded via `<script>` tags at bottom: Leaflet, MarkerCluster, then data.js, then app.js
- Service worker registered inline at end of body

### JavaScript (app.js)
- All functions are global (no modules, no imports/exports)
- Entry point: `DOMContentLoaded` listener (line 22) calls all init functions
- Key globals: `map`, `markerCluster`, `allMarkers[]`, `userSightings[]`, `isPremium`, `settings`
- Source types: `gov`, `mil`, `civilian`, `aaro` -- mapped to colors in `SOURCE_COLORS` object
- Marker data attached to Leaflet markers via `marker._sightingData`
- HTML escaping done via `escHtml()` function -- used for all user-visible text
- Video URLs converted to embed URLs via `toEmbedUrl()` (supports YouTube, Vimeo, Rumble)
- Geocoding fallback: `geoGuess()` / `geoGuessLng()` use hardcoded city lookup table
- Analytics charts rendered as pure CSS bar charts and SVG donut chart (no charting library)

### Data (data.js)
- Exports a single `const SIGHTINGS` array
- Each sighting object has: `id`, `title`, `location`, `lat`, `lng`, `date` (YYYY-MM-DD), `source`, `status`, `description`, `videos[]`, `gov_ref`, `shape`, `duration`, `witnesses`
- IDs are sequential integers 1-30
- User-submitted sightings use `uid` (timestamp) instead of `id`, with `userSubmitted: true`

### CSS (style.css)
- Dark theme using CSS custom properties (`:root` variables)
- Key color variables: `--accent: #00d4ff`, `--bg: #080c18`, `--gov: #f59e0b`, `--mil: #ef4444`, `--civ: #22c55e`, `--aaro: #00d4ff`
- Layout: fixed sidebar (240px) + fluid main area
- Mobile responsive at 768px breakpoint (sidebar becomes slide-out overlay, top burger bar appears)
- iOS viewport compatibility: uses `100dvh` and `viewport-fit=cover`

### Service Worker (sw.js)
- Cache name: `phenomap-v1` -- bump this when deploying significant changes
- Strategy: network-first (try fetch, cache response, fall back to cache on failure)
- Only caches GET requests; skips cross-origin implicitly via cache-put behavior

## Development Workflow

### Local Development
```bash
# Any static file server works -- no build step needed
python3 -m http.server 8000
# or
npx serve .
```

### Deploying
Push to `main` branch. GitHub Pages auto-deploys from root of `main`.

### Adding a New Sighting
1. Add an object to the `SIGHTINGS` array in `data.js`
2. Use the next sequential `id` (currently next is 31)
3. Required fields: `id`, `title`, `location`, `lat`, `lng`, `date`, `source`, `status`, `description`
4. Optional fields: `videos[]`, `gov_ref`, `shape`, `duration`, `witnesses`
5. Valid `source` values: `gov`, `mil`, `civilian`, `aaro`
6. Valid `status` values: `verified`, `pending`

### Adding a New Panel/Page
1. Add a `<div id="panel-name" class="panel">` inside `<main>` in index.html
2. Add a `<button class="snav">` in the sidebar nav
3. Wire it with `onclick="showPanel('name', this)"`
4. Add any rendering logic to app.js

## Key Features (Working)
- Interactive Leaflet map with clustered markers
- Filter by source, shape, year, status, video evidence
- Timeline slider for year-based filtering
- Sighting detail modals with embedded video
- Report submission form (saves to localStorage)
- Analytics dashboard (bar charts, donut chart -- pure CSS/SVG, no library)
- Government data sources page
- Settings panel (dark mode, clustering, notifications, data sources, export)
- Paywall with Free/Pro/Premium tiers (auto-shows after 2.5s)
- Mobile responsive with hamburger menu
- CSV/JSON data export
- PWA installable (manifest + service worker + iOS meta tags)

## Known Limitations & Gotchas
- **No backend** -- all data is client-side; user submissions only persist in that browser's localStorage
- **Paywall is cosmetic** -- `isPremium` flag is stored in localStorage, trivially bypassable
- **Heatmap is approximate** -- uses large translucent circles instead of a real heatmap library; circles accumulate on toggle without cleanup
- **No real geocoding** -- `geoGuess()` only knows ~16 major cities for lat/lng fallback
- **Service worker cache** -- `ASSETS` array in sw.js lists SVG icons but PNG icons are actually used; update if adding new static assets
- **Phenomap.com file** -- empty placeholder from old CNAME setup; can be deleted
- **No tests** -- there is no test suite; verify changes manually in browser

## What Needs Work (Priority Order)
1. **Heatmap cleanup** -- toggling heatmap adds circles that never get removed
2. **Separate repos** -- HiggsField should be its own repo, not a subfolder
3. **Real backend** -- Currently all frontend; needs user accounts, real database, API
4. **Stripe integration** -- Payment link exists but no subscription management
5. **Live data feeds** -- Connect to NUFORC/MUFON APIs for real-time sightings
6. **Push notifications** -- For nearby sighting alerts (needs backend)
7. **App Store listing** -- Use PWABuilder or Capacitor to wrap for iOS/Android stores
8. **Service worker asset list** -- sw.js caches SVG icons but app uses PNG; sync the two

## Other Projects in This Repo
- **HiggsField Hub** (`/higgsfield/`) -- AI video intelligence platform; has its own index.html, app.js, data.js, style.css, manifest.json. Shares no code with PhenoMap. Should be moved to its own repository.

## Session Notes
- 2026-04-08: Created CLAUDE.md, fixed PWA setup for mobile install, cleaned up manifest.json
- 2026-04-09: iOS compatibility fix -- PNG icons, viewport height, touch scrolling
- 2026-04-16: Updated CLAUDE.md with comprehensive codebase documentation, architecture details, and development conventions
