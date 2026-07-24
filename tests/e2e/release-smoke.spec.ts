import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function expectNoSeriousAccessibilityViolations(page: import('@playwright/test').Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter((violation) => violation.impact === 'critical' || violation.impact === 'serious');
  expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join('\n')).toEqual([]);
}

async function openWorkspaceSection(page: import('@playwright/test').Page, section: string): Promise<void> {
  const desktopButton = page.getByRole('button', { name: section, exact: true });
  if (await desktopButton.isVisible()) {
    await desktopButton.click();
    return;
  }
  await page.getByLabel('Workspace section').selectOption(section);
}

async function expectNoHorizontalViewportOverflow(page: import('@playwright/test').Page, context: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));
  expect(dimensions.documentWidth, `${context} widened the document to ${dimensions.documentWidth}px for a ${dimensions.viewportWidth}px viewport.`).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.bodyWidth, `${context} widened the body to ${dimensions.bodyWidth}px for a ${dimensions.viewportWidth}px viewport.`).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Plan, calculate, recover/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open workspace/i }).first()).toBeVisible();
});

test('project library and professional Phase F-H workspaces pass automated WCAG checks', async ({ page }) => {
  await expectNoSeriousAccessibilityViolations(page);
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();

  await openWorkspaceSection(page, 'schedule');
  await expect(page.getByRole('heading', { name: /Activity grid and synchronized Gantt/i })).toBeVisible();
  await expect(page.getByText(/Columns \(/i)).toBeVisible();
  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 600) {
    await expect(page.getByLabel('Mobile activity list')).toBeVisible();
  } else {
    await expect(page.getByRole('grid', { name: /Activity schedule spreadsheet/i })).toBeVisible();
  }
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'wbs');
  await expect(page.getByRole('heading', { name: /Work breakdown structure/i })).toBeVisible();
  await expect(page.getByRole('treegrid', { name: /Work breakdown structure hierarchy/i })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'control-overview');
  await expect(page.getByRole('heading', { name: 'Control center' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Items requiring attention/i })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'executive');
  await expect(page.getByRole('heading', { name: /Executive project summary/i })).toBeVisible();
  await expect(page.getByText(/Definition and source/i).first()).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'reports');
  await expect(page.getByRole('heading', { name: 'Report catalog' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Critical path' })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'dictionary');
  await expect(page.getByRole('heading', { name: 'Activity dictionary' })).toBeVisible();
  await expect(page.getByText(/baseline activities from permits and soil investigation/i)).toBeVisible();

  await openWorkspaceSection(page, 'duration');
  await expect(page.getByRole('heading', { name: /Productivity-based duration calculator/i })).toBeVisible();

  await openWorkspaceSection(page, 'enterprise');
  await expect(page.getByRole('heading', { name: /Enterprise reporting and audit/i })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test('activity spreadsheet supports saved views, column management, and keyboard focus movement', async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width <= 600, 'Desktop spreadsheet behavior is qualified in desktop engines; compact activity editing has a dedicated mobile workflow.');

  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await openWorkspaceSection(page, 'schedule');
  await expect(page.getByRole('grid', { name: /Activity schedule spreadsheet/i })).toBeVisible();

  await page.getByText(/Columns \(/i).click();
  await expect(page.getByLabel('Early start')).toBeVisible();
  await page.getByLabel('Early start').check();
  await expect(page.getByRole('columnheader', { name: 'Early start' })).toBeVisible();

  const firstActivityName = page.getByLabel(/Activity name for/i).first();
  await firstActivityName.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator(':focus')).toBeVisible();

  await page.getByRole('button', { name: 'Save view' }).click();
  await page.getByLabel('View name').fill('Critical review');
  await page.getByRole('dialog').getByRole('button', { name: 'Save view' }).click();
  await expect(page.getByRole('button', { name: 'Critical review', exact: true })).toBeVisible();
});

test('mobile workspaces contain forms without page-level horizontal overflow', async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 600, 'This regression covers the compact mobile workbench.');

  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();

  const sections = [
    'schedule', 'dictionary', 'duration', 'wbs', 'network', 'logic', 'calendars',
    'control-overview', 'progress', 'boq', 'controls', 'risk',
    'executive', 'reports', 'enterprise', 'project', 'recovery'
  ];

  for (const section of sections) {
    await openWorkspaceSection(page, section);
    await expect(page.getByLabel('Workspace section')).toHaveValue(section);
    await expectNoHorizontalViewportOverflow(page, section);
  }

  await openWorkspaceSection(page, 'schedule');
  await expect(page.getByLabel('Mobile activity list')).toBeVisible();
  await page.locator('.mobile-activity-card > button').first().click();
  await expect(page.locator('dialog.mobile-activity-editor')).toBeVisible();
  await page.getByRole('button', { name: /Close activity editor/i }).click();

  await openWorkspaceSection(page, 'duration');
  const outOfBoundsControls = await page.locator('.duration-form').evaluate((form) => {
    const container = form.getBoundingClientRect();
    return [...form.querySelectorAll('input, select, .input-with-suffix')]
      .map((element) => {
        const rectangle = element.getBoundingClientRect();
        return { element: element.tagName.toLowerCase(), left: rectangle.left, right: rectangle.right, containerLeft: container.left, containerRight: container.right };
      })
      .filter((rectangle) => rectangle.left < container.left - 1 || rectangle.right > container.right + 1);
  });
  expect(outOfBoundsControls).toEqual([]);
});

test('keyboard navigation reaches primary project actions', async ({ page }) => {
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
  await expect(focused).toHaveAccessibleName(/Appearance|New project|Duplicate sample|Import|Search|active/i);
});

test('appearance selection persists locally without a theme flash', async ({ page }) => {
  await page.getByRole('button', { name: 'Open appearance settings' }).click();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  await page.locator('label.theme-option').filter({ hasText: 'Night Shift' }).click();
  await expect(page.getByRole('radio', { name: /Night Shift/i })).toBeChecked();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night-shift');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'night-shift');
});

test('a newly created project persists after reload', async ({ page }) => {
  await page.getByRole('button', { name: 'New project' }).click();
  await expect(page.getByRole('heading', { name: /New Project/i })).toBeVisible();
  await page.getByRole('button', { name: /Return to project library/i }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: /New Project/i }).first()).toBeVisible();
});

test('installed PWA shell reloads without a network in Chromium', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service-worker offline drill is qualified in Chromium; Firefox and WebKit receive online compatibility smoke coverage.');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Plan, calculate, recover/i })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: /Offline mode — scheduling/i })).toBeVisible();
});
