import {expect,test} from '@playwright/test';
import {paperGeometry,paperCuts,segmentCountForTolerance,curvatureErrorPx} from '../src/components/paperGeometry';

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

test('rounded segments retain the curve pixel budget across screen densities',()=>{
  for(const width of [171,172.5,420,550])for(const dpr of [1,2,3]){
    const count=segmentCountForTolerance(width,.5,8,13,dpr);
    const cuts=paperCuts(width,count,dpr);
    for(const progress of [.25,.5,.75]){
      const bend=1.15*Math.sin(Math.PI*progress);
      const pieces=paperGeometry(progress,count,cuts);
      for(const [i,piece] of pieces.entries())for(const t of [0,.25,.5,.75,1]){
        const u=cuts[i]+(cuts[i+1]-cuts[i])*t;
        const approxX=piece.x+Math.cos(piece.angle)*(u-cuts[i]);
        const approxZ=piece.z-Math.sin(piece.angle)*(u-cuts[i]);
        const exactX=Math.sin(bend*u)/bend;
        const exactZ=(Math.cos(bend*u)-1)/bend;
        expect(width*Math.hypot(approxX-exactX,approxZ-exactZ)).toBeLessThan(.51);
      }
    }
  }
});

async function ready(page:import('@playwright/test').Page){
  await page.evaluate(async()=>{await Promise.all([...document.images].map(image=>image.decode()));await document.fonts.ready;});
  if(await page.locator('.book-turn-leaf').count()){
    await expect(page.locator('.book-turn-leaf')).toBeVisible();
    await expect(page.locator('.book-turn-leaf')).toHaveAttribute('data-texture-ready','true');
  }
}

test('a mobile leaf keeps its segments while turning and adapts after resizing',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?scene=grow');
  await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
  await page.getByRole('button',{name:'下一页'}).click();
  const leaf=page.locator('.book-turn-leaf.is-flexible');
  await expect(leaf).toHaveAttribute('data-texture-ready','true');
  await expect(leaf.locator('.paper-segment')).toHaveCount(8);
  const progress=Number(await leaf.getAttribute('data-progress'));
  await page.setViewportSize({width:1440,height:900});
  await expect(leaf.locator('.paper-segment')).toHaveCount(8);
  await expect(leaf).toHaveAttribute('data-texture-ready','true');
  expect(Number(await leaf.getAttribute('data-progress'))).toBeGreaterThanOrEqual(progress);
  await expect(leaf).toHaveCount(0);

  await page.getByRole('button',{name:'上一页'}).click();
  await expect(leaf).toHaveAttribute('data-texture-ready','true');
  await expect(leaf.locator('.paper-segment')).toHaveCount(13);
  await expect(leaf).toHaveCount(0);
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});

test('exactly flat poses use native, single-piece printed paper',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const [pose,expected] of [['0','front'],['0.5','none'],['1','back']] as const){
    await page.goto('/?pose='+pose+'&from=grow');
    const leaf=page.locator('.book-turn-leaf.is-flexible');
    await expect(leaf).toHaveAttribute('data-texture-ready','true');
    await expect(leaf).toHaveAttribute('data-paper-endpoint',expected);
    const visible=leaf.locator('.paper-endpoint:visible');
    await expect(visible).toHaveCount(expected==='none'?0:1);
    const segments=leaf.locator('.paper-segment:visible');
    await expect(segments).toHaveCount(expected==='none'
      ? Number(await leaf.locator('.paper-segment').count()):0);
    if(expected!=='none')
      await expect(visible.locator('.page-surface')).toHaveCount(1);
  }
});

test('front and reverse endpoint print match the actual settled pages at desktop and mobile sizes',async({page:desktop,browser},testInfo)=>{
  const retina=await browser.newContext({viewport:{width:393,height:852},deviceScaleFactor:3,reducedMotion:'reduce'});
  try{
  for(const {page,viewports,dpr} of [
    {page:desktop,viewports:[{width:1440,height:900},{width:390,height:844},{width:393,height:852}],dpr:1},
    {page:await retina.newPage(),viewports:[{width:393,height:852}],dpr:3},
  ]){
   await page.emulateMedia({reducedMotion:'reduce'});
   for(const viewport of viewports){
    await page.setViewportSize(viewport);
    for(const [pose,chapter] of [[0,'grow'],[1,'together']] as const){
      await page.goto(`/?from=grow&pose=${pose}`);await ready(page);
      if(viewport.width===393){
        await page.setViewportSize({width:844,height:393});
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.setViewportSize(viewport);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      }
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
        const key=`${viewport.width}-dpr-${dpr}-pose-${pose}`;
        await testInfo.attach(`turning-${key}`,{body:turned,contentType:'image/png'});
        await testInfo.attach(`settled-${key}`,{body:settled,contentType:'image/png'});
        await testInfo.attach(`metrics-${key}`,{
          body:Buffer.from(JSON.stringify({viewport,dpr,pose,...diff},null,2)),
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
  }
  }finally{await retina.close();}
});

