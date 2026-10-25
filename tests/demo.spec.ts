import { expect, test } from '@playwright/test';

const screenshot={fullPage:false,animations:'disabled' as const,timeout:15000};
const chapters=['hello','grow','together','dream','wish'] as const;

async function waitForChapterAssets(page:import('@playwright/test').Page,id:string){
  const pageArt=page.locator(`.book-static .page-surface[data-chapter="${id}"]`);
  await expect(pageArt).toHaveCount(2);
  const art=pageArt.locator('.scene-plane');
  const expectedImages=id==='hello'?14:16;
  await expect(art).toHaveCount(expectedImages);
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
  // A clean 2-page spread must remain after the cover has fully opened.
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
  await page.waitForTimeout(180);
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

for(const [step,pose] of ['0','0.5','1'].entries()){
  test(`cover opens by turning a bound right leaf at ${Math.round(Number(pose)*100)}%`,async ({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/?pose='+pose+'&from=cover');
    const leaf=page.locator('.book-turn-leaf');
    await expect(leaf).toHaveCount(1);
    await expect(leaf.locator('.book-front-cover')).toHaveCount(1);
    await expect(leaf.locator('.page-surface[data-chapter="hello"]')).toHaveCount(1);
    // The cover is not a rotating full landscape card: width is book/2.
    const widths=await page.locator('.book-shell').evaluate(book=>({
      book:book.clientWidth,leaf:book.querySelector<HTMLElement>('.book-turn-leaf')?.offsetWidth??0
    }));
    expect(Math.abs(widths.leaf-widths.book/2)).toBeLessThan(3);
    await page.screenshot({path:`test-results/cover-opening-${String(step).padStart(2,'0')}.png`,...screenshot});
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
  await expect(page.locator('.book-static .page-right .page-quote').getByText('愿我们永远有新的故事。')).toBeVisible();
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
  const reader=page.getByRole('region',{name:'故事朗读文字'});
  await expect(reader).toBeVisible();
  await expect(reader.getByRole('heading',{name:'遇见，是故事的开头。'})).toBeVisible();
  await expect(reader.getByText('在无数平凡的日子里，刚好遇见了你。')).toBeVisible();
  const fontSize=await reader.locator('p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(12);
  await page.screenshot({path:'test-results/mobile-open-book.png',...screenshot});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  const book=page.locator('.book-viewport');
  await expect(book).toBeVisible();
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await expect(page.getByLabel('收礼人的名字')).toBeVisible();
});

test('mobile final chapter remains readable after customization',async ({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?scene=wish');
  const reader=page.getByRole('region',{name:'故事朗读文字'});
  await expect(reader).toBeVisible();
  await expect(reader.getByText('生日快乐，你')).toBeVisible();
  await page.getByRole('button',{name:/CUSTOMIZE/}).click();
  await page.getByLabel('收礼人的名字').fill('小雨');
  await page.getByLabel('最后一页的祝福').fill('愿一切美好都如约而至。');
  await page.getByRole('button',{name:'关闭定制面板'}).click();
  await expect(reader.getByText('生日快乐，小雨')).toBeVisible();
  await expect(reader.getByText('愿一切美好都如约而至。')).toBeVisible();
  await page.screenshot({path:'test-results/mobile-readable-wish.png',...screenshot});
});

test('layer inspector compares the six-plane original against transparent actor sources',async ({page})=>{
  for(const [chapter,count] of [['hello',7],['grow',8],['together',8],['dream',8],['wish',8]] as const){
    await page.goto('/art-inspector.html?scene='+chapter+'&actors=1');
    await expect(page.locator('#actor-mode')).toBeChecked();
    const layers=page.locator('#card img');
    await expect(layers).toHaveCount(count);
    await expect.poll(async()=>layers.evaluateAll(nodes=>nodes.every(
      node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth===1200
    ))).toBe(true);
    await page.locator('#actor-mode').uncheck();
    await expect(page.locator('#card img')).toHaveCount(6);
    await expect(page.locator('#actor-mode')).not.toBeChecked();
  }
});

test('independent actors reproduce the original composite illustration at rest',async ({page})=>{
  await page.goto('/?scene=hello');
  for(const scene of ['hello','grow','together','dream','wish'] as const){
    const parts=scene==='hello'?['rabbit','fox']
      :['together','wish'].includes(scene)?['fox','rabbit','props']
      :['rabbit','fox','props'];
    const comparison=await page.evaluate(async ({scene,parts})=>{
      const W=1200,H=700;
      const makeCanvas=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c;};
      const read=async (src:string)=>{
        const image=new Image();
        image.src=src;
        await image.decode();
        if(image.naturalWidth!==W||image.naturalHeight!==H)
          throw Error('Unregistered illustration: '+src);
        return image;
      };
      const original=makeCanvas(),split=makeCanvas();
      const origCtx=original.getContext('2d',{willReadFrequently:true})!;
      const partsCtx=split.getContext('2d',{willReadFrequently:true})!;
      origCtx.drawImage(await read('/assets/'+scene+'/characters.svg'),0,0);
      for(const actor of parts){
        partsCtx.drawImage(await read('/assets/'+scene+'/actors/'+actor+'.svg'),0,0);
      }
      const a=origCtx.getImageData(0,0,W,H).data;
      const b=partsCtx.getImageData(0,0,W,H).data;
      let changedPixels=0,absoluteDiff=0,maxDifference=0;
      for(let i=0;i<a.length;i+=4){
        let changed=false;
        for(let channel=0;channel<4;channel++){
          const diff=Math.abs(a[i+channel]-b[i+channel]);
          absoluteDiff+=diff;maxDifference=Math.max(diff,maxDifference);
          if(diff)changed=true;
        }
        if(changed)changedPixels++;
      }
      return {changedPixelRatio:changedPixels/(W*H),
        meanChannelError:absoluteDiff/(W*H*4),maxDifference};
    },{scene,parts});
    expect(comparison.meanChannelError,scene+' artwork must retain exact color and alignment').toBeLessThan(.02);
    expect(comparison.changedPixelRatio,scene+' artwork must not redraw or lose characters').toBeLessThan(.003);
  }
});

test('HELLO and GROW actors are independently registered, animated and still on turning paper',async ({page})=>{
  await page.setViewportSize({width:1280,height:720});
  await page.goto('/?scene=hello');
  await waitForChapterAssets(page,'hello');
  const rabbit=page.locator('.book-static.book-left .actor-rabbit').first();
  const fox=page.locator('.book-static.book-right .actor-fox').first();
  await expect(rabbit).toBeVisible();
  await expect(fox).toBeVisible();
  await expect(rabbit).toHaveCSS('animation-name','hello-rabbit-greeting');
  await expect(fox).toHaveCSS('animation-name','hello-fox-reply');
  const rabbitTransform=await rabbit.evaluate(el=>getComputedStyle(el).transform);
  await expect.poll(async()=>rabbit.evaluate(el=>getComputedStyle(el).transform),{
    timeout:2500,intervals:[220,260,260]
  }).not.toBe(rabbitTransform);
  await page.screenshot({path:'test-results/acting-hello-live.png',fullPage:false});
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-turn-leaf')).toHaveCount(1);
  await expect(page.locator('.book-turn-leaf .actor-rabbit').first()).toHaveCSS('animation-name','none');
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:15000});
  await waitForChapterAssets(page,'grow');
  await expect(page.locator('.book-static.book-left .acting-grow.actor-rabbit').first()).toHaveCSS('animation-name','grow-rabbit-reaching');
  await expect(page.locator('.book-static.book-right .acting-grow.actor-fox').first()).toHaveCSS('animation-name','grow-fox-watering');
  await expect(page.locator('.book-static .actor-props')).toHaveCount(2);
  await page.screenshot({path:'test-results/acting-grow-live.png',fullPage:false});
});

test('actor performances respect reduced motion and remain aligned with the 2-page print',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const chapter of ['hello','grow']){
    await page.goto('/?scene='+chapter);
    await waitForChapterAssets(page,chapter);
    await expect(page.locator('.book-static .actor-rabbit').first()).toHaveCSS('animation-name','none');
    await expect(page.locator('.book-static .actor-fox').first()).toHaveCSS('animation-name','none');
    const halves=page.locator('.book-static .scene-actor');
    await expect.poll(async()=>halves.evaluateAll(items=>items.every(node=>
      (node as HTMLImageElement).naturalWidth===1200 &&
      (node as HTMLImageElement).naturalHeight===700
    ))).toBe(true);
    await page.screenshot({path:`test-results/${chapter}-actor-rest-frame.png`,fullPage:false,animations:'disabled'});
  }
});

