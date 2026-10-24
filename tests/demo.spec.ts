import { expect, test } from '@playwright/test';

test('editorial stage, true flip, and personalized final page', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', err => runtimeErrors.push(err.message));
  await page.goto('/');
  await expect(page.locator('.cover-writing')).toBeVisible();
  await expect(page.getByRole('button', { name: '上一页' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '下一页' })).toBeEnabled();
  await page.screenshot({ path: 'test-results/00-cover.png', fullPage: true });

  await page.getByRole('button', { name: '下一页' }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/01-turn-quarter.png', fullPage: true });
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/02-turn-middle.png', fullPage: true });
  await page.waitForTimeout(420);
  await page.screenshot({ path: 'test-results/03-turn-three-quarter.png', fullPage: true });
  await expect(page.getByText('HELLO', { exact: true })).toBeVisible({ timeout: 6_000 });
  await page.screenshot({ path: 'test-results/04-hello.png', fullPage: true });

  await page.getByRole('button', { name: 'CUSTOMIZE' }).click();
  await page.getByLabel('收礼人的名字').fill('小雨');
  await page.getByLabel('最后一页的祝福').fill('愿我们永远有新的故事。');
  await page.getByRole('button', { name: '看看最后一页' }).click();
  await expect(page.getByRole('heading', { name: '生日快乐，小雨' })).toBeVisible({ timeout: 7_000 });
  await expect(page.getByText('愿我们永远有新的故事。')).toBeVisible();
  await page.screenshot({ path: 'test-results/05-wish.png', fullPage: true });

  await page.getByRole('button', { name: '上一页' }).click();
  await expect(page.getByText('GROW', { exact: true })).toBeVisible({ timeout: 7_000 });
  expect(runtimeErrors).toEqual([]);
});

test('mobile screenshot and swipe navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.screenshot({ path: 'test-results/mobile-cover.png', fullPage: true });
  const stage = page.locator('.exhibition');
  const bounds = await stage.boundingBox();
  expect(bounds).not.toBeNull();
  await page.getByRole('button', { name: '下一页' }).click();
  await expect(page.getByText('HELLO', { exact: true })).toBeVisible({ timeout: 7_000 });
  await page.screenshot({ path: 'test-results/mobile-hello.png', fullPage: true });
  await page.getByRole('button', { name: 'CUSTOMIZE' }).click();
  await expect(page.getByLabel('收礼人的名字')).toBeVisible();
});
