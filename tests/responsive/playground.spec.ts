import { test, expect } from '@playwright/test';

test.describe('Playground layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/playground/', { waitUntil: 'domcontentloaded' });
  });

  test('no horizontal overflow', async ({ page }) => {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('editor container visible', async ({ page }) => {
    await expect(page.locator('#editor-container')).toBeVisible();
  });

  test('diagnostics panel exists', async ({ page }) => {
    await expect(page.locator('#diagnostics')).toBeAttached();
  });

  test('panels side-by-side on tablet+, stacked on mobile', async ({ page }) => {
    const viewport = page.viewportSize();
    if (!viewport) return;

    const editorBox = await page.locator('#editor-container').boundingBox();
    const diagBox = await page.locator('#diagnostics').boundingBox();

    if (!editorBox || !diagBox) return;

    if (viewport.width >= 768) {
      // Side by side: diagnostics to the right of editor
      expect(diagBox.x).toBeGreaterThanOrEqual(editorBox.x + editorBox.width - 10);
    } else {
      // Stacked: diagnostics below editor
      expect(diagBox.y).toBeGreaterThanOrEqual(editorBox.y + editorBox.height - 10);
    }
  });
});
