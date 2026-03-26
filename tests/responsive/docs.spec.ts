import { test, expect } from '@playwright/test';

test.describe('Docs code blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/docs/guide/language-basics/', { waitUntil: 'domcontentloaded' });
  });

  test('code blocks are horizontally scrollable', async ({ page }) => {
    const codeBlocks = page.locator('.expressive-code pre, .docs-prose > pre');
    const count = await codeBlocks.count();
    test.skip(count === 0, 'No code blocks on page');

    for (let i = 0; i < Math.min(count, 5); i++) {
      const overflow = await codeBlocks.nth(i).evaluate((el) => {
        return window.getComputedStyle(el).overflowX;
      });
      expect(['auto', 'scroll']).toContain(overflow);
    }
  });

  test('code blocks do not overflow main container', async ({ page }) => {
    const codeBlocks = page.locator('.expressive-code, .docs-prose > pre');
    const count = await codeBlocks.count();
    test.skip(count === 0, 'No code blocks on page');

    const mainWidth = await page.locator('main').evaluate((el) => el.clientWidth);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await codeBlocks.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(mainWidth + 2);
      }
    }
  });
});

test.describe('Docs typography', () => {
  test('mobile: text font size >= 12px', async ({ page }) => {
    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width > 640, 'Mobile only');

    await page.goto('/docs/guide/language-basics/', { waitUntil: 'domcontentloaded' });
    const paragraphs = page.locator('.docs-prose p');
    const count = await paragraphs.count();
    test.skip(count === 0, 'No paragraphs');

    for (let i = 0; i < Math.min(count, 3); i++) {
      const fontSize = await paragraphs.nth(i).evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });

  test('headings are readable', async ({ page }) => {
    await page.goto('/docs/guide/language-basics/', { waitUntil: 'domcontentloaded' });
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const fontSize = await h1.evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(24);
  });
});
