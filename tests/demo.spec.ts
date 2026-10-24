import { expect, test } from '@playwright/test';

test('renders demo, customizes recipient, and turns both directions', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /把心意/ })).toBeVisible();
  await page.getByLabel('收礼人的名字').fill('小雨');
  await page.getByLabel('最后一页的祝福').fill('愿我们永远有新的故事。');

  const next = page.getByRole('button', { name: '下一页' });
  const previous = page.getByRole('button', { name: '上一页' });

  await expect(previous).toBeDisabled();
  await next.click();
  await expect(page.locator('.page-progress')).toContainText('02');
  await expect(previous).toBeEnabled({ timeout: 10_000 });
  await expect(next).toBeEnabled({ timeout: 10_000 });

  await page.waitForTimeout(1350);
  await previous.click();
  await expect(page.locator('.page-progress')).toContainText('01');
  await page.waitForTimeout(1350);

  await page.screenshot({ path: 'test-results/desktop-demo.png', fullPage: true });
  expect(runtimeErrors, 'browser runtime errors').toEqual([]);
});

test('narrow viewport displays controls and lets user edit content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '下一页' })).toBeVisible();
  await page.getByLabel('收礼人的名字').fill('小明');
  await expect(page.getByLabel('收礼人的名字')).toHaveValue('小明');
  await page.screenshot({ path: 'test-results/mobile-demo.png', fullPage: true });
});
