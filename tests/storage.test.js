/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  PHENOMAP_STORAGE_KEYS,
  readSettings, writeSettings,
  readUserSightings, writeUserSightings,
  readPremium, writePremium,
} from '../storage.js';

beforeEach(() => {
  localStorage.clear();
});

describe('settings round-trip', () => {
  it('returns {} when nothing is stored', () => {
    expect(readSettings()).toEqual({});
  });

  it('persists and restores settings verbatim', () => {
    const settings = {
      darkMode: true,
      cluster: false,
      timeline: true,
      nearbyAlert: false,
      nuforc: true,
      mufon: true,
      community: false,
      govOnly: false,
      anon: true,
    };
    expect(writeSettings(settings)).toBe(true);
    expect(readSettings()).toEqual(settings);
  });

  it('writes to the documented localStorage key', () => {
    writeSettings({ darkMode: true });
    expect(localStorage.getItem(PHENOMAP_STORAGE_KEYS.settings))
      .toBe(JSON.stringify({ darkMode: true }));
    expect(PHENOMAP_STORAGE_KEYS.settings).toBe('phenomap_settings');
  });

  it('returns {} when stored value is corrupted JSON', () => {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.settings, '{not valid json');
    expect(readSettings()).toEqual({});
  });

  it('coerces null/undefined to {} on write', () => {
    writeSettings(null);
    expect(readSettings()).toEqual({});
    writeSettings(undefined);
    expect(readSettings()).toEqual({});
  });
});

describe('user sightings round-trip', () => {
  it('returns [] when nothing is stored', () => {
    expect(readUserSightings()).toEqual([]);
  });

  it('persists and restores a list of sightings verbatim', () => {
    const list = [
      { uid: 1, title: 'Light over Phoenix', lat: 33.4, lng: -112.0, userSubmitted: true },
      { uid: 2, title: 'Orb over Miami',     lat: 25.7, lng: -80.2,  userSubmitted: true },
    ];
    expect(writeUserSightings(list)).toBe(true);
    expect(readUserSightings()).toEqual(list);
  });

  it('returns [] on corrupted JSON', () => {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.userSightings, 'not json');
    expect(readUserSightings()).toEqual([]);
  });

  it('returns [] when stored value is valid JSON but not an array', () => {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.userSightings, '{"rogue":"object"}');
    expect(readUserSightings()).toEqual([]);
  });

  it('coerces null/undefined to [] on write', () => {
    writeUserSightings(null);
    expect(readUserSightings()).toEqual([]);
    writeUserSightings(undefined);
    expect(readUserSightings()).toEqual([]);
  });
});

describe('premium flag round-trip', () => {
  it('defaults to false', () => {
    expect(readPremium()).toBe(false);
  });

  it('writes and reads true', () => {
    writePremium(true);
    expect(readPremium()).toBe(true);
  });

  it('writes and reads false', () => {
    writePremium(true);
    writePremium(false);
    expect(readPremium()).toBe(false);
  });

  it('only treats the exact string "true" as premium', () => {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.premium, 'yes');
    expect(readPremium()).toBe(false);
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.premium, '1');
    expect(readPremium()).toBe(false);
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.premium, 'true');
    expect(readPremium()).toBe(true);
  });

  it('coerces truthy/falsy inputs to boolean strings', () => {
    writePremium(1);
    expect(readPremium()).toBe(true);
    writePremium(0);
    expect(readPremium()).toBe(false);
    writePremium('');
    expect(readPremium()).toBe(false);
  });
});

describe('keys are stable across releases', () => {
  it('uses the documented storage keys', () => {
    expect(PHENOMAP_STORAGE_KEYS).toEqual({
      settings:      'phenomap_settings',
      userSightings: 'phenomap_user_sightings',
      premium:       'phenomap_premium',
    });
  });
});
