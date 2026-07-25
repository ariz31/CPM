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
  const desktopNavigation = page.locator('.workspace-sidebar');
  if (await desktopNavigation.isVisible()) {
    const desktopButton = desktopNavigation.locator('button').filter({
      has: desktopNavigation.locator('small').filter({ hasText: new RegExp(`^${section}$`, 'i') })
    });
    await expect(desktopButton).toBeVisible();
    await desktopButton.click();
    return;
  }
  const mobileSelect = page.getByLabel('Workspace section');
  await expect(mobileSelect).toBeVisible();
  await mobileSelect.selectOption(section);
}

async function expectNoHorizontalViewportOverflow(page: import('@playwright/test').Page, context: string): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth
  }));

  expect(
    dimensions.documentWidth,
    `${context} widened the document to ${dimensions.documentWidth}px for a ${dimensions.viewportWidth}px viewport.`
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(
    dimensions.bodyWidth,
    `${context} widened the body to ${dimensions.bodyWidth}px for a ${dimensions.viewportWidth}px viewport.`
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Plan, calculate, recover/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open workspace/i }).first()).toBeVisible();
});

test('project library and responsive workbench pass automated WCAG checks', async ({ page }) => {
  await expectNoSeriousAccessibilityViolations(page);
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'dictionary');
  await expect(page.getByRole('heading', { name: 'Activity dictionary' })).toBeVisible();
  await expect(page.getByText(/baseline activities from permits and soil investigation/i)).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'duration');
  await expect(page.getByRole('heading', { name: /Productivity-based duration calculator/i })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'enterprise');
  await expect(page.getByRole('heading', { name: /Enterprise reporting and audit/i })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test('dashboard configuration and sidebar visibility persist locally', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
  await expect(page.getByText('Schedule duration', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Budget at completion', { exact: true }).first()).toBeVisible();

  const navigationToggle = page.getByRole('button', { name: 'Hide project navigation' });
  await navigationToggle.click();
  await expect(page.locator('.workspace-sidebar')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Show project navigation' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Show project navigation' })).toBeVisible();
  await page.getByRole('button', { name: 'Show project navigation' }).click();
  await expect(page.locator('.workspace-sidebar')).toBeVisible();

  await page.getByRole('button', { name: 'Customize dashboard' }).click();
  const dialog = page.getByRole('dialog', { name: 'Choose dashboard items' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Overall progress').uncheck();
  await dialog.getByRole('button', { name: 'Apply dashboard' }).click();
  await expect(page.getByText('Overall progress', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: /Saved locally/i })).toBeVisible();
});

test('individual charts support focused viewing and Escape restoration', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  const focus = page.getByRole('button', { name: 'Focus S-curve' });
  await expect(focus).toBeVisible();
  await focus.click();
  const focused = page.locator('.data-view-focused').filter({ has: page.getByRole('heading', { name: 'S-curve', exact: true }) });
  await expect(focused).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/data-view-focus-active/);
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).not.toHaveClass(/data-view-focus-active/);
  await expect(focus).toBeFocused();
});

