import {expect,test} from '@playwright/test';
import {chapters} from '../src/data/story';

for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  test(`${viewport.width}: approved original ink loads across five spreads at the hosting base path`,async({page})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('./?story=letter');
    const seen=new Set<string>();
    for(const chapter of chapters){
      await page.goto(`./?story=letter&scene=${chapter.id}`);
      await expect(page.locator('.has-authentic-handwriting')).toHaveCount(1);
      await expect(page.locator('.book-static .page-surface')).toHaveCount(2);
      await expect(page.locator('.book-static .letter-leaf')).toHaveCount(0);
      const images=page.locator('.book-static .handwriting-image');
      await expect.poll(()=>images.evaluateAll(items=>items.every(item=>{
        const image=item as HTMLImageElement;return image.complete&&image.naturalWidth>0;
      }))).toBe(true);
      await page.locator('.book-static [data-ink-id]').evaluateAll(items=>items.map(item=>(item as HTMLElement).dataset.inkId!))
        .then(ids=>ids.forEach(id=>seen.add(id)));
      await expect(page.locator('.handwriting-reader')).toHaveCount(0);
      await expect(page.locator('.book-reading-hint')).toContainText('放大左页');
      const fragments=await page.locator('.book-static .handwriting-fragment').evaluateAll(items=>items.map(item=>{
        const pageBox=item.closest('.page-surface')!.getBoundingClientRect(),box=item.getBoundingClientRect();
        return {side:(item.closest('.page-surface') as HTMLElement).dataset.side,
          inside:box.left>=pageBox.left&&box.right<=pageBox.right+1&&box.top>=pageBox.top&&box.bottom<=pageBox.bottom+1};
      }));
      expect(fragments.length).toBeGreaterThanOrEqual(2);
      expect(fragments.every(fragment=>fragment.inside)).toBe(true);
      expect(new Set(fragments.map(fragment=>fragment.side))).toEqual(new Set(['left','right']));
      if(viewport.width<=600){
        await expect(page.locator('.book-reading-hint')).toBeVisible();
        for(const side of ['left','right'] as const){
          const zoom=page.getByRole('button',{name:side==='left'?'放大左页':'放大右页'});
          await zoom.click();
          await expect(zoom).toHaveAttribute('aria-pressed','true');
          await expect(page.locator('.book-reading-stage')).toHaveAttribute('data-reading-side',side);
          const visibleImages=page.locator(`.book-${side} .handwriting-image`);
          await expect(visibleImages).not.toHaveCount(0);
          const contained=await visibleImages.evaluateAll(items=>{
            const stage=document.querySelector('.book-reading-stage')!.getBoundingClientRect();
            return items.every(item=>{const box=item.getBoundingClientRect();
              return box.left>=stage.left-1&&box.right<=stage.right+1&&box.top>=stage.top-1&&box.bottom<=stage.bottom+1;});
          });
          expect(contained).toBe(true);
          expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
        }
      }
    }
    expect(seen.size).toBe(12);
  });
}
