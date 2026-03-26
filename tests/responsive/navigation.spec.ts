import { test, expect } from '@playwright/test';

test.describe('Landing page navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('mobile: hamburger menu opens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile only');
    const menuBtn = page.locator('#mobile-menu-btn');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const mobileMenu = page.locator('#mobile-menu');
    await expect(mobileMenu).toBeVisible();
  });

  test('desktop: nav links visible', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width < 768, 'Desktop only');
    // Desktop nav container should be visible
    const navLinks = page.locator('nav a[href="/docs/getting-started/"]');
    await expect(navLinks.first()).toBeVisible();
  });
});

test.describe('Docs sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/getting-started/', { waitUntil: 'domcontentloaded' });
  });

  test('mobile: sidebar toggle opens sidebar', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width >= 1024, 'Mobile/tablet only');
    const toggle = page.locator('#sidebar-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('desktop: sidebar visible by default', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width < 1024, 'Desktop only');
    const sidebar = page.locator('#sidebar');
    await expect(sidebar).toBeVisible();
  });
});
