import {expect,test} from '@playwright/test';

/**
 * Regression for the cover -> HELLO handoff. The previous code mounted
 * BlankPage as the left underlay and hid it until React committed the final
 * spread, which could make the first illustration pop in at the last frame.
 * These deliberately use fixed physical poses, not animation-disabled
 * screenshots of an arbitrary in-flight GSAP frame.
 */
for(const mode of ['birthday','letter'] as const){
  for(const pose of [0,.25,.5,.75,1]){
    test(`${mode}: illustrated underlay persists at ${Math.round(pose*100)}% cover opening`,async({page})=>{
      await page.setViewportSize({width:390,height:844});
      await page.goto(`/?story=${mode}&from=cover&pose=${pose}`);
      const shell=page.locator('.book-shell');
      const left=shell.locator('.book-static.book-left');
      const right=shell.locator('.book-static.book-right');
      await expect(shell).toHaveClass(/is-opening/);
      await expect(left.locator('.page-surface[data-chapter="hello"]')).toHaveCount(1);
      await expect(right.locator('.page-surface[data-chapter="hello"]')).toHaveCount(1);
      await expect(shell.locator('.book-turn-leaf .book-front-cover')).toHaveCount(1);
      await expect(shell.locator('.book-turn-leaf .page-surface[data-chapter="hello"]')).toHaveCount(1);
      const leftClip=await left.evaluate(node=>getComputedStyle(node).clipPath);
      const match=leftClip.match(/([\d.]+)%\)$/);
      expect(match,`expected percentage clipping from the spine, got ${leftClip}`).not.toBeNull();
      expect(Number(match![1])).toBeCloseTo((1-pose)*100,0);
      const artwork=left.locator('.scene-plane');
      await expect.poll(async()=>artwork.evaluateAll(images=>images.every(image=>{
        const img=image as HTMLImageElement;
        return img.complete&&img.naturalWidth>0;
      }))).toBe(true);
      await page.screenshot({
        path:`test-results/cover-underlay-${mode}-${Math.round(pose*100)}.png`,
        animations:'disabled',timeout:15000
      });
    });
  }
}

test('real cover opens and closes back to a single portrait without losing HELLO',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('.book-static.book-closed-cover')).toBeVisible();
  for(let repeat=0;repeat<2;repeat++){
    await page.getByRole('button',{name:'下一页'}).click();
    await expect(page.locator('.book-shell.is-open:not(.is-turning)')).toHaveCount(1,{timeout:20000});
    await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
    await page.getByRole('button',{name:'上一页'}).click();
    await expect(page.locator('.book-shell.is-closed:not(.is-turning)')).toHaveCount(1,{timeout:20000});
    await expect(page.locator('.book-static.book-closed-cover')).toBeVisible();
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  }
});
