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
  const desktopNavigation = page.locator('.workspace-sidebar:visible');
  if (await desktopNavigation.count()) {
    const desktopButton = desktopNavigation.getByRole('button', { name: section, exact: true });
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
  expect(dimensions.documentWidth, `${context} widened the document to ${dimensions.documentWidth}px for a ${dimensions.viewportWidth}px viewport.`).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  expect(dimensions.bodyWidth, `${context} widened the body to ${dimensions.bodyWidth}px for a ${dimensions.viewportWidth}px viewport.`).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function fillNumericInput(locator: import('@playwright/test').Locator, expression: string): Promise<void> {
  await locator.fill(expression);
  await locator.press('Enter');
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

test('numeric inputs stay blank and restore incomplete state when cleared', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  await openWorkspaceSection(page, 'duration');

  const quantity = page.getByLabel(/^Quantity \(/);
  await expect(quantity).toHaveValue('');
  await expect(page.getByText(/Enter quantity to calculate the duration/i)).toBeVisible();

  await fillNumericInput(quantity, '12 × 3.5');
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
  const areaRow = page.getByRole('row').filter({ hasText: 'MOB-004' });
  await expect(areaRow).toContainText('m²');
  await expect(areaRow).not.toContainText('m2');

  await search.fill('CON-003');
  const volumeRow = page.getByRole('row').filter({ hasText: 'CON-003' });
  await expect(volumeRow).toContainText('m³');
  await expect(volumeRow).not.toContainText('m3');

  await search.fill('ELE-003');
  const cableRow = page.getByRole('row').filter({ hasText: 'ELE-003' });
  await expect(cableRow).toContainText('35 mm²');
  await expect(cableRow).not.toContainText('35 mm2');
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
    return [...form.querySelectorAll('input, select, .numeric-input-control')]
      .map((element) => {
        const rectangle = element.getBoundingClientRect();
        return { element: element.tagName.toLowerCase(), left: rectangle.left, right: rectangle.right, containerLeft: container.left, containerRight: container.right };
      })
      .filter((rectangle) => rectangle.left < container.left - 1 || rectangle.right > container.right + 1);
  });
  expect(outOfBoundsControls).toEqual([]);
});

test('project workspace supports full-screen mode with a visible exit control', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  const enterButton = page.getByRole('button', { name: 'Enter full screen' });
  await expect(enterButton).toBeVisible();
  await enterButton.click();

  const exitButton = page.getByRole('button', { name: 'Exit full screen' });
  await expect(exitButton).toBeVisible();
  await expect(exitButton).toHaveAttribute('aria-pressed', 'true');
  await exitButton.click();
  await expect(page.getByRole('button', { name: 'Enter full screen' })).toBeVisible();
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

test('numeric inputs accept arithmetic expressions across project-control workspaces', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  const viewport = page.viewportSize();

  await openWorkspaceSection(page, 'schedule');
  if (viewport && viewport.width <= 600) {
    await page.locator('.mobile-activity-card > button').first().click();
    const durationInput = page.locator('dialog.mobile-activity-editor').getByLabel('Duration').first();
    await fillNumericInput(durationInput, '7/2');
    await expect(durationInput).toHaveValue('3.5');
    await page.getByRole('button', { name: /Close activity editor/i }).click();
  } else {
    const activityDuration = page.getByLabel(/Duration for/i).first();
    await fillNumericInput(activityDuration, '6/2');
    await expect(activityDuration).toHaveValue('3');
  }

  await openWorkspaceSection(page, 'risk');
  const optimisticDuration = page.getByLabel(/optimistic duration for/i).first();
  await fillNumericInput(optimisticDuration, '8/2');
  await expect(optimisticDuration).toHaveValue('4');

  await openWorkspaceSection(page, 'controls');
  const actualCost = page.getByRole('textbox', { name: 'Actual cost amount', exact: true });
  await fillNumericInput(actualCost, '1000+250');
  await expect(actualCost).toHaveValue('1250');

  await openWorkspaceSection(page, 'progress');
  const remainingDuration = page.getByLabel(/Remaining duration for/i).first();
  await fillNumericInput(remainingDuration, '6/2');
  await expect(remainingDuration).toHaveValue('3');

  await openWorkspaceSection(page, 'duration');
  const quantity = page.getByLabel(/^Quantity \(/);
  await fillNumericInput(quantity, '1000/4');
  await expect(quantity).toHaveValue('250');
});

test('numeric calculator dialogs evaluate formulas', async ({ page }) => {
  await page.getByRole('button', { name: /Open workspace/i }).first().click();
  const viewport = page.viewportSize();

  if (!viewport || viewport.width > 600) {
    await openWorkspaceSection(page, 'schedule');
    await page.getByRole('button', { name: /Open calculator for duration for/i }).first().click();
    const scheduleDialog = page.getByRole('dialog', { name: /Calculator for duration for/i });
    await scheduleDialog.getByLabel('Expression').fill('(12 + 6) / 3');
    await expect(scheduleDialog.locator('.calculator-result strong')).toHaveText('6');
    await scheduleDialog.getByRole('button', { name: 'Use result' }).click();
    await expect(page.getByLabel(/Duration for/i).first()).toHaveValue('6');
  }

  await openWorkspaceSection(page, 'controls');
  await page.getByRole('button', { name: /Open calculator for actual cost amount/i }).click();
  const costDialog = page.getByRole('dialog', { name: /Calculator for actual cost amount/i });
  await costDialog.getByLabel('Expression').fill('1,200.50 + 300');
  await expect(costDialog.locator('.calculator-result strong')).toHaveText('1500.5');
  await costDialog.getByRole('button', { name: 'Use result' }).click();
  await expect(page.getByRole('textbox', { name: 'Actual cost amount', exact: true })).toHaveValue('1500.5');
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
