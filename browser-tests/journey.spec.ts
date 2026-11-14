import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
}
async function sync(page: Page) {
  await page.getByRole('button', { name: 'Load readings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reload readings', exact: true })).toBeEnabled();
}
async function complete(page: Page, name = 'Alex') {
  await sync(page);
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('heading', { name: `A clearer picture, ${name}.` })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Daily check-in', exact: true })).toBeEnabled();
}
async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open navigation' });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name, exact: true }).click();
}

async function injectFailure(page: Page, mode: 'standard' | 'replay', scenario: 'source-gap' | 'engine-fault') {
  await page.addInitScript(({ mode, scenario }) => {
    const put = IDBObjectStore.prototype.put;
    let injected = false;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (!injected && typeof value === 'object' && value !== null && 'mode' in value && value.mode === mode) {
        const workspace = value as { scenario: string; engineFault: boolean };
        workspace.scenario = scenario;
        workspace.engineFault = scenario === 'engine-fault';
        injected = true;
      }
      return key === undefined ? put.call(this, value) : put.call(this, value, key);
    };
  }, { mode, scenario });
}

test('daily check-in automatically records supplemental data and completion without demo controls', async ({ page }) => {
  await signIn(page);
  await expect(page.getByText('No devices are connected. Readings are generated locally.', { exact: true })).toHaveCount(0);
  await page.getByLabel('Sleep hours', { exact: true }).fill('8.5');
  await complete(page);
  await expect(page.getByRole('button', { name: 'Generate demo readings' })).toHaveCount(0);
  await expect(page.getByText('Assessment completion is not recorded', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Coverage confirmed by user', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Sleep last recorded/ })).toContainText('8.5');
  await expect(page.locator('.dashboard-left .routine-card')).not.toContainText('A completed task is not evidence that a health finding has resolved.');
  await navigate(page, 'Your routine');
  await expect(page.getByText('A completed task is not evidence that a health finding has resolved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo Log your physical assessment', exact: true })).toBeVisible();
  await navigate(page, 'Observation timeline');
  await expect(page.getByRole('row').filter({ hasText: 'Environmental radiation and neutron monitoring' })).toHaveCount(8);
  await expect(page.getByRole('row').filter({ hasText: 'Environmental radiation and neutron monitoring' }).first()).toContainText('mSv/day');
  await page.reload();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.getByText('Assessment completion is not recorded', { exact: true })).toHaveCount(0);
});

test('body findings follow daily inference results with more than three, one, or no findings', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.99; });
  await signIn(page);
  await complete(page);
  const legend = page.getByRole('group', { name: 'Current inference findings' });
  const count = await legend.getByRole('button').count();
  expect(count).toBeGreaterThan(3);
  await expect(page.locator('.finding-row')).toHaveCount(count);
  await legend.getByRole('button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.evaluate(() => { Math.random = () => 0.5; });
  await page.getByRole('button', { name: 'Daily check-in', exact: true }).click();
  await page.getByLabel('Perceived fatigue', { exact: true }).selectOption('false');
  await page.getByLabel('Private mood', { exact: true }).selectOption('steady');
  await page.getByLabel('Private digestive check-in', { exact: true }).selectOption('none');
  await complete(page);
  await expect(legend.getByRole('button')).toHaveCount(1);
  await expect(legend).toContainText('Sleep differs from your plan');
  await expect(page.locator('.finding-row')).toHaveCount(1);
  await legend.getByRole('button').click();
  await expect(page.getByRole('dialog')).toContainText('SleepBelowPlan / SleepAndFatigue');
  await page.getByRole('button', { name: 'Close dialog' }).click();

  await page.getByRole('button', { name: 'Daily check-in', exact: true }).click();
  await page.getByLabel('Sleep hours', { exact: true }).fill('8.5');
  await complete(page);
  await expect(legend.getByRole('button')).toHaveCount(0);
  await expect(legend).toContainText('No current findings');
  await expect(page.locator('.finding-row')).toHaveCount(0);
});

