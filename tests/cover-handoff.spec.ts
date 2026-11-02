import {expect,test} from '@playwright/test';

/**
 * Regression for the cover -> HELLO handoff. The previous code mounted
 * BlankPage as the left underlay and expanded a pale paper stack to the left.
 * PR #36 then exposed a duplicate stationary illustration beside the cover.
 * Only the hardcover back should paint the left art until it lands.
 * These deliberately use fixed physical poses, not animation-disabled
 * screenshots of an arbitrary in-flight GSAP frame.
 */
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
for(const mode of ['birthday','letter'] as const){
  for(const pose of [0,.25,.5,.75,1]){
    test(`${viewport.width} ${mode}: single illustrated cover at ${Math.round(pose*100)}% opening`,async({page})=>{
      await page.setViewportSize(viewport);
      await page.goto(`/?story=${mode}&from=cover&pose=${pose}`);
      const shell=page.locator('.book-shell');
      const left=shell.locator('.book-static.book-left');
      const right=shell.locator('.book-static.book-right');
      await expect(shell).toHaveClass(/is-opening/);
      await expect(left.locator('.page-surface[data-chapter="hello"]')).toHaveCount(1);
      await expect(right.locator('.page-surface[data-chapter="hello"]')).toHaveCount(1);
      await expect(shell.locator('.book-turn-leaf .book-front-cover')).toHaveCount(1);
      await expect(shell.locator('.book-turn-leaf .page-surface[data-chapter="hello"]')).toHaveCount(1);
      expect(await left.evaluate(node=>getComputedStyle(node).visibility)).toBe('hidden');
      expect(await right.evaluate(node=>getComputedStyle(node).visibility)).toBe('visible');
      expect(await shell.locator('.book-depth').evaluate(node=>getComputedStyle(node).clipPath)).toBe('inset(0px 0px 0px 50%)');
      await expect(shell.locator('.page-blank')).toHaveCount(0);
      const artwork=left.locator('.scene-plane');
      await expect.poll(async()=>artwork.evaluateAll(images=>images.every(image=>{
        const img=image as HTMLImageElement;
        return img.complete&&img.naturalWidth>0;
      }))).toBe(true);
      await page.screenshot({
        path:`test-results/cover-underlay-${viewport.width}-${mode}-${Math.round(pose*100)}.png`,
        animations:'disabled',timeout:15000
      });
    });
  }
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

for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  test(`${viewport.width}: cover drag reverses and cancellation restores both endpoints`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);
    await page.goto('/');
    const book=page.locator('.book-viewport');
    const shell=page.locator('.book-shell');
    const leaf=page.locator('.book-turn-leaf');
    const bounds=(await book.boundingBox())!;
    const x=(fraction:number)=>bounds.x+bounds.width*fraction;
    const y=bounds.y+bounds.height*.65;
    const settled=async(mode:string)=>{
      await expect(leaf).toHaveCount(0);
      await expect(shell).toHaveAttribute('data-book-mode',mode);
      expect(await shell.evaluate(el=>(el as HTMLElement).style.transform)).toBe('');
      expect(await shell.locator('.book-depth').evaluate(el=>(el as HTMLElement).style.clipPath)).toBe('');
      await expect(book).not.toHaveAttribute('data-grab-active','true');
    };
    for(const direction of [1,-1]){
      const origin=direction===1?.66:.16;
      await page.mouse.move(x(origin),y);await page.mouse.down();
      await expect(leaf).not.toHaveAttribute('data-loading','true');
      await leaf.evaluate(el=>el.setAttribute('data-test-identity','same-cover'));
      await page.mouse.move(x(origin-direction*.35),y,{steps:7});
      await expect(shell.locator('.book-left')).toBeHidden();
      await expect(leaf).toHaveAttribute('data-test-identity','same-cover');
      await page.screenshot({path:`test-results/cover-held-${viewport.width}-${direction}.png`});
      // Reverse the same leaf in hand, then release: return to the origin.
      await page.mouse.move(x(origin-direction*.03),y,{steps:6});
      await expect(leaf).toHaveAttribute('data-test-identity','same-cover');
      await page.mouse.up();
      await settled(direction===1?'closed':'open');
      // Cancel while beyond the commit threshold. pointercancel must restore
      // the origin rather than treating the last position as an approved turn.
      await page.mouse.move(x(origin),y);await page.mouse.down();
      await page.mouse.move(x(origin-direction*.36),y,{steps:6});
      await book.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',isPrimary:true});
      await page.mouse.up();
      await settled(direction===1?'closed':'open');
      await page.getByRole('button',{name:direction===1?'下一页':'上一页'}).click();
      await settled(direction===1?'open':'closed');
      if(direction===1){
        await expect(shell.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
        await expect(shell.locator('.book-left')).toBeVisible();
      }
    }
    await testInfo.attach('cover-cancellation-complete',{body:await page.screenshot(),contentType:'image/png'});
  });
  test(`${viewport.width}: reduced motion cover transitions settle coherently`,async({page})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/');
    for(const direction of ['下一页','上一页']){
      await page.getByRole('button',{name:direction}).click();
      await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
      await expect(page.locator('.book-shell')).toHaveAttribute('data-book-mode',direction==='下一页'?'open':'closed');
    }
  });
}
