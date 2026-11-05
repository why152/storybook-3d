import {expect,test} from '@playwright/test';

test('the public cover opens as a Chinese letter without an editor entry',async({page})=>{
  for(const url of ['/','/?story=letter']){
    await page.goto(url);
    await expect(page).toHaveTitle('一封来信 · 立体绘本');
    await expect(page.locator('.book-closed-cover .cover-main-title')).toHaveText('一封来信');
    await expect(page.getByRole('button',{name:'定制祝福'})).toHaveCount(0);
    await expect(page.getByRole('link',{name:/birthday|生日/i})).toHaveCount(0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.getByRole('button',{name:'下一页'}).click();
    await expect(page.locator('.book-static .letter-page')).toHaveCount(2);
    await expect(page.locator('.chapter-current')).toHaveText('第 01 章见字');
  }
});

test('music loads only when enabled, continues across a turn and can be paused',async({page})=>{
  const audioRequests:string[]=[];
  page.on('request',request=>{if(request.url().endsWith('.mp3'))audioRequests.push(request.url());});
  await page.goto('/');
  const toggle=page.getByRole('button',{name:'背景音乐'});
  const track=page.locator('audio');
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(track).not.toHaveAttribute('src',/./);
  expect(audioRequests).toHaveLength(0);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>track.evaluate(audio=>audio.currentTime)).toBeGreaterThan(.2);
  expect(await track.evaluate(audio=>audio.loop)).toBe(true);
  expect(audioRequests.length).toBeGreaterThan(0);
  const beforeTurn=await track.evaluate(audio=>audio.currentTime);
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-static .letter-page')).toHaveCount(2);
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  await expect.poll(()=>track.evaluate(audio=>audio.currentTime)).toBeGreaterThan(beforeTurn);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  expect(await track.evaluate(audio=>audio.paused)).toBe(true);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(track).not.toHaveAttribute('src',/./);
  await expect(page.getByRole('link',{name:'The Long Way Home · Scott Buckley'})).toBeVisible();
});
