import {expect,test} from '@playwright/test';
import {paperGeometry,PAPER_SEGMENTS,segmentCountForTolerance,curvatureErrorPx} from '../src/components/paperGeometry';

test('paper stays joined, above the book and constant-length throughout both directions',()=>{
  let lowest=0,maxGap=0,maxLengthError=0;
  for(let step=0;step<=1000;step++){
    const progress=step/1000,theta=Math.PI*progress;
    const pieces=paperGeometry(progress);
    let length=0;
    for(const [i,piece] of pieces.entries()){
      const endX=piece.x+Math.cos(piece.angle)*piece.length;
      const endZ=piece.z-Math.sin(piece.angle)*piece.length;
      lowest=Math.min(lowest,Math.sin(theta)*piece.x+Math.cos(theta)*piece.z,Math.sin(theta)*endX+Math.cos(theta)*endZ);
      length+=Math.hypot(endX-piece.x,endZ-piece.z);
      if(i+1<pieces.length){
        maxGap=Math.max(maxGap,Math.hypot(endX-pieces[i+1].x,endZ-pieces[i+1].z));
      }
    }
    maxLengthError=Math.max(maxLengthError,Math.abs(length-1));
    maxGap=Math.max(maxGap,Math.abs(pieces[0].x),Math.abs(pieces[0].z));
  }
  expect(lowest).toBeGreaterThanOrEqual(-1e-12);
  expect(maxGap).toBeLessThan(1e-12);
  expect(maxLengthError).toBeLessThan(1e-12);
});


/** Accuracy-constrained minimization: pick smallest N with <=0.5 CSS pixel
 * model sagitta, then compare the REAL midpoint-strip polyline to the
 * continuously integrated circular bend (not just the same formula again).
 */
test('mathematical pixel budget minimizes segments without losing shape',()=>{
  for(const width of [171,360,550]){
    const n=segmentCountForTolerance(width,.5);
    expect(curvatureErrorPx(width,n)).toBeLessThanOrEqual(.5);
    expect(curvatureErrorPx(width,n-1)).toBeGreaterThan(.5);
    let actualMax=0;
    for(let p=0;p<=1.000001;p+=.01){
      const bend=1.15*Math.sin(Math.PI*p);
      const pieces=paperGeometry(p,n);
      for(let k=0;k<=400;k++){
        const u=k/400;
        const segment=Math.min(n-1,Math.floor(u*n));
        const fraction=u*n-segment;
        const piece=pieces[segment];
        const approxX=piece.x+Math.cos(piece.angle)*fraction/n;
        const approxZ=piece.z-Math.sin(piece.angle)*fraction/n;
        const exactX=Math.abs(bend)<1e-10?u:Math.sin(bend*u)/bend;
        const exactZ=Math.abs(bend)<1e-10?0:(Math.cos(bend*u)-1)/bend;
        actualMax=Math.max(actualMax,width*Math.hypot(approxX-exactX,approxZ-exactZ));
      }
    }
    expect(actualMax).toBeLessThan(.51);
  }
});

test('experimental eight-strip page completes a real turn',async({page})=>{
  await page.goto('/?scene=hello&segments=8');
  await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.paper-segment')).toHaveCount(8);
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:8500});
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});

test('curved paper exposes only the surface facing the camera at flat endpoints',async({page})=>{
  for (const [pose,expectedFront] of [[0,true],[1,false]] as const){
    await page.goto(`/?from=grow&pose=${pose}`);
    await expect(page.locator('.paper-segment')).toHaveCount(PAPER_SEGMENTS);
    const faces=await page.locator('.paper-segment').evaluateAll(segments=>
      segments.map(segment=>({
        front:getComputedStyle(segment.querySelector('.paper-front')!).visibility,
        back:getComputedStyle(segment.querySelector('.paper-back')!).visibility,
      }))
    );
    for(const face of faces){
      expect(face.front).toBe(expectedFront?'visible':'hidden');
      expect(face.back).toBe(expectedFront?'hidden':'visible');
    }
  }
});

test('slow assets cannot leave a half-turned book stuck forever',async({page})=>{
  // Asset timeout is deliberately longer than the 2.5s navigation budget.
  // It reproduces the stalled-image symptom observed on WebKit CI.
  await page.route(/\/assets\/grow\/.*\.svg$/,async route=>{
    await new Promise(resolve=>setTimeout(resolve,5000));
    await route.continue().catch(()=>undefined);
  });
  await page.goto('/?scene=hello');
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:4500});
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]'))
    .toHaveCount(2);
  await expect(page.getByRole('button',{name:'下一页'})).toBeEnabled();
});

async function ready(page:import('@playwright/test').Page){
  await page.evaluate(async()=>{await Promise.all([...document.images].map(image=>image.decode()));await document.fonts.ready;});
  await page.waitForTimeout(150);
}