test('records distinct illustrated characters greeting and watering in real browser',async ({browser})=>{
  const ctx=await browser.newContext({
    viewport:{width:1280,height:720},reducedMotion:'no-preference',
    recordVideo:{dir:'test-results/actor-story-motion',size:{width:1280,height:720}}
  });
  const page=await ctx.newPage();
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('/?scene=hello');
    await waitForChapterAssets(page,'hello');
    await page.waitForTimeout(4800);
    await page.getByRole('button',{name:'下一页'}).click();
    await waitForChapterAssets(page,'grow');
    await page.waitForTimeout(4300);
  }finally{await ctx.close();}
  expect(errors).toEqual([]);
});

test('all five chapters animate independent characters with different story-specific timing',async ({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});
  const cases=[
    ['together','story-tea-fox','story-tea-rabbit','story-tea-cups'],
    ['dream','story-stargaze-fox','story-stargaze-rabbit','story-star-map'],
    ['wish','story-wish-present','story-wish-cheer','story-wish-gift'],
  ] as const;
  for(const [scene,foxName,rabbitName,propsName] of cases){
    await page.goto('/?scene='+scene);
    await waitForChapterAssets(page,scene);
    await expect(page.locator('.book-static.book-left .actor-fox').first()).toHaveCSS('animation-name',foxName);
    await expect(page.locator('.book-static.book-right .actor-rabbit').first()).toHaveCSS('animation-name',rabbitName);
    await expect(page.locator('.book-static .actor-props').first()).toHaveCSS('animation-name',propsName);
    await page.screenshot({path:`test-results/acting-${scene}-rest.png`,fullPage:false,animations:'disabled'});
  }
});

test('five-chapter continuous real-browser recording includes distinct acting and real bound-page turns',async ({browser})=>{
  const context=await browser.newContext({
    viewport:{width:1280,height:720},reducedMotion:'no-preference',
    recordVideo:{dir:'test-results/five-story-actor-motion',size:{width:1280,height:720}}
  });
  const page=await context.newPage();
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.goto('/?scene=hello');
    for(const scene of ['hello','grow','together','dream','wish']){
      await waitForChapterAssets(page,scene);
      await page.waitForTimeout(scene==='hello'?1600:2100);
      if(scene==='wish')break;
      await page.getByRole('button',{name:'下一页'}).click();
      await expect(page.locator('.book-turn-leaf')).toHaveCount(1);
      await expect(page.locator('.book-turn-leaf .scene-actor').first()).toHaveCSS('animation-name','none');
      await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:12000});
    }
  }finally{await context.close();}
  expect(errors).toEqual([]);
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
