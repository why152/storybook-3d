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

test('blocked autoplay starts on the first turn and stays paused after the reader pauses it',async({page})=>{
  await page.addInitScript(()=>{
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      if(this instanceof HTMLAudioElement){
        const attempts=Number(this.dataset.playAttempts??0)+1;
        this.dataset.playAttempts=String(attempts);
        if(attempts===1)return Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'));
      }
      return play.call(this);
    };
  });
  await page.goto('/');
  const toggle=page.getByRole('button',{name:'背景音乐'});
  const track=page.locator('audio');
  await expect(track).toHaveAttribute('data-play-attempts','1');
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await expect(page.getByText('音乐暂时无法播放')).toHaveCount(0);
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-static .letter-page')).toHaveCount(2);
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect.poll(()=>track.evaluate(audio=>(audio as HTMLAudioElement).currentTime)).toBeGreaterThan(.2);
  expect(await track.evaluate(audio=>(audio as HTMLAudioElement).loop)).toBe(true);
  await expect(track).toHaveAttribute('data-play-attempts','2');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  expect(await track.evaluate(audio=>(audio as HTMLAudioElement).paused)).toBe(true);
  await expect(track).toHaveAttribute('data-play-attempts','2');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('link',{name:'The Long Way Home · Scott Buckley'})).toBeVisible();
});
