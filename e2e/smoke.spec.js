import { test, expect } from '@playwright/test';

test.describe('PhenoMap smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try { localStorage.clear(); } catch (e) {}
    });
  });

  test('boots and renders the map with markers', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#map')).toBeVisible();
    await expect(page.locator('.leaflet-tile-pane')).toBeVisible();

    const count = page.locator('#sighting-count');
    await expect(count).toHaveText(/\d+ sightings/);
    const text = await count.textContent();
    const n = parseInt((text || '').match(/\d+/)?.[0] ?? '0', 10);
    expect(n).toBeGreaterThanOrEqual(30);
  });

  test('source filter updates the sighting count to gov-only', async ({ page }) => {
    await page.goto('/');

    const govExpected = await page.evaluate(
      () => SIGHTINGS.filter(s => s.source === 'gov').length
    );
    expect(govExpected).toBeGreaterThan(0);

    await page.selectOption('#filter-source', 'gov');

    await expect(page.locator('#sighting-count')).toHaveText(
      `${govExpected} sightings`
    );
  });

  test('paywall opens ~2.5s after load for non-premium users', async ({ page }) => {
    await page.goto('/');

    const paywall = page.locator('#paywall-overlay');
    await expect(paywall).not.toHaveClass(/\bshow\b/);
    await expect(paywall).toHaveClass(/\bshow\b/, { timeout: 5_000 });
  });

  test('paywall does NOT open when user is already premium', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('phenomap_premium', 'true');
    });
    await page.goto('/');

    await page.waitForTimeout(3_500);
    await expect(page.locator('#paywall-overlay')).not.toHaveClass(/\bshow\b/);
  });

  test('submitting the report form persists a user sighting to localStorage', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => document.querySelector('.snav[data-panel="submit"]')?.click());

    await page.fill('#sub-title', 'Playwright test orb');
    await page.fill('#sub-city', 'Phoenix');
    await page.fill('#sub-date', '2025-01-02');
    await page.fill('#sub-desc', 'A bright orb, test submission.');

    await page.evaluate(() => document.getElementById('submit-form').requestSubmit());

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('phenomap_user_sightings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);
    expect(stored[0]).toMatchObject({
      title: 'Playwright test orb',
      location: 'Phoenix',
      source: 'civilian',
      status: 'pending',
      userSubmitted: true,
    });
    expect(stored[0].lat).toBeCloseTo(33.4484, 2);
    expect(stored[0].lng).toBeCloseTo(-112.074, 2);
  });
});
