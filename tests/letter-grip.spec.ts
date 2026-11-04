import {expect,test} from '@playwright/test';

// Taking DPR 3 screenshots can momentarily change the video capture scale.
// Run the same gestures once for stills and once for uninterrupted footage.
const record=process.env.STORYBOOK_GRIP_VIDEO==='1';

for(const phone of [false,true]){
  test(`${phone?'Phone':'Desktop'} letter: hold, cross the spine, reverse and land`,async({browser,browserName,baseURL},testInfo)=>{
    const viewport=phone?{width:390,height:844}:{width:1280,height:800};
    const touch=phone&&browserName==='chromium';
    const context=await browser.newContext({baseURL,viewport,deviceScaleFactor:phone?3:1,
      hasTouch:phone,recordVideo:record?{dir:testInfo.outputDir,size:viewport}:undefined});
    try{
      const page=await context.newPage();
      await page.goto('/?story=letter&scene=grow');
      await page.locator('.book-static .handwriting-image').evaluateAll(images=>Promise.all(images.map(image=>(image as HTMLImageElement).decode())));
      const rect=(await page.locator('.book-viewport').boundingBox())!;
      const y=rect.y+rect.height*.28;
      const client=touch?await context.newCDPSession(page):null;
      const leaf=page.locator('.book-turn-leaf.is-flexible');
      const turns=[{start:.88,sign:-1,settled:'together'},{start:.12,sign:1,settled:'grow'}];
      for(const {start,sign,settled} of turns){
        const xAt=(p:number)=>rect.x+rect.width*(start+sign*p/2);
        if(client)await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:xAt(0),y}]});
        else {await page.mouse.move(xAt(0),y);await page.mouse.down();}
        await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
        const positions=[0,.25,.5,.75,1,.75,.5,.25,0,.9,.18,.88];
        for(const [index,p] of positions.entries()){
          if(p!==0||index!==0){
            if(client)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:xAt(p),y}]});
            else await page.mouse.move(xAt(p),y,{steps:index<9?3:1});
          }
          await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeCloseTo(sign<0?p:1-p,1);
          await expect(leaf).toHaveCount(1);
          await expect(page.locator('.book-static .page-surface')).toHaveCount(2);
          if(p>0&&p<1){
            expect(await leaf.locator('.paper-segment').evaluateAll(strips=>strips.every(strip=>
              [...strip.children].filter(face=>getComputedStyle(face).display!=='none').length===1))).toBe(true);
          }
          if(!record&&index<5)await page.screenshot({path:testInfo.outputPath(`${settled}-${index*25}.png`)});

        }
        await page.waitForTimeout(250);
        await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeCloseTo(sign<0?.88:.12,1);
        if(client)await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        else await page.mouse.up();
        await expect(leaf).toHaveCount(0,{timeout:20000});
        await expect(page.locator(`.book-static .page-surface[data-chapter="${settled}"]`)).toHaveCount(2);
        await expect(page.locator('.book-shell')).toHaveCSS('transform','none');
      }
    }finally{await context.close();}
  });
}

test('the curved letter hides the artwork beneath both faces',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const pose of [.5,.78]){
    await page.goto(`/?story=letter&from=grow&pose=${pose}`);
    const leaf=page.locator('.book-turn-leaf.is-flexible');
    await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
    // Probe paint away from the binding and strip seams. Hiding both
    // underlying pages must leave the solid paper pixels identical.
    const clip=await leaf.locator('.paper-segment-face:visible').evaluateAll(faces=>{
      const rect=faces.map(face=>face.getBoundingClientRect()).sort((a,b)=>b.width-a.width)[0];
      return {x:Math.round(rect.x+rect.width/2)-3,y:Math.round(rect.y+rect.height*.17),width:6,height:6};
    });
    const withUnderlay=await page.screenshot({clip});
    await page.addStyleTag({content:'.book-static{visibility:hidden!important}'});
    const withoutUnderlay=await page.screenshot({clip});
    expect(withoutUnderlay.equals(withUnderlay),'the underlying pages must not show through the lifted paper').toBe(true);
  }
});

