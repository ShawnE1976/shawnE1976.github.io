// ============================================================
//  PhenoMap — pure sighting filter / builder / export logic
//  app.js provides the DOM/IO layer; this module is pure so it
//  can be unit-tested without a DOM.
// ============================================================

const EXPORT_COLUMNS = [
  'id','title','location','lat','lng','date','source','status',
  'shape','duration','description','gov_ref'
];

function filterSightings(sightings, filters) {
  const {
    source = 'all',
    shape  = 'all',
    year   = 'all',
    status = 'all',
    video  = 'all',
  } = filters || {};

  return (sightings || []).filter(s => {
    const sy = s.date ? String(s.date).split('-')[0] : '';
    const ss = (s.shape || '').toLowerCase();
    return (
      (source === 'all' || s.source === source) &&
      (shape  === 'all' || ss.includes(shape)) &&
      (year   === 'all' || sy === String(year)) &&
      (status === 'all' || s.status === status) &&
      (video  === 'all' || (video === 'yes' && Array.isArray(s.videos) && s.videos.length > 0))
    );
  });
}

function buildSightingFromForm(values, now) {
  const v = values || {};
  const str = (x) => (x == null ? '' : String(x).trim());
  const title   = str(v.title);
  const city    = str(v.city);
  const state   = str(v.state);
  const country = str(v.country);
  const date    = str(v.date);
  const desc    = str(v.description);
  const shape   = str(v.shape);
  const dur     = str(v.duration);
  const videoStr= str(v.video);
  const name    = str(v.name) || 'Anonymous';
  const src     = str(v.source);

  const parsedLat = parseFloat(v.lat);
  const parsedLng = parseFloat(v.lng);

  const location = [city, state, country].filter(Boolean).join(', ');
  const videos = videoStr ? videoStr.split(',').map(x => x.trim()).filter(Boolean) : [];

  const witRaw = v.witnesses == null || v.witnesses === '' ? '1' : v.witnesses;
  const witnesses = parseInt(witRaw, 10) || 1;

  return {
    uid: typeof now === 'number' ? now : Date.now(),
    title,
    location,
    lat: Number.isFinite(parsedLat) ? parsedLat : (v.geoGuessLat ?? 0),
    lng: Number.isFinite(parsedLng) ? parsedLng : (v.geoGuessLng ?? 0),
    date,
    source: 'civilian',
    status: 'pending',
    description: desc,
    shape,
    duration: dur,
    videos,
    witnesses,
    gov_ref: src,
    submittedBy: v.anon ? 'Anonymous' : name,
    userSubmitted: true,
  };
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(sightings, columns) {
  const cols = columns || EXPORT_COLUMNS;
  const header = cols.join(',');
  const rows = (sightings || []).map(s =>
    cols.map(c => csvEscape(s[c])).join(',')
  );
  return [header, ...rows].join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EXPORT_COLUMNS,
    filterSightings,
    buildSightingFromForm,
    csvEscape,
    toCsv,
  };
}
