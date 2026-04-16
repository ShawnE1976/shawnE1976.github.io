import { describe, it, expect } from 'vitest';
import {
  EXPORT_COLUMNS,
  filterSightings,
  buildSightingFromForm,
  csvEscape,
  toCsv,
} from '../sightings.js';

const FIXTURES = [
  { id: 1, source: 'gov',      shape: 'Tic-Tac',     status: 'verified',   date: '2004-11-14', videos: ['yt'] },
  { id: 2, source: 'mil',      shape: 'Round',       status: 'verified',   date: '2015-01-20', videos: ['yt'] },
  { id: 3, source: 'civilian', shape: 'Triangle',    status: 'unverified', date: '2022-06-02', videos: [] },
  { id: 4, source: 'civilian', shape: 'Orb',         status: 'pending',    date: '2024-03-10' },
  { id: 5, source: 'aaro',     shape: 'Oval/tic-tac',status: 'classified', date: '2023-08-01', videos: ['yt','vm'] },
];

describe('filterSightings', () => {
  it('returns the full list when all filters are "all"', () => {
    expect(filterSightings(FIXTURES, {}).length).toBe(5);
  });

  it('filters by source', () => {
    expect(filterSightings(FIXTURES, { source: 'civilian' }).map(s => s.id)).toEqual([3, 4]);
  });

  it('shape match is case-insensitive substring', () => {
    expect(filterSightings(FIXTURES, { shape: 'tic-tac' }).map(s => s.id)).toEqual([1, 5]);
  });

  it('filters by year against date prefix', () => {
    expect(filterSightings(FIXTURES, { year: '2015' }).map(s => s.id)).toEqual([2]);
    expect(filterSightings(FIXTURES, { year: 2015 }).map(s => s.id)).toEqual([2]);
  });

  it('filters by status', () => {
    expect(filterSightings(FIXTURES, { status: 'verified' }).map(s => s.id)).toEqual([1, 2]);
  });

  it('video="yes" requires a non-empty videos array; missing array is excluded', () => {
    expect(filterSightings(FIXTURES, { video: 'yes' }).map(s => s.id)).toEqual([1, 2, 5]);
  });

  it('combines filters with AND semantics', () => {
    const out = filterSightings(FIXTURES, { source: 'civilian', status: 'pending' });
    expect(out.map(s => s.id)).toEqual([4]);
  });

  it('returns [] for empty / null input', () => {
    expect(filterSightings([], {})).toEqual([]);
    expect(filterSightings(null, {})).toEqual([]);
  });
});

