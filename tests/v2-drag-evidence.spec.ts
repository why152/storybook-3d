import {expect,test} from '@playwright/test';

/** Evidence, not a pixel-perfect grade: record the actual real-browser drag
 * from the same chapter at 0/25/50/75/100%, followed by a full reverse pull
 * while held. Review output for wrinkles, seams, ghosted faces and flicker. */
test('record hand-held forward/backward paper manipulation with photographic poses',async({browser})=>{
  const context=await browser.newContext({
    viewport:{width:1280,height:800},
    recordVideo:{dir:'test-results/v2-drag-evidence',size:{width:1280,height:800}},
    reducedMotion:'no-preference'
  });
  try{
    const page=await context.newPage();
    await page.goto('/?scene=hello');
    const book=page.locator('.book-viewport');
    const rect=(await book.boundingBox())!;
    const y=rect.y+rect.height*.66, start=rect.x+rect.width*.9, half=rect.width/2;
    await page.mouse.move(start,y);await page.mouse.down();
    const leaf=page.locator('.book-turn-leaf.is-flexible');
    await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
    for(const p of [0,.25,.5,.75,1,.75,.5,.25,0]){
      await page.mouse.move(start-half*p,y,{steps:3});
      await expect.poll(async()=>Number(await leaf.getAttribute('data-progress')),{timeout:12000}).toBeCloseTo(p,1);
      await page.screenshot({path:'test-results/v2-drag-'+String(p).replace('.','_')+'-'+Date.now()+'.png',fullPage:false,animations:'disabled'});
    }
    await page.waitForTimeout(1400);
    await expect(leaf).toHaveCount(1); // no autonomous turn while held
    await page.mouse.up();
    await expect(leaf).toHaveCount(0,{timeout:20000});
    await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
  }finally{await context.close();}
});
