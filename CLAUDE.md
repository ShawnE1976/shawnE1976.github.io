# PhenoMap — Project Memory

> This file is read by Claude at the start of every session. Keep it updated.

## Owner
- **GitHub:** shawnE1976
- **Repo:** shawnE1976.github.io (GitHub Pages)
- **Live URL:** https://shawne1976.github.io

## What Is PhenoMap?
A **Global UAP Intelligence Platform** — an interactive map and database of UAP/UFO sightings sourced from government records (AARO, DoD, Project Blue Book), congressional testimony, and civilian reports (NUFORC, MUFON, community).

## Business Model
- **Free tier:** Global map, 30 key sightings, basic search/filters
- **Pro ($4.99/mo):** Real-time alerts, advanced analytics, data export, ad-free
- **Premium ($12.99/mo):** Historical NUFORC data, API access, custom alert zones, satellite overlay
- **Payments:** Stripe (link in app.js STRIPE_URL)

## Tech Stack
- **Frontend only** — vanilla HTML/CSS/JS, no build tools
- **Mapping:** Leaflet.js + MarkerCluster
- **Data:** Hardcoded in data.js (30 sightings)
- **Storage:** localStorage for user settings and user-submitted sightings
- **PWA:** manifest.json + service-worker.js for mobile install
- **Hosting:** GitHub Pages (free, HTTPS included)

## IMPORTANT: This Repo Is PhenoMap ONLY
**DO NOT add other projects (HiggsField, DockLedger, etc.) to this repo.**
Each project must have its own separate GitHub repository. If the user asks to build
something new, create a new repo for it — do not put it here.

## File Structure
```
/index.html          — Main app shell (sidebar, panels, paywall, modal)
/app.js              — App logic (map, filters, analytics, settings, paywall)
/data.js             — Sighting database (30 government + civilian records)
/style.css           — Full dark-theme UI
/manifest.json       — PWA manifest for mobile install
/sw.js               — Service worker for offline support
/icon-192.svg        — App icon 192x192
/icon-512.svg        — App icon 512x512
/cover.svg           — Marketing cover image
/thumbnail.svg       — Thumbnail asset
/CLAUDE.md           — This file (project memory)
```

## Key Features (Working)
- Interactive Leaflet map with clustered markers
- Filter by source, shape, year, status, video evidence
- Timeline slider for year-based filtering
- Sighting detail modals with embedded video
- Report submission form (saves to localStorage)
- Analytics dashboard (bar charts, donut chart)
- Government data sources page
- Settings panel (dark mode, clustering, notifications, data sources, export)
- Paywall with Free/Pro/Premium tiers
- Mobile responsive with hamburger menu
- CSV/JSON data export

## What Needs Work (Priority Order)
1. **PWA installable on iOS/Android** — needs service worker, proper icons, meta tags ← IN PROGRESS
2. ~~**Separate repos** — HiggsField should be its own repo, not a subfolder~~ ← DONE (2026-04-12)
3. **Real backend** — Currently all frontend; needs user accounts, real database, API
4. **Stripe integration** — Payment link exists but no subscription management
5. **Live data feeds** — Connect to NUFORC/MUFON APIs for real-time sightings
6. **Push notifications** — For nearby sighting alerts (needs backend)
7. **App Store listing** — Use PWABuilder or Capacitor to wrap for iOS/Android stores

## Other Projects (Separate Repos — NOT in this repo)
- **HiggsField Hub** — AI video intelligence platform → `ShawnE1976/higgsfield`
- **DockLedger** — Liveaboard marina companion (abandoned)

## Session Notes
- 2026-04-08: Created CLAUDE.md, fixed PWA setup for mobile install, cleaned up manifest.json
- 2026-04-12: Separated HiggsField into its own repo, added .gitignore, configured Blotato MCP integration