test('patterns switch numeric indicators, units, references, and scale without losing zero values', async ({ page }, testInfo) => {
  await signIn(page);
  await page.getByLabel('Fluid intake', { exact: true }).fill('0');
  await complete(page);
  const trend = page.getByRole('region', { name: 'Numeric observation trends' });
  if (testInfo.project.name === 'desktop') {
    const body = await page.getByRole('region', { name: 'Body navigator' }).boundingBox();
    const routine = await page.locator('.dashboard-left .routine-card').boundingBox();
    const chart = await trend.boundingBox();
    const right = await page.locator('.dashboard-right').boundingBox();
    expect(body && routine && chart && right).toBeTruthy();
    expect(Math.abs(routine!.x - body!.x)).toBeLessThan(2);
    expect(routine!.y).toBeGreaterThan(body!.y + body!.height);
    expect(chart!.x).toBeGreaterThan(routine!.x + routine!.width);
    expect(Math.abs(chart!.width - right!.width)).toBeLessThan(2);
  }
  const selector = trend.getByLabel('Trend indicator', { exact: true });
  await expect(selector.getByRole('option', { name: /Private mood/ })).toHaveCount(0);
  await selector.selectOption('heartRate');
  await expect(trend.getByRole('heading')).toHaveText('Resting heart rate, over time');
  await expect(trend.getByRole('img')).toHaveAccessibleName(/Resting heart rate trend in bpm/);
  await expect(trend.locator('circle')).toHaveCount(7);
  await trend.getByRole('button', { name: 'View data', exact: true }).click();
  await expect(trend.getByRole('columnheader', { name: 'Value (bpm)', exact: true })).toBeVisible();
  await expect(trend.getByRole('row')).toHaveCount(8);

  await selector.selectOption('environmentalRadiation');
  await expect(trend.getByRole('columnheader', { name: 'Value (mSv/day)', exact: true })).toBeVisible();
  await expect(trend.getByRole('row')).toHaveCount(8);
  await trend.getByRole('button', { name: 'Show chart', exact: true }).click();
  await expect(trend.locator('circle')).toHaveCount(7);
  await expect(trend.locator('.chart-legend')).toContainText('0.2-0.5 mSv/day example range');

  await selector.selectOption('fluid');
  await expect(trend.locator('.chart-legend .plan')).toHaveCount(0);
  await expect(trend.locator('circle title').last()).toContainText('0 mL');
  const point = trend.locator('circle').last();
  expect(Number(await point.getAttribute('cy'))).toBeGreaterThanOrEqual(30);
  expect(Number(await point.getAttribute('cy'))).toBeLessThanOrEqual(175);
  await trend.getByRole('button', { name: 'View data', exact: true }).click();
  await expect(trend.getByRole('cell', { name: '0', exact: true })).toBeVisible();

  await navigate(page, 'Observation timeline');
  await page.getByText('Add an input', { exact: true }).click();
  const entry = page.locator('.catalog-entry');
  await entry.getByRole('combobox').selectOption('bodyTemperature');
  for (const value of ['-20', '1500']) {
    await entry.getByRole('spinbutton').fill(value);
    await entry.getByRole('button', { name: 'Save input', exact: true }).click();
    await expect(entry.getByRole('spinbutton')).toHaveValue('');
  }
  await navigate(page, 'Health overview');
  await selector.selectOption('bodyTemperature');
  await expect(trend.getByRole('img')).toHaveAccessibleName(/Body temperature trend in °C/);
  await expect(trend.locator('circle')).toHaveCount(7);
  const coordinates = await trend.locator('circle').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('cy'))));
  expect(coordinates.every(y => Number.isFinite(y) && y >= 30 && y <= 175)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('patterns omit missing and superseded entries instead of plotting them as zero', async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
      if (typeof value === 'object' && value !== null && 'observations' in value && Array.isArray(value.observations)) {
        for (const observation of value.observations) {
          if (observation.indicator === 'environmentalRadiation') {
            observation.availability = 'missing';
            observation.value = null;
          }
          if (observation.indicator === 'fluid') observation.value = 0;
        }
      }
      return key === undefined ? put.call(this, value) : put.call(this, value, key);
    };
  });
  await signIn(page);
  await page.getByLabel('Sleep hours', { exact: true }).fill('5.1');
  await complete(page);
  const trend = page.getByRole('region', { name: 'Numeric observation trends' });
  await trend.getByLabel('Trend indicator', { exact: true }).selectOption('environmentalRadiation');
  await expect(trend.getByText('No recorded values', { exact: true })).toBeVisible();
  await expect(trend.getByRole('img')).toHaveCount(0);
  await trend.getByLabel('Trend indicator', { exact: true }).selectOption('fluid');
  const flatPoints = await trend.locator('circle').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('cy'))));
  expect(flatPoints).toHaveLength(7);
  expect(flatPoints.every(y => Number.isFinite(y) && y >= 30 && y <= 175)).toBe(true);
  expect(new Set(flatPoints).size).toBe(1);
  await page.getByRole('button', { name: 'Daily check-in', exact: true }).click();
  await page.getByLabel('Sleep hours', { exact: true }).fill('8.3');
  await complete(page);
  await trend.getByRole('button', { name: 'View data', exact: true }).click();
  await expect(trend.getByRole('cell', { name: '8.3', exact: true })).toBeVisible();
  await expect(trend.getByRole('cell', { name: '5.1', exact: true })).toHaveCount(0);
  await expect(trend.getByRole('row')).toHaveCount(8);
});

