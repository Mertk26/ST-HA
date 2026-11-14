import { expect, test } from '@playwright/test';

test('production browser bundle evaluates CQL without external requests and shows honest native limits', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (!request.url().startsWith('http://127.0.0.1:4173/')) externalRequests.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Evaluate CQL' }).click();
  await expect(page.getByRole('status').first()).toContainText('Completed locally');
  const timing = await page.getByRole('status').first().innerText();
  console.log(`${testInfo.project.name}: ${timing}`);
  const elapsed = Number(/in ([\d.]+) ms/.exec(timing)?.[1]);
  expect(Number.isFinite(elapsed)).toBe(true);
  expect(elapsed).toBeLessThan(1000);
  const output = page.getByLabel('CQL result');
  await expect(output).toContainText('"combinedReview": true');
  for (const { scenario, expected } of [
    { scenario: 'missing', expected: 'null' },
    { scenario: 'stale', expected: 'null' },
    { scenario: 'corrected', expected: 'false' },
  ]) {
    await page.getByLabel('Scenario', { exact: true }).selectOption(scenario);
    await page.getByRole('button', { name: 'Evaluate CQL' }).click();
    await expect(output).toContainText(`"combinedReview": ${expected}`);
  }
  await expect(page.getByRole('button', { name: 'Schedule synthetic reminder' })).toBeDisabled();
  await expect(page.getByText('Browser: native notification proof is unavailable.', { exact: false })).toBeVisible();
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});