test('schedule-linked workflows show activity names with stable IDs', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();

  await openWorkspaceSection(page, 'logic');
  const predecessor = page.getByLabel('Predecessor activity');
  const successor = page.getByLabel('Successor activity');
  await expect(predecessor.locator('option').first()).toHaveText('Project start (START)');
  await expect(successor).toHaveValue('A110');
  await expect(page.getByLabel('Relationship type').locator('option').first()).toHaveText('Finish to start (FS)');
  await expect(page.locator('.relationship-row').first()).toContainText('Project start');
  await expect(page.locator('.relationship-row').first()).toContainText('Site preparation');
  await expect(page.locator('.relationship-row').first()).toContainText('Finish to start');
  await expect(page.getByRole('button', { name: 'Add relationship' })).toBeEnabled();
  await expectNoSeriousAccessibilityViolations(page);

  await openWorkspaceSection(page, 'network');
  await page.getByText('Accessible network relationships').click();
  await expect(page.locator('.accessible-relationship-list li').first()).toContainText('Project start (START)');
  await expect(page.locator('.accessible-relationship-list li').first()).toContainText('Site preparation (A100)');

  await openWorkspaceSection(page, 'controls');
  await expect(page.getByLabel('Actual cost activity').locator('option').first()).toHaveText('Site preparation (A100)');
  const actualCostSection = page.getByRole('heading', { name: 'Actual costs' }).locator('xpath=ancestor::section[1]');
  await expect(actualCostSection.locator('.compact-table .compact-row').first()).toContainText('Site preparation (A100)');

  await openWorkspaceSection(page, 'risk');
  await expect(page.getByLabel('Productivity activity').locator('option').first()).toHaveText('Site preparation (A100)');
  const productivitySection = page.getByRole('heading', { name: 'Productivity forecast' }).locator('xpath=ancestor::section[1]');
  await expect(productivitySection.locator('.compact-table .compact-row').first()).toContainText('Excavation (A110)');

  await openWorkspaceSection(page, 'boq');
  await page.getByRole('button', { name: 'Details' }).first().click();
  await expect(page.getByLabel('Activity allocation for 1.1.1').locator('option').filter({ hasText: 'Excavation (A110)' })).toHaveCount(1);
});

test('numeric inputs stay blank, evaluate formulas, and restore incomplete state when cleared', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await openWorkspaceSection(page, 'duration');

  const quantity = page.getByLabel('Quantity (report)');
  await expect(quantity).toHaveValue('');
  await expect(page.getByText(/Enter quantity to calculate the duration/i)).toBeVisible();

  await page.getByRole('button', { name: 'Open calculator for quantity in report' }).click();
  const calculator = page.getByRole('dialog', { name: 'Calculator for quantity in report' });
  await expect(calculator).toBeVisible();
  await expect(calculator.locator('.calculator-keypad button')).toHaveText([
    'C', '±', '%', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '−',
    '1', '2', '3', '+',
    '0', '.', '='
  ]);
  await calculator.getByLabel('Expression').fill('12 × 3.5');
  await expect(calculator.getByText('42', { exact: true })).toBeVisible();
  await calculator.getByRole('button', { name: 'Use result' }).click();

  await expect(quantity).toHaveValue('42');
  await expect(page.getByText(/Schedule duration/i).last()).toBeVisible();

  await quantity.fill('');
  await quantity.press('Tab');
  await expect(quantity).toHaveValue('');
  await expect(page.getByText(/Enter quantity to calculate the duration/i)).toBeVisible();
});

test('activity dictionary consistently renders Unicode engineering superscripts', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await openWorkspaceSection(page, 'dictionary');

  const search = page.getByLabel('Search');
  await search.fill('MOB-004');
  const areaRow = page.locator('.dictionary-table tbody tr:visible, .dictionary-mobile-cards article:visible').filter({ hasText: 'MOB-004' });
  await expect(areaRow).toContainText('m²');
  await expect(areaRow).not.toContainText('m2');

  await search.fill('CON-003');
  const volumeRow = page.locator('.dictionary-table tbody tr:visible, .dictionary-mobile-cards article:visible').filter({ hasText: 'CON-003' });
  await expect(volumeRow).toContainText('m³');
  await expect(volumeRow).not.toContainText('m3');

  await search.fill('ELE-003');
  const cableRow = page.locator('.dictionary-table tbody tr:visible, .dictionary-mobile-cards article:visible').filter({ hasText: 'ELE-003' });
  await expect(cableRow).toContainText('35 mm²');
  await expect(cableRow).not.toContainText('35 mm2');
});