describe('buildSightingFromForm', () => {
  const BASE = {
    title: '  Light over Phoenix  ',
    city: 'Phoenix', state: 'AZ', country: 'USA',
    lat: '', lng: '',
    date: '2024-05-01',
    description: 'A bright orb hovered silently.',
    shape: 'Orb', duration: '30s',
    video: 'https://youtu.be/aaa, https://youtu.be/bbb',
    witnesses: '3',
    name: ' Alice ', anon: false,
    source: 'reporter-x',
    geoGuessLat: 33.4484, geoGuessLng: -112.074,
  };

  it('falls back to geoGuess coords when lat/lng are blank', () => {
    const s = buildSightingFromForm(BASE, 1_700_000_000);
    expect(s.lat).toBeCloseTo(33.4484);
    expect(s.lng).toBeCloseTo(-112.074);
  });

  it('uses explicit lat/lng when they parse as numbers', () => {
    const s = buildSightingFromForm({ ...BASE, lat: '40.5', lng: '-73.5' }, 0);
    expect(s.lat).toBeCloseTo(40.5);
    expect(s.lng).toBeCloseTo(-73.5);
  });

  it('trims strings and joins the location field', () => {
    const s = buildSightingFromForm(BASE, 0);
    expect(s.title).toBe('Light over Phoenix');
    expect(s.location).toBe('Phoenix, AZ, USA');
  });

  it('skips empty location parts in the join', () => {
    const s = buildSightingFromForm({ ...BASE, state: '', country: '' }, 0);
    expect(s.location).toBe('Phoenix');
  });

  it('parses comma-separated videos and trims each', () => {
    const s = buildSightingFromForm(BASE, 0);
    expect(s.videos).toEqual(['https://youtu.be/aaa', 'https://youtu.be/bbb']);
  });

  it('returns an empty videos array when no video given', () => {
    const s = buildSightingFromForm({ ...BASE, video: '' }, 0);
    expect(s.videos).toEqual([]);
  });

  it('forces source=civilian and status=pending on every submission', () => {
    const s = buildSightingFromForm({ ...BASE, source: 'hacker' }, 0);
    expect(s.source).toBe('civilian');
    expect(s.status).toBe('pending');
    expect(s.gov_ref).toBe('hacker');
  });

  it('defaults witnesses to 1 when blank', () => {
    const s = buildSightingFromForm({ ...BASE, witnesses: '' }, 0);
    expect(s.witnesses).toBe(1);
  });

  it('parses witnesses to an integer', () => {
    const s = buildSightingFromForm({ ...BASE, witnesses: '7' }, 0);
    expect(s.witnesses).toBe(7);
  });

  it('uses "Anonymous" when anon is true, regardless of name', () => {
    const s = buildSightingFromForm({ ...BASE, anon: true, name: 'Alice' }, 0);
    expect(s.submittedBy).toBe('Anonymous');
  });

  it('uses the provided name when anon is false', () => {
    const s = buildSightingFromForm(BASE, 0);
    expect(s.submittedBy).toBe('Alice');
  });

  it('defaults submittedBy to "Anonymous" when name is blank and anon is false', () => {
    const s = buildSightingFromForm({ ...BASE, name: '' }, 0);
    expect(s.submittedBy).toBe('Anonymous');
  });

  it('stamps the provided uid (for deterministic tests)', () => {
    const s = buildSightingFromForm(BASE, 1234);
    expect(s.uid).toBe(1234);
  });

  it('marks the sighting as user-submitted', () => {
    const s = buildSightingFromForm(BASE, 0);
    expect(s.userSubmitted).toBe(true);
  });
});

describe('csvEscape', () => {
  it('passes simple values through unchanged', () => {
    expect(csvEscape('hello')).toBe('hello');
    expect(csvEscape(42)).toBe('42');
  });

  it('wraps and doubles quotes when the value contains a comma', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
  });

  it('escapes embedded double-quotes by doubling them', () => {
    expect(csvEscape('she said "hi"')).toBe('"she said ""hi"""');
  });

  it('wraps values containing newlines', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('renders null/undefined as empty string', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });
});

describe('toCsv', () => {
  it('emits a header row followed by one row per sighting', () => {
    const csv = toCsv([{ id: 1, title: 'a' }, { id: 2, title: 'b' }], ['id', 'title']);
    expect(csv.split('\n')).toEqual(['id,title', '1,a', '2,b']);
  });

  it('uses EXPORT_COLUMNS by default', () => {
    const csv = toCsv([{ id: 1, title: 'x' }]);
    const [header] = csv.split('\n');
    expect(header).toBe(EXPORT_COLUMNS.join(','));
  });

  it('escapes descriptions that contain commas and quotes without breaking CSV shape', () => {
    const csv = toCsv(
      [{ id: 1, description: 'He said "hello", then left.' }],
      ['id', 'description']
    );
    expect(csv).toBe('id,description\n1,"He said ""hello"", then left."');
    // Every row still has exactly one delimiter outside the quoted field.
    const rows = csv.split('\n');
    expect(rows.length).toBe(2);
  });

  it('handles missing fields as empty cells', () => {
    const csv = toCsv([{ id: 1 }], ['id', 'title']);
    expect(csv).toBe('id,title\n1,');
  });

  it('returns just the header for an empty list', () => {
    expect(toCsv([], ['id', 'title'])).toBe('id,title');
  });
});
