import { describe, it, expect } from 'vitest';
import { SIGHTINGS } from '../data.js';

const KNOWN_SOURCES = new Set(['gov', 'mil', 'civilian', 'aaro']);
const KNOWN_STATUSES = new Set(['verified', 'unverified', 'pending', 'classified']);

describe('SIGHTINGS dataset', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(SIGHTINGS)).toBe(true);
    expect(SIGHTINGS.length).toBeGreaterThan(0);
  });

  it('contains at least 30 records (per product spec)', () => {
    expect(SIGHTINGS.length).toBeGreaterThanOrEqual(30);
  });

  it('has a unique numeric id on every sighting', () => {
    const ids = SIGHTINGS.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(typeof id).toBe('number');
      expect(Number.isFinite(id)).toBe(true);
    }
  });

  it('has required string fields on every sighting', () => {
    for (const s of SIGHTINGS) {
      expect(typeof s.title).toBe('string');
      expect(s.title.length).toBeGreaterThan(0);
      expect(typeof s.location).toBe('string');
      expect(s.location.length).toBeGreaterThan(0);
      expect(typeof s.description).toBe('string');
      expect(s.description.length).toBeGreaterThan(0);
    }
  });

  it('has lat/lng in valid geographic ranges', () => {
    for (const s of SIGHTINGS) {
      expect(typeof s.lat).toBe('number');
      expect(typeof s.lng).toBe('number');
      expect(s.lat).toBeGreaterThanOrEqual(-90);
      expect(s.lat).toBeLessThanOrEqual(90);
      expect(s.lng).toBeGreaterThanOrEqual(-180);
      expect(s.lng).toBeLessThanOrEqual(180);
    }
  });

  it('has no sightings stranded at (0, 0) (the Null Island bug)', () => {
    // geoGuess returns 0 for unknown cities; real sightings must have real coords.
    const nullIsland = SIGHTINGS.filter(s => s.lat === 0 && s.lng === 0);
    expect(nullIsland).toEqual([]);
  });

  it('uses only known source codes', () => {
    for (const s of SIGHTINGS) {
      expect(KNOWN_SOURCES.has(s.source)).toBe(true);
    }
  });

  it('uses only known status values', () => {
    for (const s of SIGHTINGS) {
      expect(KNOWN_STATUSES.has(s.status)).toBe(true);
    }
  });

  it('has dates that parse to a real date (or are an ISO prefix)', () => {
    const isoPrefix = /^\d{4}(-\d{2}(-\d{2})?)?$/;
    for (const s of SIGHTINGS) {
      expect(typeof s.date).toBe('string');
      expect(s.date).toMatch(isoPrefix);
      const year = parseInt(s.date.slice(0, 4), 10);
      expect(year).toBeGreaterThanOrEqual(1900);
      expect(year).toBeLessThanOrEqual(new Date().getFullYear());
    }
  });

  it('has videos as an array of strings when present', () => {
    for (const s of SIGHTINGS) {
      if (s.videos === undefined) continue;
      expect(Array.isArray(s.videos)).toBe(true);
      for (const v of s.videos) {
        expect(typeof v).toBe('string');
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });
});