test('front and reverse endpoint print match the actual settled pages at desktop and mobile sizes',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    for(const [pose,chapter] of [[0,'grow'],[1,'together']] as const){
      await page.goto(`/?from=grow&pose=${pose}`);await ready(page);
      const turned=await page.locator('.book-shell').screenshot();
      await page.goto('/?scene='+chapter);await ready(page);
      const settled=await page.locator('.book-shell').screenshot();
      const diff=await page.evaluate(async([a,b])=>{
        const decode=async(src:string)=>{const i=new Image();i.src=src;await i.decode();return i;};
        const [x,y]=await Promise.all([decode(a),decode(b)]);
        const c=document.createElement('canvas');c.width=x.width;c.height=x.height;
        const ctx=c.getContext('2d',{willReadFrequently:true})!;
        ctx.drawImage(x,0,0);const px=ctx.getImageData(0,0,c.width,c.height).data;
        ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(y,0,0);
        const py=ctx.getImageData(0,0,c.width,c.height).data;
        let error=0,changed=0;
        for(let i=0;i<px.length;i+=4){
          const d=Math.max(...[0,1,2].map(k=>Math.abs(px[i+k]-py[i+k])));
          if(d>20)changed++;
          for(let k=0;k<3;k++)error+=Math.abs(px[i+k]-py[i+k]);
        }
        return {mean:error/(c.width*c.height*3),changed:changed/(c.width*c.height)};
      },[turned,settled].map(buffer=>'data:image/png;base64,'+buffer.toString('base64')));
      if(diff.mean>=2||diff.changed>=.04){
        // Keep the original strict gate. Attach BOTH actual source frames for
        // pixel inspection; a final failed screenshot alone is misleading.
        const key=`${viewport.width}-pose-${pose}`;
        await testInfo.attach(`turning-${key}`,{body:turned,contentType:'image/png'});
        await testInfo.attach(`settled-${key}`,{body:settled,contentType:'image/png'});
        await testInfo.attach(`metrics-${key}`,{
          body:Buffer.from(JSON.stringify({viewport,pose,...diff},null,2)),
          contentType:'application/json',
        });
      }
      expect(diff.mean,`${viewport.width} / ${pose} print registration`).toBeLessThan(2);
      // Different 3D clipping/rasterization affects high-contrast text edges,
      // especially at DPR=1 mobile sizes. Inspected endpoint captures show
      // identical artwork; allow 4% edge pixels, while mean error stays <2/255.
      expect(diff.changed,`${viewport.width} / ${pose} missing or mirrored print`).toBeLessThan(.04);
    }
  }
});

test('turning print preserves the actual character pose and synchronizes both halves on landing',async({page})=>{
  await page.goto('/?scene=hello');await ready(page);await page.waitForTimeout(850);
  await page.getByRole('button',{name:'下一页'}).click();
  await expect(page.locator('.paper-segment')).toHaveCount(PAPER_SEGMENTS);
  const frozen=await page.locator('.book-turn-leaf .actor-fox').first().evaluate(el=>getComputedStyle(el).transform);
  const stationary=await page.locator('.book-left .actor-fox').evaluate(el=>getComputedStyle(el).transform);
  expect(frozen).toBe(stationary);
  await page.waitForTimeout(150);
  expect(await page.locator('.book-turn-leaf .actor-fox').first().evaluate(el=>getComputedStyle(el).transform)).toBe(frozen);
  await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
  const phases=await page.locator('.book-static .actor-rabbit').evaluateAll(nodes=>nodes.map(el=>getComputedStyle(el).transform));
  expect(phases[0]).toBe(phases[1]);
  await expect(page.locator('.book-static .actor-rabbit').first()).not.toHaveCSS('animation-name','none');
});

test('curved sheet resizes while anchored and reduced motion never paints an intermediate leaf',async({page})=>{
  await page.goto('/?from=grow&pose=0.5');await ready(page);
  for(const width of [390,1024,1440]){
    await page.setViewportSize({width,height:844});
    await expect.poll(()=>page.locator('.book-turn-leaf').evaluate((leaf,count)=>{
      const end=leaf.querySelector<HTMLElement>('.paper-segment')!;
      return Math.abs(parseFloat(end.style.width)*count-parseFloat(getComputedStyle(leaf).width));
    },PAPER_SEGMENTS)).toBeLessThan(.1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?scene=hello');await ready(page);
  await page.evaluate(()=>{
    (window as unknown as {paintedTurns:number}).paintedTurns=0;
    const sample=()=>{
      if(document.querySelector('.book-turn-leaf'))(window as unknown as {paintedTurns:number}).paintedTurns++;
      requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  await page.getByRole('button',{name:'查看第 5 个故事跨页'}).click();
  await expect(page.locator('.book-static .page-surface[data-chapter="wish"]')).toHaveCount(2);
  expect(await page.evaluate(()=>(window as unknown as {paintedTurns:number}).paintedTurns)).toBe(0);
});
