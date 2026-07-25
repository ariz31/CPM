import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function openMobileHub(page: import('@playwright/test').Page): Promise<import('@playwright/test').Locator> {
  await page.goto('/');
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
  await page.getByRole('button', { name: 'Open mobile project workflows' }).click();
  const dialog = page.getByRole('dialog', { name: 'Mobile project controls' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 700, 'Phase I mobile workflows run in the mobile Chromium project.');
});

test('mobile overview exposes critical work, milestones, EVM, and accessible navigation', async ({ page }) => {
  const dialog = await openMobileHub(page);
  await expect(dialog.getByText('Critical', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Milestone outlook')).toBeVisible();
  await expect(dialog.getByText('BAC', { exact: true })).toBeVisible();
  const axe = await new AxeBuilder({ page }).include('.mobile-operations-dialog').analyze();
  const blocking = axe.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  expect(blocking).toEqual([]);
});

test('mobile users can find and edit an activity', async ({ page }) => {
  const dialog = await openMobileHub(page);
  await dialog.getByRole('button', { name: 'Activity', exact: true }).click();
  await dialog.getByLabel('Search activities').fill('A100');
  await dialog.getByLabel('Activity to edit').selectOption('A100');
  await dialog.getByLabel('Activity name').fill('Site preparation — mobile verified');
  await dialog.getByRole('button', { name: 'Save activity' }).click();
  await expect(dialog.getByRole('status').filter({ hasText: /Updated A100 from mobile workflows/i })).toBeVisible();
});

test('mobile users can record progress and create a risk', async ({ page }) => {
  const dialog = await openMobileHub(page);
  await dialog.getByRole('button', { name: 'Progress', exact: true }).click();
  await dialog.getByLabel('Progress activity').selectOption('A100');
  const percent = dialog.getByRole('textbox', { name: /Percent complete/ });
  await percent.fill('40');
  await percent.press('Enter');
  const remaining = dialog.getByRole('textbox', { name: /Remaining duration/ });
  await remaining.fill('2');
  await remaining.press('Enter');
  await dialog.getByLabel('Field notes').fill('Field walk completed');
  await dialog.getByRole('button', { name: 'Save progress update' }).click();
  await expect(dialog.getByRole('status').filter({ hasText: /Recorded progress for A100/i })).toBeVisible();

  await dialog.getByRole('button', { name: 'Risk', exact: true }).click();
  await dialog.getByRole('button', { name: 'New risk' }).click();
  await dialog.getByLabel('Risk title').fill('Restricted delivery access');
  await dialog.getByLabel('Owner').fill('Site manager');
  await dialog.getByLabel('Linked activity').selectOption('A100');
  await dialog.getByLabel('Response').fill('Coordinate timed deliveries with security.');
  await dialog.getByRole('button', { name: 'Save risk' }).click();
  await expect(dialog.getByRole('status').filter({ hasText: /Saved risk Restricted delivery access/i })).toBeVisible();
});

test('mobile backup workflow creates, restores, and exports recovery evidence', async ({ page }) => {
  const dialog = await openMobileHub(page);
  await dialog.getByRole('button', { name: 'Backup', exact: true }).click();
  const backup = dialog.getByRole('region', { name: 'Backup and restore' });
  await backup.getByLabel('Mobile snapshot name').fill('Mobile qualification snapshot');
  await backup.getByRole('button', { name: 'Create snapshot' }).click();
  await expect(backup.getByText('Mobile qualification snapshot', { exact: true })).toBeVisible();
  await backup.getByRole('button', { name: 'Restore' }).first().click();
  await expect(dialog.getByRole('status').filter({ hasText: /Snapshot restored/i })).toBeVisible();

  const download = page.waitForEvent('download');
  await backup.getByRole('button', { name: 'Export portable project' }).click();
  expect((await download).suggestedFilename()).toMatch(/\.cpmproj$/);
});

test('every compact workflow remains within the mobile viewport', async ({ page }) => {
  const dialog = await openMobileHub(page);
  for (const name of ['Overview', 'Activity', 'Progress', 'Risk', 'Backup']) {
    await dialog.getByRole('button', { name, exact: true }).click();
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    expect(widths.document, `${name} widened the document`).toBeLessThanOrEqual(widths.viewport + 1);
    expect(widths.body, `${name} widened the body`).toBeLessThanOrEqual(widths.viewport + 1);
  }
});
