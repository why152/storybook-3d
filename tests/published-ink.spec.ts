import {expect,test} from '@playwright/test';
import {createHash} from 'node:crypto';
import {chapters} from '../src/data/story';

for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  test(`${viewport.width}: approved original ink loads across five spreads at the hosting base path`,async({page})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('./?story=letter');
    const release=await page.request.get(new URL('ink-release.json',page.url()).href);
    expect(release.ok()).toBe(true);
    const manifest=await release.json() as {fragments:{id:string;file:string;sha256:string}[]};
    expect(manifest.fragments).toHaveLength(12);
    for(const fragment of manifest.fragments){
      const image=await page.request.get(new URL(fragment.file,page.url()).href);
      expect(image.ok()).toBe(true);
      expect(createHash('sha256').update(await image.body()).digest('hex')).toBe(fragment.sha256);
    }
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
      await page.locator('.handwriting-reader summary').click();
      await expect(page.locator('.handwriting-reader-images')).toBeVisible();
    }
    expect(seen.size).toBe(12);
  });
}