test('the moving paper covers the binding without removing the visible gutter',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?story=letter&from=grow&pose=.5');
  await expect(page.locator('.book-turn-leaf')).toHaveAttribute('data-texture-ready','true');
  const shell=(await page.locator('.book-shell').boundingBox())!;
  const center=Math.round(shell.x+shell.width/2);
  const y=Math.round(shell.y+shell.height*.25),height=Math.round(shell.height*.5);
  const exposed={x:center-6,y,width:5,height};
  // Stay inside a printed strip. Subpixel antialiasing at strip edges can
  // still reveal the background through a fraction of a pixel.
  const covered={x:center+3,y,width:3,height};
  const before=await page.screenshot({clip:covered});
  const gutter=await page.screenshot({clip:exposed});
  await page.addStyleTag({content:'.book-binding{visibility:hidden!important}'});
  expect((await page.screenshot({clip:covered})).equals(before)).toBe(true);
  expect((await page.screenshot({clip:exposed})).equals(gutter)).toBe(false);
});

test('a quick return just past halfway cancels in either direction, while a pause settles by position',async({page})=>{
  for(const [scene,start,sign,next] of [['grow',.88,-1,'together'],['together',.12,1,'grow']] as const){
    await page.goto('/?story=letter&scene='+scene);
    const book=page.locator('.book-viewport');
    const rect=(await book.boundingBox())!;
    const xAt=(p:number)=>rect.x+rect.width*(start+sign*p/2);
    const y=rect.y+rect.height*.28;
    const leaf=page.locator('.book-turn-leaf.is-flexible');
    for(const pause of [false,true]){
      await page.mouse.move(xAt(0),y);await page.mouse.down();
      await expect(leaf).toHaveAttribute('data-texture-ready','true');
      await page.mouse.move(xAt(.74),y);
      await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeCloseTo(sign<0?.74:.26,2);
      if(pause){
        await page.mouse.move(xAt(.58),y);
        await page.waitForTimeout(180);
        await page.mouse.up();
      }else{
        // Dispatch the final movement and release in one browser task, so
        // runner load cannot add a pause between the two gesture samples.
        await book.evaluate((element,{x,y})=>{
          for(const type of ['pointermove','pointerup']){
            element.dispatchEvent(new PointerEvent(type,{pointerId:1,pointerType:'mouse',isPrimary:true,
              clientX:x,clientY:y,bubbles:true,cancelable:true}));
          }
        },{x:xAt(.58),y});
        await page.mouse.up();
      }
      await expect(leaf).toHaveCount(0);
      await expect(page.locator(`.book-static .page-surface[data-chapter="${pause?next:scene}"]`)).toHaveCount(2);
    }
  }
});

test('rapid drag input paints only its latest position before the next refresh',async({page})=>{
  await page.goto('/?story=letter&scene=grow');
  const rect=(await page.locator('.book-viewport').boundingBox())!;
  const x=rect.x+rect.width*.88,y=rect.y+rect.height*.3;
  await page.mouse.move(x,y);await page.mouse.down();
  const leaf=page.locator('.book-turn-leaf.is-flexible');
  await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
  const writes=await page.evaluate(async({x,y,width})=>{
    const book=document.querySelector('.book-viewport')!;
    const leaf=book.querySelector('.book-turn-leaf')!;
    let writes=0;
    const observer=new MutationObserver(records=>{writes+=records.length;});
    observer.observe(leaf,{attributes:true,attributeFilter:['data-progress']});
    for(const fraction of [.22,.65,.4,.8,.6,.35,.7]){
      book.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',isPrimary:true,
        clientX:x-width*fraction/2,clientY:y,bubbles:true,cancelable:true}));
    }
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    observer.disconnect();return writes;
  },{x,y,width:rect.width});
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeCloseTo(.7,1);
  expect(writes).toBe(1);
  // A release can report a newer coordinate than the last move event. Here
  // it lands back near the origin, so the gesture must cancel the turn.
  await page.locator('.book-viewport').dispatchEvent('pointerup',{pointerId:1,pointerType:'mouse',isPrimary:true,
    clientX:x-rect.width*.09,clientY:y,bubbles:true,cancelable:true});
  await page.mouse.up();
  await expect(leaf).toHaveCount(0);
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});
