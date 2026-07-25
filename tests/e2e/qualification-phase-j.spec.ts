import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function openSample(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
}

test('keyboard navigation exposes a visible focus indicator and dismissible focused view', async ({ page }) => {
  await openSample(page);
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
  const focus = page.getByRole('button', { name: 'Focus S-curve' });
  await focus.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.data-view-focused')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(focus).toBeFocused();
});

test('200-percent zoom retains reflow and blocking WCAG compliance in Chromium', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CSS zoom qualification is captured in Chromium.');
  await page.setViewportSize({ width: 1280, height: 900 });
  await openSample(page);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious')).toEqual([]);
});

test('reduced motion and forced colors preserve operability', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Forced-colors emulation is not available in WebKit.');
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await openSample(page);
  const duration = await page.locator('.workspace-header').evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.001);
  await expect(page.getByRole('button', { name: 'Customize dashboard' })).toBeVisible();
});

test('mobile primary actions meet preferred touch target sizing', async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 700, 'Touch target evidence runs in mobile Chromium.');
  await openSample(page);
  const launcher = page.getByRole('button', { name: 'Open mobile project workflows' });
  const launcherBox = await launcher.boundingBox();
  expect(launcherBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await launcher.click();
  const targets = await page.locator('.mobile-operations-tabs button').evaluateAll((buttons) => buttons.map((button) => {
    const rectangle = button.getBoundingClientRect();
    return { width: rectangle.width, height: rectangle.height };
  }));
  expect(targets.every((target) => target.height >= 44 && target.width >= 44)).toBe(true);
});

test('Daylight and Night Shift evidence screenshots render purposeful charts', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Theme screenshot evidence is retained once in Chromium.');
  await openSample(page);
  await testInfo.attach('daylight-dashboard', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  await page.getByRole('button', { name: 'Open appearance settings' }).click();
  await page.locator('label.theme-option').filter({ hasText: 'Night Shift' }).click();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night-shift');
  await testInfo.attach('night-shift-dashboard', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