test('dictionary supports multi-selection and one atomic bulk addition', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await openWorkspaceSection(page, 'dictionary');
  await page.getByLabel('Search').fill('excavat');

  const visibleSelections = page.locator('.dictionary-table.selectable tbody input[type="checkbox"]:visible, .dictionary-mobile-cards input[type="checkbox"]:visible');
  await expect(visibleSelections.first()).toBeVisible();
  await visibleSelections.nth(0).check();
  await visibleSelections.nth(1).check();
  await expect(page.getByText('2 selected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Prepare selected' }).click();

  const dialog = page.getByRole('dialog', { name: 'Add selected activities' });
  await expect(dialog).toBeVisible();
  const quantityInputs = dialog.locator('.numeric-input');
  await expect(quantityInputs).toHaveCount(2);
  await quantityInputs.nth(0).fill('100');
  await quantityInputs.nth(1).fill('100');
  await dialog.getByRole('button', { name: 'Add 2 activities' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
});

test('mobile workspaces contain forms without page-level horizontal overflow', async ({ page }) => {
  const viewport = page.viewportSize();
  test.skip(!viewport || viewport.width > 600, 'This regression covers the compact mobile workbench.');

  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();

  const sections = [
    'dashboard',
    'schedule',
    'dictionary',
    'duration',
    'network',
    'logic',
    'calendars',
    'progress',
    'boq',
    'controls',
    'risk',
    'reports',
    'enterprise',
    'project',
    'recovery'
  ];

  for (const section of sections) {
    await openWorkspaceSection(page, section);
    await expect(page.getByLabel('Workspace section')).toHaveValue(section);
    await expectNoHorizontalViewportOverflow(page, section);
  }

  await openWorkspaceSection(page, 'duration');
  const outOfBoundsControls = await page.locator('.duration-form').evaluate((form) => {
    const container = form.getBoundingClientRect();
    return [...form.querySelectorAll('input, select, .numeric-input-control')]
      .map((element) => {
        const rectangle = element.getBoundingClientRect();
        return {
          element: element.tagName.toLowerCase(),
          left: rectangle.left,
          right: rectangle.right,
          containerLeft: container.left,
          containerRight: container.right
        };
      })
      .filter((rectangle) => rectangle.left < container.left - 1 || rectangle.right > container.right + 1);
  });
  expect(outOfBoundsControls).toEqual([]);

  const badge = await page.locator('.duration-workspace .engine-badge').boundingBox();
  const heading = await page.locator('.duration-workspace .surface-heading').first().boundingBox();
  expect(badge).not.toBeNull();
  expect(heading).not.toBeNull();
  expect(badge!.width).toBeLessThan(heading!.width * 0.6);
});

test('project workspace supports full-screen focus mode and Escape exit', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Commercial Building Reference' })).toBeVisible();

  const workspace = page.locator('.modern-workspace');
  await workspace.evaluate((element) => {
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true });
  });

  const toggle = page.locator('.workspace-fullscreen-toggle');
  await expect(toggle).toHaveAccessibleName('Enter full screen');
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Exit full screen');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(workspace).toHaveClass(/workspace-app-fullscreen/);
  await expect(page.locator('body')).toHaveClass(/workspace-fullscreen-active/);

  const viewport = page.viewportSize();
  const bounds = await workspace.boundingBox();
  expect(viewport).not.toBeNull();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeLessThanOrEqual(1);
  expect(bounds!.y).toBeLessThanOrEqual(1);
  expect(bounds!.width).toBeGreaterThanOrEqual(viewport!.width - 1);
  expect(bounds!.height).toBeGreaterThanOrEqual(viewport!.height - 1);

  await openWorkspaceSection(page, 'duration');
  await expect(page.getByRole('heading', { name: /Productivity-based duration calculator/i })).toBeVisible();
  await expectNoHorizontalViewportOverflow(page, 'full-screen duration workspace');
  await expectNoSeriousAccessibilityViolations(page);

  await page.keyboard.press('Escape');
  await expect(workspace).not.toHaveClass(/workspace-app-fullscreen/);
  await expect(page.locator('body')).not.toHaveClass(/workspace-fullscreen-active/);
  await expect(toggle).toHaveAccessibleName('Enter full screen');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
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
