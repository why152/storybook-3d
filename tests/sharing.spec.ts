import { expect, test } from '@playwright/test';

test('a Chinese birthday greeting becomes a reusable private-by-link URL',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?scene=wish');
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await page.getByLabel('收礼人的名字').fill('小雨🎂');
  await page.getByLabel('最后一页的祝福').fill('愿每一页都开满花。\n生日快乐！');
  const url=await page.getByLabel('专属绘本链接').inputValue();
  const parsed=new URL(url);
  expect(parsed.pathname).toBe('/');
  expect(parsed.search).toBe(''); // Do not leak debug scene/pose routes.
  expect(parsed.hash).toMatch(/^#gift=[A-Za-z0-9_-]+$/);

  await page.getByRole('button',{name:/复制专属链接/}).click();
  await expect(page.getByRole('status')).not.toBeEmpty();

  // A fresh visit must start with a real, closed portrait cover.
  await page.goto(url);
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1);
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await expect(page.getByLabel('收礼人的名字')).toHaveValue('小雨🎂');
  await expect(page.getByLabel('最后一页的祝福')).toHaveValue('愿每一页都开满花。\n生日快乐！');
  await page.getByRole('button',{name:'关闭定制面板'}).click();

  await page.getByRole('button',{name:'查看第 5 个故事跨页'}).click();
  await expect(page.locator('.book-static .page-surface[data-chapter="wish"]')).toHaveCount(2,{timeout:30000});
  await expect(page.getByRole('heading',{name:'生日快乐，小雨🎂'})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await expect(page.getByLabel('收礼人的名字')).toHaveValue('小雨🎂');
});

test('malformed, unsupported and oversized share fragments are harmless',async ({page})=>{
  const invalid=[
    '#gift=***',
    '#gift=eyJ2IjoyLCJuIjoiQSIsInciOiJCIn0', // version 2 is unsupported.
    '#gift='+ 'a'.repeat(700),
  ];
  for(const hash of invalid){
    await page.goto('/?scene=wish'+hash);
    await expect(page.getByRole('region',{name:'故事朗读文字'}).getByRole('heading',{name:'生日快乐，你'})).toBeVisible();
    await page.getByRole('button',{name:/CUSTOMIZE/}).click();
    await expect(page.getByLabel('收礼人的名字')).toHaveValue('你');
    await page.getByRole('button',{name:'关闭定制面板'}).click();
  }
});

test('share URLs also preserve mobile base paths',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await page.getByLabel('收礼人的名字').fill('阿星');
  const href=await page.getByLabel('专属绘本链接').inputValue();
  expect(href).toContain('/#gift=');
  await page.goto(href);
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1);
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await expect(page.getByLabel('收礼人的名字')).toHaveValue('阿星');
});
