import { expect, test } from '@playwright/test';

/** These are cheap invariants a future expensive shader solver should never
 * need to re-debug while investigating GPU-only paper deformation. */

test('actual Chromium touch input turns physical pages forward and backward',async ({browser,browserName})=>{
  test.skip(browserName!=='chromium','Native CDP touch dispatch is Chromium-specific.');
  const context=await browser.newContext({
    viewport:{width:390,height:844},
    isMobile:true,
    hasTouch:true,
    deviceScaleFactor:1,
    reducedMotion:'reduce',
  });
  const page=await context.newPage();
  try{
    await page.goto('/?scene=grow');
    await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
    const rect=await page.locator('main.exhibition').boundingBox();
    expect(rect).not.toBeNull();
    const y=rect!.y+rect!.height/2;
    const left=rect!.x+Math.max(85,rect!.width*.2);
    const right=rect!.x+Math.min(rect!.width-80,rect!.width*.8);
    const client=await context.newCDPSession(page);
    async function swipe(from:number,to:number){
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:from,y}]});
      for(let i=1;i<=5;i++){
        await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from+(to-from)*i/5,y}]});
      }
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await swipe(right,left);
    await expect(page.locator('.book-static .page-surface[data-chapter="together"]')).toHaveCount(2);
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
    await swipe(left,right);
    await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
    await page.screenshot({path:'test-results/qa-mobile-real-touch-restored.png'});
  }finally{await context.close();}
});

test('next/previous boundary buttons, mid-turn input lock and no stale leaf DOM',async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('button',{name:'上一页'})).toBeDisabled();
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-turn-leaf')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'上一页'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'下一页'})).toBeDisabled();
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:15000});
  await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
  // Navigating to last bookmark must turn each intermediate leaf rather than
  // teleporting or leaving an old GSAP transform on the final book.
  await page.getByRole('button',{name:'查看第 5 个故事跨页'}).click();
  await expect(page.locator('.book-static .page-surface[data-chapter="wish"]')).toHaveCount(2,{timeout:20000});
  await expect(page.getByRole('button',{name:'下一页'})).toBeDisabled();
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  await expect(page.locator('.book-shell')).toHaveCSS('transform','none');
  await page.getByRole('button',{name:'查看封面'}).click();
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1,{timeout:20000});
  await expect(page.getByRole('button',{name:'上一页'})).toBeDisabled();
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
});


test('customization modal traps focus and never forwards arrow keys to the book',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?scene=grow');
  const trigger=page.getByRole('button',{name:/CUSTOMIZE/});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'写下你的故事。'});
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel('收礼人的名字')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
  // Shift+Tab from first text field reaches the close button; once on first
  // focusable element, Shift+Tab wraps to last inside the dialog.
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:'关闭定制面板'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button',{name:/看看最后一章/})).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});
