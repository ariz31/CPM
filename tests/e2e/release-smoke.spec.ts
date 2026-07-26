import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoBlockingAccessibilityViolations(page: import('@playwright/test').Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
}

async function openSample(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Plan, calculate, recover/i })).toBeVisible();
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
}

async function openWorkspaceSection(page: import('@playwright/test').Page, section: string): Promise<void> {
  const viewport = page.viewportSize();
  if (viewport && viewport.width > 700) {
    const button = page.locator('.workspace-sidebar:visible').getByRole('button', { name: section, exact: true });
    await expect(button).toBeVisible();
    await button.click();
  } else {
    const select = page.getByLabel('Workspace section');
    await expect(select).toBeVisible();
    await select.selectOption(section);
  }
}

test('library and representative project workspaces pass automated WCAG checks', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Plan, calculate, recover/i })).toBeVisible();
  await expectNoBlockingAccessibilityViolations(page);
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();

  for (const [section, heading] of [
    ['schedule', /Activity grid and synchronized Gantt/i],
    ['wbs', /Work breakdown structure/i],
    ['control-overview', /Control center/i],
    ['executive', /Executive project summary/i],
    ['reports', /Report catalog/i],
    ['enterprise', /Dashboard configuration moved to Overview/i]
  ] as const) {
    await openWorkspaceSection(page, section);
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
    await expectNoBlockingAccessibilityViolations(page);
  }
});

test('dashboard selection and hidden navigation persist through reload', async ({ page }) => {
  await openSample(page);
  await page.getByRole('button', { name: 'Hide project navigation' }).click();
  await expect(page.getByRole('button', { name: 'Show project navigation' })).toHaveAttribute('aria-expanded', 'false');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show project navigation' })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Show project navigation' }).click();

  await page.getByRole('button', { name: 'Customize dashboard' }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose dashboard items' });
  await dialog.getByRole('checkbox', { name: /^Overall progress/ }).uncheck();
  await dialog.getByRole('button', { name: 'Apply dashboard' }).click();
  await expect(page.locator('.dashboard-grid').getByText('Overall progress', { exact: true })).toHaveCount(0);
});

test('focused data views restore focus with Escape', async ({ page }) => {
  await openSample(page);
  const focus = page.getByRole('button', { name: 'Focus S-curve' });
  await focus.click();
  await expect(page.locator('body')).toHaveClass(/data-view-focus-active/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/data-view-focus-active/);
  await expect(focus).toBeFocused();
});

test('new projects are committed before returning to the library', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project' }).click();
  const heading = page.getByRole('heading', { name: /New Project/i }).first();
  await expect(heading).toBeVisible();
  const projectName = (await heading.textContent())?.trim() ?? 'New Project';
  await page.getByRole('button', { name: /Return to project library/i }).click();
  await expect(page.getByRole('heading', { name: projectName, exact: true }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: projectName, exact: true }).first()).toBeVisible();
});

test('installed PWA shell and active project reload offline in Chromium', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service-worker offline qualification runs in Chromium.');
  await openSample(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /Offline mode — scheduling/i })).toBeVisible();
});
