// ============================================================
//  PhenoMap — localStorage persistence layer
//  Pure read/write primitives. app.js wires these to its
//  module-level state (settings, userSightings, isPremium).
// ============================================================

const PHENOMAP_STORAGE_KEYS = {
  settings:      'phenomap_settings',
  userSightings: 'phenomap_user_sightings',
  premium:       'phenomap_premium',
};

function readSettings() {
  try {
    const raw = localStorage.getItem(PHENOMAP_STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function writeSettings(settings) {
  try {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.settings, JSON.stringify(settings ?? {}));
    return true;
  } catch (e) { return false; }
}

function readUserSightings() {
  try {
    const raw = localStorage.getItem(PHENOMAP_STORAGE_KEYS.userSightings);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) { return []; }
}

function writeUserSightings(list) {
  try {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.userSightings, JSON.stringify(list ?? []));
    return true;
  } catch (e) { return false; }
}

function readPremium() {
  try {
    return localStorage.getItem(PHENOMAP_STORAGE_KEYS.premium) === 'true';
  } catch (e) { return false; }
}

function writePremium(isPremium) {
  try {
    localStorage.setItem(PHENOMAP_STORAGE_KEYS.premium, String(!!isPremium));
    return true;
  } catch (e) { return false; }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PHENOMAP_STORAGE_KEYS,
    readSettings, writeSettings,
    readUserSightings, writeUserSightings,
    readPremium, writePremium,
  };
}
