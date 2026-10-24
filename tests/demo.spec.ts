import { expect, test } from '@playwright/test';

const snap = { fullPage: false, animations: 'disabled' as const, timeout: 15_000 };

test('opens a story, personalizes final wish, and navigates backward', async ({page}) => {
  const errors: string[] = [];
  page.on('pageerror', error=>errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.cover-writing')).toBeVisible();
  await expect(page.getByRole('button', {name:'上一页'})).toBeDisabled();
  await page.screenshot({path:'test-results/00-cover.png',...snap});

  await page.getByRole('button', {name:'下一页'}).click();
  await expect(page.getByRole('button', {name:'下一页'})).toBeEnabled({timeout:8000});
  await expect(page.locator('.scene-card.theme-hello')).toBeVisible();
  await expect(page.locator('.art-hello .art-layer')).toHaveCount(6);
  await expect.poll(async()=>page.locator('.art-hello .art-layer').evaluateAll((elements)=>
    elements.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth === 1200)
  )).toBe(true);
  await page.screenshot({path:'test-results/04-hello.png',...snap});

  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await page.getByLabel('收礼人的名字').fill('小雨');
  await page.getByLabel('最后一页的祝福').fill('愿我们永远有新的故事。');
  await page.getByRole('button',{name:/看看最后一页/}).click();
  await expect(page.getByRole('button',{name:'上一页'})).toBeEnabled({timeout:8000});
  await expect(page.getByRole('heading',{name:'生日快乐，小雨'})).toBeVisible();
  await expect(page.getByText('愿我们永远有新的故事。')).toBeVisible();
  await page.screenshot({path:'test-results/05-wish.png',...snap});

  await page.getByRole('button',{name:'上一页'}).click();
  await expect(page.getByRole('button',{name:'下一页'})).toBeEnabled({timeout:8000});
  await expect(page.getByText('GROW',{exact:true})).toBeVisible();
  expect(errors).toEqual([]);
});

// Each pose has an independent browser context. A single browser capture
// failure no longer blocks the remaining angles, and CI artifacts pinpoint
// the exact orientation that needs compositor debugging.
for(const [step,pose] of ['0','0.25','0.5','0.75','1'].entries()){
  test(`captures 3D pose ${pose}`,async ({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/?pose='+pose);
    await expect(page.locator('.flip-leaf')).toHaveCount(1);
    await expect(page.locator('.art-hello .art-layer').first()).toHaveAttribute('src','/assets/hello/background.svg');
    await expect.poll(async()=>page.locator('.art-hello .art-layer').first().evaluate(
      el=>(el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth===1200
    )).toBe(true);
    await page.screenshot({path:`test-results/pose-${String(step).padStart(2,'0')}.png`,...snap});
  });
}

test('mobile viewport keeps scene and customization accessible',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.screenshot({path:'test-results/mobile-cover.png',...snap});
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.getByRole('button',{name:'下一页'})).toBeEnabled({timeout:8000});
  await expect(page.locator('.scene-card.theme-hello')).toBeVisible();
  await expect(page.locator('.art-hello .art-layer')).toHaveCount(6);
  await expect.poll(async()=>page.locator('.art-hello .art-layer').evaluateAll((elements)=>
    elements.every(node => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth === 1200)
  )).toBe(true);
  await page.screenshot({path:'test-results/mobile-hello.png',...snap});
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await expect(page.getByLabel('收礼人的名字')).toBeVisible();
});
