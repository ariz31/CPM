import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function openMobileHub(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
  await page.getByRole('button', { name: 'Open mobile project workflows' }).click();
  await expect(page.getByRole('dialog', { name: 'Mobile project controls' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 700, 'Phase I mobile workflows run in the mobile Chromium project.');
});

test('mobile overview exposes critical work, milestones, EVM, and accessible navigation', async ({ page }) => {
  await openMobileHub(page);
  const dialog = page.getByRole('dialog', { name: 'Mobile project controls' });
  await expect(dialog.getByText('Critical', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Milestone outlook')).toBeVisible();
  await expect(dialog.getByText('BAC', { exact: true })).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('.mobile-operations-dialog').analyze();
  const blocking = axe.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  expect(blocking).toEqual([]);
});

test('mobile users can find and edit an activity', async ({ page }) => {
  await openMobileHub(page);
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await page.getByLabel('Search activities').fill('A100');
  await page.getByLabel('Activity', { exact: true }).selectOption('A100');
  await page.getByLabel('Activity name').fill('Site preparation — mobile verified');
  await page.getByRole('button', { name: 'Save activity' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Updated A100 from mobile workflows/i })).toBeVisible();
});

test('mobile users can record progress and create a risk', async ({ page }) => {
  await openMobileHub(page);
  await page.getByRole('button', { name: 'Progress', exact: true }).click();
  await page.getByLabel('Activity', { exact: true }).selectOption('A100');
  const percent = page.getByLabel('Percent complete');
  await percent.fill('40');
  await percent.press('Enter');
  const remaining = page.getByLabel('Remaining duration');
  await remaining.fill('2');
  await remaining.press('Enter');
  await page.getByLabel('Field notes').fill('Field walk completed');
  await page.getByRole('button', { name: 'Save progress update' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Recorded progress for A100/i })).toBeVisible();

  await page.getByRole('button', { name: 'Risk', exact: true }).click();
  await page.getByRole('button', { name: 'New risk' }).click();
  await page.getByLabel('Risk title').fill('Restricted delivery access');
  await page.getByLabel('Owner').fill('Site manager');
  await page.getByLabel('Linked activity').selectOption('A100');
  await page.getByLabel('Response').fill('Coordinate timed deliveries with security.');
  await page.getByRole('button', { name: 'Save risk' }).click();
  await expect(page.getByRole('status').filter({ hasText: /Saved risk Restricted delivery access/i })).toBeVisible();
});

test('mobile backup workflow creates, restores, and exports recovery evidence', async ({ page }) => {
  await openMobileHub(page);
  await page.getByRole('button', { name: 'Backup', exact: true }).click();
  await page.getByLabel('Snapshot name').fill('Mobile qualification snapshot');
  await page.getByRole('button', { name: 'Create snapshot' }).click();
  await expect(page.getByText('Mobile qualification snapshot', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restore' }).first().click();
  await expect(page.getByRole('status').filter({ hasText: /Snapshot restored/i })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export portable project' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.cpmproj$/);
});

test('every compact workflow remains within the mobile viewport', async ({ page }) => {
  await openMobileHub(page);
  for (const name of ['Overview', 'Activity', 'Progress', 'Risk', 'Backup']) {
    await page.getByRole('button', { name, exact: true }).click();
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(widths.document, `${name} widened the document`).toBeLessThanOrEqual(widths.viewport + 1);
    expect(widths.body, `${name} widened the body`).toBeLessThanOrEqual(widths.viewport + 1);
  }
});
