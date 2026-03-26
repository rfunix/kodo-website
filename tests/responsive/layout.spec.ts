import { test, expect } from '@playwright/test';

const pages = ['/', '/docs/getting-started/', '/playground/'];

for (const path of pages) {
  test(`no horizontal overflow on ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
}

test('landing page hero visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible();
});

test('landing page footer reachable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('footer')).toBeVisible();
});

test('content fills available width on large screens', async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width < 1920, 'Large screens only');

  await page.goto('/', { waitUntil: 'networkidle' });
  const heroWidth = await page.locator('section').first().evaluate((el) => el.clientWidth);
  // Content should use at least 50% of viewport on large screens
  expect(heroWidth).toBeGreaterThan(viewport!.width * 0.5);
});
