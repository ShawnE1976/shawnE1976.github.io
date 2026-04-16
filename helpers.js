// ============================================================
//  PhenoMap — Pure helper functions
//  Loaded as a plain script in the browser (globals) and
//  required by Vitest in Node (module.exports).
// ============================================================

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return 'Unknown';
  try {
    const [y, m, day] = d.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day ? day + ' ' : ''}${months[parseInt(m, 10) - 1] || ''} ${y}`.trim();
  } catch (e) { return d; }
}

function sourceLabel(src) {
  return { gov: 'US Gov', mil: 'Military', civilian: 'Civilian', aaro: 'AARO' }[src] || src;
}

const GEO_CITY_LAT = {
  'phoenix': 33.4484, 'new york': 40.7128, 'los angeles': 34.0522, 'chicago': 41.8781,
  'houston': 29.7604, 'dallas': 32.7767, 'miami': 25.7617, 'seattle': 47.6062,
  'denver': 39.7392, 'atlanta': 33.749, 'las vegas': 36.1699, 'washington': 38.9072,
  'london': 51.5074, 'paris': 48.8566, 'tokyo': 35.6762, 'sydney': -33.8688
};

const GEO_CITY_LNG = {
  'phoenix': -112.074, 'new york': -74.006, 'los angeles': -118.2437, 'chicago': -87.6298,
  'houston': -95.3698, 'dallas': -96.797, 'miami': -80.1918, 'seattle': -122.3321,
  'denver': -104.9903, 'atlanta': -84.388, 'las vegas': -115.1398, 'washington': -77.0369,
  'london': -0.1278, 'paris': 2.3522, 'tokyo': 139.6503, 'sydney': 151.2093
};

function geoGuess(city) {
  const l = (city || '').toLowerCase();
  for (const [k, v] of Object.entries(GEO_CITY_LAT)) if (l.includes(k)) return v;
  return 0;
}

function geoGuessLng(city) {
  const l = (city || '').toLowerCase();
  for (const [k, v] of Object.entries(GEO_CITY_LNG)) if (l.includes(k)) return v;
  return 0;
}

function toEmbedUrl(url) {
  try {
    if (url.includes('youtube.com/embed/') || url.includes('player.vimeo.com')) return url;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    if (url.includes('rumble.com/embed/')) return url;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  } catch (e) {}
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escHtml, formatDate, sourceLabel, geoGuess, geoGuessLng, toEmbedUrl };
}