test('complete journey, body-map links, corrections, notice separation, reload and private-safe export', async ({ page }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4175/')) externalRequests.push(request.url());
  });
  await signIn(page);
  const checkin = page.getByRole('form', { name: 'Daily check-in and source readings' });
  await expect(checkin.getByRole('heading', { name: 'Source readings' })).toBeVisible();
  await expect(checkin).not.toContainText('Force an assessment-source outage');
  await expect(checkin.getByText('I confirm that this fluid log')).toHaveCount(0);
  await expect(checkin.getByText('Not loaded')).toHaveCount(2);
  await expect(checkin.getByRole('status')).toContainText('Load readings before saving your check-in.');
  await expect(checkin.getByRole('button', { name: 'Save & analyse' })).toHaveAttribute('aria-describedby', 'checkin-guidance');
  const groupBox = await checkin.boundingBox();
  const actionBox = await checkin.locator('.checkin-actions').boundingBox();
  expect(groupBox).not.toBeNull();
  expect(actionBox).not.toBeNull();
  expect(Math.abs(groupBox!.width - actionBox!.width)).toBeLessThan(3);
  await expect(page.getByRole('button', { name: 'Save & analyse', exact: true })).toBeDisabled();
  await complete(page);
  await page.getByRole('button', { name: 'Physical performance: 1 findings', exact: true }).press('Enter');
  await page.getByRole('button', { name: /Physical performance needs review/ }).click();
  await expect(page.getByRole('dialog')).toContainText('StrengthRatio / StrengthBelowReference');
  await expect(page.getByRole('dialog')).toContainText('40 kgf');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('group', { name: 'Original Da Vinci-inspired body navigator' })).toBeVisible();
  await page.getByRole('button', { name: /Notifications, \d+ unread/ }).click();
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Acknowledged · finding may still apply');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('button', { name: 'Physical performance: 1 findings', exact: true })).toBeVisible();
  await navigate(page, 'Your routine');
  await expect(page.getByRole('button', { name: 'Undo Log your physical assessment', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Daily check-in', exact: true }).click();
  await page.getByLabel('Sleep hours', { exact: true }).fill('8.2');
  await page.getByLabel('Perceived fatigue', { exact: true }).selectOption('false');
  await page.getByLabel('Private mood', { exact: true }).selectOption('steady');
  await page.getByLabel('Private digestive check-in', { exact: true }).selectOption('none');
  await complete(page);
  await expect(page.getByRole('button', { name: /Make room for recovery/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Physical performance: 1 findings', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Original Da Vinci-inspired body navigator' })).toBeVisible();
  await page.getByRole('button', { name: 'Export summary', exact: true }).click();
  await expect(page.locator('.export-preview')).not.toContainText('"indicator": "mood"');
  await expect(page.locator('.export-preview')).not.toContainText('"indicator": "bowel"');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON summary' }).click();
  expect((await download).suggestedFilename()).toBe('st-ha-alex-standard-summary.json');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await navigate(page, 'Observation timeline');
  await page.getByLabel('Include original / corrected revisions').check();
  await expect(page.getByText('r2 · correction').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('partial source failure and optional declined fields stay distinct from healthy results', async ({ page }) => {
  await injectFailure(page, 'standard', 'source-gap');
  await signIn(page);
  await page.getByLabel('Sleep hours', { exact: true }).fill('');
  await page.getByLabel('Private mood', { exact: true }).selectOption('declined');
  await page.getByLabel('Private digestive check-in', { exact: true }).selectOption('declined');
  await sync(page);
  await expect(page.getByRole('button', { name: 'Save & analyse', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('Assessment source is unavailable');
  await expect(page.locator('#checkin-guidance')).toContainText('Confirm how to proceed');
  await page.getByLabel('Continue with incomplete source data').check();
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Sleep comparison unavailable/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /A current assessment is needed/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Digestive changes you reported/ })).toHaveCount(0);
});

test('scenario readings update the dashboard without changing saved history', async ({ page }) => {
  await signIn(page);
  await complete(page);
  await navigate(page, 'Scenario lab');
  await expect(page.getByRole('region', { name: 'Scenario dashboard' }).getByRole('status')).toHaveText('Analysis updated');
  await page.getByLabel('Sleep duration', { exact: true }).fill('9');
  await expect(page.getByRole('region', { name: 'Scenario dashboard' }).getByRole('status')).toHaveText('Analysis updated');
  await expect(page.getByRole('region', { name: 'Scenario dashboard' }).getByRole('button', { name: /Sleep last recorded/ })).toContainText('9');
  await navigate(page, 'Health overview');
  await expect(page.getByRole('button', { name: /Sleep last recorded/ })).toContainText('6.2');
});

test('save failure is visible and never transitions to a successful analysis', async ({ page }) => {
  await signIn(page);
  await sync(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () { throw new DOMException('Simulated storage limit', 'QuotaExceededError'); };
  });
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Simulated storage limit');
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toHaveCount(0);
});

test('another tab cannot silently overwrite a newer revision; unsaved form edits remain intact', async ({ page, context }) => {
  await signIn(page);
  await complete(page);
  await page.getByRole('button', { name: 'Daily check-in', exact: true }).click();
  await page.getByLabel('Sleep hours', { exact: true }).fill('9');
  await sync(page);
  const other = await context.newPage();
  await other.goto('/');
  await other.getByRole('button', { name: 'Enter mission workspace' }).click();
  await navigate(other, 'Your routine');
  await other.getByRole('button', { name: 'Complete Log your physical assessment', exact: true }).click();
  await expect(other.getByRole('button', { name: 'Undo Log your physical assessment', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Another tab changed this workspace');
  await expect(page.getByLabel('Sleep hours', { exact: true })).toHaveValue('9');
});

test('a non-responsive worker times out explicitly, then retries the already saved snapshot', async ({ page }) => {
  await page.route('**/engine.worker-*.js', route => route.fulfill({
    status: 200, contentType: 'text/javascript', body: '/* Unresponsive worker test fixture. */',
  }));
  await signIn(page);
  await sync(page);
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('5-second execution limit', { timeout: 8000 });
  await page.unroute('**/engine.worker-*.js');
  await page.getByRole('button', { name: 'Retry saved analysis', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
});

test('sign-out cancels outstanding inference and does not resurrect the previous persona', async ({ page }) => {
  await page.clock.install();
  await page.route('**/engine.worker-*.js', route => route.fulfill({
    status: 200, contentType: 'text/javascript', body: '/* Unresponsive worker test fixture. */',
  }));
  await signIn(page);
  await sync(page);
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByText('Analysing saved snapshot…', { exact: true }).first()).toBeVisible();
  const menu = page.getByRole('button', { name: 'Open navigation' });
  if (await menu.isVisible()) {
    await page.getByRole('banner').getByRole('button', { name: 'Sign out', exact: true }).click();
  } else {
    await page.locator('.crew-profile').getByRole('button', { name: 'Sign out', exact: true }).click();
  }
  await expect(page.getByRole('heading', { name: 'Welcome aboard.' })).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(page.getByRole('heading', { name: 'Welcome aboard.' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('open explanations retain their evaluation snapshot across active-session refresh', async ({ page }) => {
  await page.clock.install();
  await signIn(page);
  await complete(page);
  const before = await page.locator('.sync-status').innerText();
  await page.getByRole('button', { name: /Make room for recovery/ }).click();
  const trace = await page.getByRole('dialog').locator('.details-grid').innerText();
  await page.clock.fastForward(61_000);
  await expect.poll(async () => {
    const text = await page.locator('.sync-status').innerText();
    return text.startsWith('Analysed ') && text !== before;
  }).toBe(true);
  await expect(page.getByRole('dialog').locator('.details-grid')).toHaveText(trace, { useInnerText: true });
  await page.getByRole('dialog').getByRole('button', { name: 'Close dialog' }).press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('persona switching and confirmed reset preserve the other persona; browser watch controls are honest', async ({ page }) => {
  async function signOut() {
    const mobile = await page.getByRole('button', { name: 'Open navigation' }).isVisible();
    await page.locator(mobile ? '.topbar' : '.crew-profile').getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Welcome aboard.' })).toBeVisible();
  }
  await signIn(page);
  await complete(page);
  await signOut();
  await page.getByRole('button', { name: /Maya Chen Flight engineer/ }).click();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
  await complete(page, 'Maya');
  await expect(page.locator('.metric.pulse .metric-number')).toContainText('71');
  await navigate(page, 'Settings & devices');
  await expect(page.getByRole('button', { name: 'Send a reminder' })).toBeDisabled();
  await expect(page.getByLabel('Request device reminders')).toBeDisabled();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset this workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
  await signOut();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.locator('.metric.pulse .metric-number')).toContainText('74');
});

test('existing saved routine details use the streamlined wording', async ({ page }) => {
  await signIn(page);
  await complete(page);
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('hecatron-local-v1', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction('workspaces', 'readwrite');
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
      const store = transaction.objectStore('workspaces');
      const get = store.get('alex/standard');
      get.onsuccess = () => {
        const workspace = get.result;
        workspace.tasks.find((task: { kind: string }) => task.kind === 'assessment').detail =
          'Record the result of the fictional, like-for-like handgrip test. Do not perform an unsupported test.';
        store.put(workspace);
      };
    };
  }));
  await page.reload();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await navigate(page, 'Your routine');
  await expect(page.getByText('Record the result of the handgrip assessment. Do not perform an unsupported assessment.')).toBeVisible();
});

test('responsive layouts use larger type without horizontal overflow', async ({ page }) => {
  const widths = [320, 393, 680, 681, 850, 1024, 1151, 1440, 1650, 1920];
  await page.goto('/');
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    const sizes = await page.evaluate(() => ({
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      profile: parseFloat(getComputedStyle(document.querySelector('.profile-option strong')!).fontSize),
      intro: parseFloat(getComputedStyle(document.querySelector('.login-access-inner > .muted')!).fontSize),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    expect(sizes.root).toBeGreaterThanOrEqual(width >= 681 ? 18 : 16);
    expect(sizes.profile).toBeGreaterThanOrEqual(width >= 681 ? 18 : 16);
    expect(sizes.intro).toBeGreaterThanOrEqual(width >= 681 ? 18 : 16);
    expect(sizes.overflow).toBe(false);
  }
  await signIn(page);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
  await complete(page);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test('ST-HA uses a dark-blue theme and shows the locally bundled team logo in both About entry points', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4175/')) externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('Space Tiger Health Assistant (ST-HA)');
  await expect(page.getByText('Space Tiger Health Assistant', { exact: true })).toBeVisible();
  await expect(page.locator('.login-access')).not.toContainText(/synthetic|demo|asteria/i);
  await expect(page.locator('.login-access')).toContainText('no account authentication');
  await page.getByRole('button', { name: 'About & credits', exact: true }).click();
  const logo = page.getByRole('img', { name: /Space Tigers team logo/ });
  await expect(logo).toBeVisible();
  await expect(logo).toHaveJSProperty('complete', true);
  expect(await logo.evaluate((image: HTMLImageElement) => ({
    loaded: image.complete && image.naturalWidth === 300 && image.naturalHeight === 250,
    local: new URL(image.src).origin === location.origin,
  }))).toEqual({ loaded: true, local: true });
  await expect(page.getByRole('dialog')).toContainText('NASA-endorsed product');
  await expect(page.getByRole('dialog')).toContainText('no sensors or backend are connected');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
  await expect(page.getByText('No devices are connected. Readings are generated locally.')).toBeVisible();
  await complete(page);
  await expect(page.locator('.context-strip')).not.toContainText(/asteria|mission day 42|microgravity/i);
  await expect(page.locator('.source-footer')).toContainText('Local readings · no devices connected');
  await navigate(page, 'About & credits');
  await expect(page.getByRole('heading', { name: 'About & credits', exact: true })).toBeVisible();
  await expect(logo).toBeVisible();
  const palette = await page.locator('.about-copy > p:not(.eyebrow)').first().evaluate(element => {
    const rgb = (color: string) => (color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
    const foreground = rgb(getComputedStyle(element).color);
    const background = rgb(getComputedStyle(element.closest('.card')!).backgroundColor);
    const root = getComputedStyle(document.documentElement);
    const luminance = (channels: number[]) => channels.map(value => {
      const channel = value / 255;
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index]!, 0);
    const light = luminance(foreground);
    const dark = luminance(background);
    return {
      blueDominant: background[2]! > background[0]! && background[2]! > background[1]!,
      dark: dark < .05,
      scheme: root.colorScheme,
      contrast: (Math.max(light, dark) + .05) / (Math.min(light, dark) + .05),
    };
  });
  expect(palette.blueDominant).toBe(true);
  expect(palette.dark).toBe(true);
  expect(palette.scheme).toBe('dark');
  expect(palette.contrast).toBeGreaterThanOrEqual(4.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(externalRequests).toEqual([]);
});
