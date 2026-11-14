import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
}
async function sync(page: Page) {
  await page.getByRole('button', { name: 'Sync simulated sensors', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry simulated sync', exact: true })).toBeEnabled();
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

test('complete journey, body-map links, corrections, notice separation, reload and private-safe export', async ({ page }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4175/')) externalRequests.push(request.url());
  });
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Save & analyse', exact: true })).toBeDisabled();
  await complete(page);
  await page.getByRole('button', { name: 'Physical performance: 2 findings', exact: true }).press('Enter');
  await page.getByRole('button', { name: /Physical performance needs review/ }).click();
  await expect(page.getByRole('dialog')).toContainText('StrengthRatio / StrengthBelowReference');
  await expect(page.getByRole('dialog')).toContainText('40 kgf');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Female figure', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Female figure', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Notifications, \d+ unread/ }).click();
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('Acknowledged · finding may still apply');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('button', { name: 'Physical performance: 2 findings', exact: true })).toBeVisible();
  await navigate(page, 'Your routine');
  await page.getByRole('button', { name: 'Complete Log your physical assessment', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo Log your physical assessment', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Daily check-in', exact: true }).click();
  await page.getByLabel('Sleep hours', { exact: true }).fill('8.2');
  await page.getByLabel('Perceived fatigue', { exact: true }).selectOption('false');
  await page.getByLabel('Private mood', { exact: true }).selectOption('steady');
  await page.getByLabel('Private digestive check-in', { exact: true }).selectOption('none');
  await page.getByLabel('I confirm that this fictional fluid log').check();
  await complete(page);
  await expect(page.getByRole('button', { name: /Make room for recovery/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Physical performance: 1 findings', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Female figure' })).toHaveAttribute('aria-pressed', 'true');
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
  await signIn(page);
  await page.getByLabel('Sleep hours', { exact: true }).fill('');
  await page.getByLabel('Private mood', { exact: true }).selectOption('declined');
  await page.getByLabel('Private digestive check-in', { exact: true }).selectOption('declined');
  await page.getByLabel('Simulate an assessment-source outage').check();
  await sync(page);
  await expect(page.getByRole('button', { name: 'Save & analyse', exact: true })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('Simulated assessment source is unavailable');
  await page.getByLabel('Continue with incomplete source data').check();
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Sleep comparison unavailable/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /A current assessment is needed/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Digestive changes you reported/ })).toHaveCount(0);
});

test('engine fault is explicit, saved data survives, and isolated replay cannot overwrite standard history', async ({ page }) => {
  await signIn(page);
  await navigate(page, 'Scenario lab');
  await page.locator('article').filter({ hasText: 'An interrupted analysis' }).getByRole('button', { name: 'Open isolated scenario' }).click();
  await sync(page);
  await page.getByRole('button', { name: 'Save & analyse', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('intentionally unavailable');
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Restore engine', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: '+12 h', exact: true }).click();
    await expect(page.getByRole('button', { name: '+12 h', exact: true })).toBeEnabled();
  }
  await expect(page.getByRole('button', { name: /Sleep comparison unavailable/ })).toBeVisible();
  await page.getByRole('button', { name: 'Exit replay', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Replay controls' })).toHaveCount(0);
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
  await other.getByRole('button', { name: 'Female figure', exact: true }).click();
  await expect(other.getByRole('button', { name: 'Female figure', exact: true })).toHaveAttribute('aria-pressed', 'true');
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
  await expect(page.getByRole('button', { name: 'Test watch reminder' })).toBeDisabled();
  await expect(page.getByLabel('Request device reminders')).toBeDisabled();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset this workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
  await signOut();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'A clearer picture, Alex.' })).toBeVisible();
  await expect(page.locator('.metric.pulse .metric-number')).toContainText('74');
});

test('ST-HA uses a dark-blue theme and shows the locally bundled team logo in both About entry points', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4175/')) externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('Space Tiger Health Assistant (ST-HA)');
  await expect(page.getByText('Space Tiger Health Assistant', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'About & credits', exact: true }).click();
  const logo = page.getByRole('img', { name: /Space Tigers team logo/ });
  await expect(logo).toBeVisible();
  await expect(logo).toHaveJSProperty('complete', true);
  expect(await logo.evaluate((image: HTMLImageElement) => ({
    loaded: image.complete && image.naturalWidth === 300 && image.naturalHeight === 250,
    local: new URL(image.src).origin === location.origin,
  }))).toEqual({ loaded: true, local: true });
  await expect(page.getByRole('dialog')).toContainText('NASA-endorsed product');
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Enter mission workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Daily check-in', exact: true })).toBeVisible();
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
