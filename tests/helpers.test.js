import { describe, it, expect } from 'vitest';
import {
  escHtml,
  formatDate,
  sourceLabel,
  geoGuess,
  geoGuessLng,
  toEmbedUrl,
} from '../helpers.js';

describe('escHtml', () => {
  it('escapes the four HTML-significant characters', () => {
    expect(escHtml('<script>alert("x&y")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;'
    );
  });

  it('returns an empty string for null and undefined without throwing', () => {
    expect(escHtml(null)).toBe('');
    expect(escHtml(undefined)).toBe('');
  });

  it('coerces non-string values to strings', () => {
    expect(escHtml(42)).toBe('42');
    expect(escHtml(0)).toBe('0');
    expect(escHtml(false)).toBe('false');
  });

  it('escapes ampersands before other entities so &lt; does not become &amp;lt;', () => {
    expect(escHtml('&')).toBe('&amp;');
    expect(escHtml('&lt;')).toBe('&amp;lt;');
  });
});

describe('formatDate', () => {
  it('formats a full ISO date as "DD MMM YYYY"', () => {
    expect(formatDate('2024-03-07')).toBe('07 Mar 2024');
  });

  it('formats a year-month date as "MMM YYYY"', () => {
    expect(formatDate('2024-03')).toBe('Mar 2024');
  });

  it('returns "Unknown" for empty / null / undefined', () => {
    expect(formatDate('')).toBe('Unknown');
    expect(formatDate(null)).toBe('Unknown');
    expect(formatDate(undefined)).toBe('Unknown');
  });

  it('handles an invalid month gracefully (empty month slot)', () => {
    expect(formatDate('2024-13-01')).toBe('01  2024');
  });

  it('returns the bare year when only a year is given', () => {
    expect(formatDate('2024')).toBe('2024');
  });
});

describe('sourceLabel', () => {
  it('maps each known source code to its label', () => {
    expect(sourceLabel('gov')).toBe('US Gov');
    expect(sourceLabel('mil')).toBe('Military');
    expect(sourceLabel('civilian')).toBe('Civilian');
    expect(sourceLabel('aaro')).toBe('AARO');
  });

  it('returns the input unchanged for an unknown source', () => {
    expect(sourceLabel('unknown')).toBe('unknown');
    expect(sourceLabel('')).toBe('');
  });
});

describe('geoGuess / geoGuessLng', () => {
  it('returns coordinates for a known city', () => {
    expect(geoGuess('Phoenix')).toBeCloseTo(33.4484);
    expect(geoGuessLng('Phoenix')).toBeCloseTo(-112.074);
  });

  it('is case-insensitive', () => {
    expect(geoGuess('PHOENIX')).toBeCloseTo(33.4484);
    expect(geoGuessLng('phoenix')).toBeCloseTo(-112.074);
  });

  it('matches cities embedded in a larger location string', () => {
    expect(geoGuess('Phoenix, AZ, USA')).toBeCloseTo(33.4484);
    expect(geoGuessLng('Downtown London, UK')).toBeCloseTo(-0.1278);
  });

  it('returns 0 for unknown cities and for empty input', () => {
    expect(geoGuess('Atlantis')).toBe(0);
    expect(geoGuessLng('Atlantis')).toBe(0);
    expect(geoGuess('')).toBe(0);
    expect(geoGuess(null)).toBe(0);
    expect(geoGuess(undefined)).toBe(0);
  });
});

describe('toEmbedUrl', () => {
  it('converts a standard YouTube watch URL to an embed URL', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('converts a youtu.be short URL to an embed URL', () => {
    expect(toEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    );
  });

  it('passes through an already-embedded YouTube URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    expect(toEmbedUrl(url)).toBe(url);
  });

  it('converts a vimeo.com URL to a player.vimeo.com embed URL', () => {
    expect(toEmbedUrl('https://vimeo.com/123456789')).toBe(
      'https://player.vimeo.com/video/123456789'
    );
  });

  it('passes through player.vimeo.com and rumble embed URLs', () => {
    expect(toEmbedUrl('https://player.vimeo.com/video/123')).toBe(
      'https://player.vimeo.com/video/123'
    );
    expect(toEmbedUrl('https://rumble.com/embed/abc123/')).toBe(
      'https://rumble.com/embed/abc123/'
    );
  });

  it('returns null for unsupported URLs', () => {
    expect(toEmbedUrl('https://example.com/video.mp4')).toBeNull();
    expect(toEmbedUrl('not a url')).toBeNull();
  });

  it('returns null (not throw) for non-string input', () => {
    expect(toEmbedUrl(null)).toBeNull();
    expect(toEmbedUrl(undefined)).toBeNull();
  });
});
