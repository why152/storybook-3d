import { expect, test } from '@playwright/test';

const screenshot={fullPage:false,animations:'disabled' as const,timeout:15000};
const chapters=['hello','grow','together','dream','wish'] as const;

async function waitForChapterAssets(page:import('@playwright/test').Page,id:string){
  const pageArt=page.locator(`.book-static .page-surface[data-chapter="${id}"]`);
  await expect(pageArt).toHaveCount(2);
  const art=pageArt.locator('.scene-plane');
  await expect(art).toHaveCount(12);
  await expect.poll(async()=>art.evaluateAll(elements=>
    elements.every(node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth===1200)
  )).toBe(true);
}

test('closed portrait cover opens into two bound physical pages, then turns and returns',async ({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1);
  await expect(page.locator('.book-closed-cover .book-front-cover')).toBeVisible();
  await expect(page.getByRole('button',{name:'上一页'})).toBeDisabled();
  await page.screenshot({path:'test-results/00-closed-cover.png',...screenshot});
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-shell.is-open:not(.is-turning)')).toHaveCount(1);
  await waitForChapterAssets(page,'hello');
  await expect(page.locator('.book-binding')).toBeVisible();
  await page.screenshot({path:'test-results/01-open-two-page-book.png',...screenshot});
  await page.getByRole('button',{name:'下一页'}).click();
  await waitForChapterAssets(page,'grow');
  await page.getByRole('button',{name:'上一页'}).click();
  await waitForChapterAssets(page,'hello');
  await page.getByRole('button',{name:'上一页'}).click();
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1);
  await expect(page.locator('.book-closed-cover .book-front-cover')).toBeVisible();
  expect(errors).toEqual([]);
});

for(const chapter of chapters){
  test(`renders original six-plane ${chapter} art on two real pages`,async ({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/?scene='+chapter);
    await waitForChapterAssets(page,chapter);
    const sides=await page.locator('.book-static .page-surface').evaluateAll(elements=>
      elements.map(e=>e.getAttribute('data-side')));
    expect(sides).toEqual(['left','right']);
    await page.screenshot({path:`test-results/spread-${chapter}.png`,...screenshot});
  });
}

for(const [step,pose] of ['0','0.25','0.5','0.75','1'].entries()){
  test(`physical book leaf at ${Math.round(Number(pose)*100)}% of turn`,async ({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/?pose='+pose+'&from=grow');
    await expect(page.locator('[data-page-role="turning-leaf"]')).toHaveCount(1);
    await expect(page.locator('.book-static')).toHaveCount(2);
    await expect(page.locator('.book-leaf-face')).toHaveCount(2);
    const geometry=await page.locator('.book-shell').evaluate(shell=>{
      const leaf=shell.querySelector<HTMLElement>('.book-turn-leaf');
      if(!leaf)return null;
      return {
        binding:Math.abs(leaf.offsetLeft-shell.clientWidth/2),
        leafWidth:Math.abs(leaf.offsetWidth-shell.clientWidth/2),
        origin:getComputedStyle(leaf).transformOrigin,
        faceStyles:[...shell.querySelectorAll('.book-leaf-face')].map(el=>getComputedStyle(el).backfaceVisibility)
      };
    });
    expect(geometry).not.toBeNull();
    expect(geometry!.binding).toBeLessThan(3);
    expect(geometry!.leafWidth).toBeLessThan(3);
    expect(geometry!.origin.startsWith('0px')).toBeTruthy();
    expect(geometry!.faceStyles).toEqual(['hidden','hidden']);
    await page.screenshot({path:`test-results/book-turn-${String(step).padStart(2,'0')}.png`,...screenshot});
  });
}

test('customized final chapter and nonadjacent bookmarks turn sequentially',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await page.getByLabel('收礼人的名字').fill('小雨');
  await page.getByLabel('最后一页的祝福').fill('愿我们永远有新的故事。');
  await page.getByRole('button',{name:/看看最后一章/}).click();
  await expect(page.locator('.book-shell.is-open:not(.is-turning)')).toHaveCount(1,{timeout:20000});
  await waitForChapterAssets(page,'wish');
  await expect(page.getByRole('heading',{name:'生日快乐，小雨'})).toBeVisible();
  await expect(page.getByText('愿我们永远有新的故事。')).toBeVisible();
  await page.screenshot({path:'test-results/06-personalized-final-spread.png',...screenshot});
  await page.getByRole('button',{name:'查看第 3 个故事跨页'}).click();
  await waitForChapterAssets(page,'together');
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
});

test('keyboard and mobile touch keep book usable',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1);
  await page.screenshot({path:'test-results/mobile-closed-book.png',...screenshot});
  await page.keyboard.press('ArrowRight');
  await waitForChapterAssets(page,'hello');
  await page.screenshot({path:'test-results/mobile-open-book.png',...screenshot});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  const book=page.locator('.book-viewport');
  await expect(book).toBeVisible();
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await expect(page.getByLabel('收礼人的名字')).toBeVisible();
});

test('records an actual cover opening and right-to-left/left-to-right book turnover',async ({browser})=>{
  const context=await browser.newContext({
    viewport:{width:1280,height:720},reducedMotion:'no-preference',
    recordVideo:{dir:'test-results/book-motion',size:{width:1280,height:720}}
  });
  const page=await context.newPage();
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto('/');
    await expect(page.locator('.book-closed-cover')).toBeVisible();
    await page.waitForTimeout(350);
    await page.getByRole('button',{name:'下一页'}).click();
    await waitForChapterAssets(page,'hello');
    await page.waitForTimeout(350);
    await page.getByRole('button',{name:'下一页'}).click();
    await waitForChapterAssets(page,'grow');
    await page.waitForTimeout(300);
    await page.getByRole('button',{name:'上一页'}).click();
    await waitForChapterAssets(page,'hello');
    await page.waitForTimeout(700);
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  }finally{
    await context.close();
  }
  expect(errors).toEqual([]);
});
