import { expect, test } from '@playwright/test';

type CurlStats={
  renderer:'initializing'|'webgl2'|'fallback';
  loadedPages:number;
  drawCallsPerFrame?:number;
  triangleCount?:number;
  vertexCount?:number;
  from?:string;
  to?:string;
  progress?:number;
  curl?:number;
  lastError?:number;
  reason?:string;
};

async function readStatus(page:import('@playwright/test').Page){
  return page.evaluate(()=>(window as Window & {__curlLab?:CurlStats}).__curlLab);
}
async function awaitAssets(page:import('@playwright/test').Page){
  await expect.poll(async()=>{
    const stats=await readStatus(page);
    return stats?.renderer==='webgl2' ? stats.loadedPages===2 : stats?.renderer==='fallback';
  },{timeout:25000}).toBe(true);
  const supported=await page.evaluate(()=>Boolean(
    document.createElement('canvas').getContext('webgl2')
  ));
  if(supported){
    const info=await readStatus(page);
    expect(info?.renderer,'WebGL2 available, so GLSL compilation/texture upload must work').toBe('webgl2');
    expect(info?.loadedPages).toBe(2);
    expect(info?.triangleCount).toBe(3072);
    expect(info?.vertexCount).toBe(1625);
    expect(info?.drawCallsPerFrame).toBe(1);
    expect(info?.lastError).toBeUndefined();
    await expect(page.locator('#gpu')).toBeVisible();
  }else{
    await expect(page.locator('#fallback-leaf')).toBeVisible();
    await expect(page.locator('#gpu-error')).toBeVisible();
  }
  return supported;
}

test('a real own-written WebGL2 bent sheet loads front/back original artwork',async ({page})=>{
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width:1500,height:940});
  await page.goto('/labs/paper-curl.html?from=grow&pose=0.35');
  await expect(page.getByRole('heading',{name:'WE CAN BEND THE PAPER.'})).toBeVisible();
  const supported=await awaitAssets(page);
  await expect(page.locator('#css-book .fixed-page')).toHaveCount(2);
  await expect(page.locator('#gpu-book .fixed-page')).toHaveCount(2);
  await expect(page.locator('#css-book .print img')).toHaveCount(24);
  if(supported){
    const stats=await readStatus(page);
    expect(stats?.from).toBe('grow');
    expect(stats?.to).toBe('together');
    expect(stats?.progress).toBeCloseTo(.35,2);
  }
  await page.screenshot({path:'test-results/page-curl-a-b-compare.png',fullPage:true});
  expect(errors).toEqual([]);
});

for(const [index,pose] of ['0','0.25','0.5','0.75','1'].entries()){
  test(`captures actual physical bent-page pose ${pose}`,async ({page})=>{
    await page.setViewportSize({width:1440,height:900});
    await page.goto('/labs/paper-curl.html?from=grow&pose='+pose);
    await awaitAssets(page);
    const expected=Math.round(Number(pose)*100)+'%';
    await expect(page.locator('#progress-value')).toHaveText(expected);
    await page.screenshot({
      path:`test-results/curved-leaf-${String(index).padStart(2,'0')}.png`,
      animations:'disabled',fullPage:false,timeout:15000
    });
    const stats=await readStatus(page);
    if(stats?.renderer==='webgl2')expect(stats.progress).toBeCloseTo(Number(pose),2);
  });
}

test('bending changes the GPU geometry and switching chapters reloads textures',async ({page})=>{
  await page.setViewportSize({width:1400,height:920});
  await page.goto('/labs/paper-curl.html?from=hello&pose=0.5');
  const supported=await awaitAssets(page);
  if(!supported)test.skip(true,'GPU rendering unavailable; CSS fallback checked separately');
  const before=await page.locator('#gpu').evaluate((node:HTMLCanvasElement)=>node.toDataURL());
  await page.locator('#curl').fill('95');
  await expect.poll(async()=>(await readStatus(page))?.curl).toBeCloseTo(.95,2);
  const after=await page.locator('#gpu').evaluate((node:HTMLCanvasElement)=>node.toDataURL());
  expect(after).not.toBe(before);
  await page.locator('#chapter').selectOption('dream');
  await expect.poll(async()=>(await readStatus(page))?.to).toBe('wish');
  await expect.poll(async()=>(await readStatus(page))?.loadedPages).toBe(2);
  await page.locator('#progress').fill('75');
  await expect.poll(async()=>(await readStatus(page))?.progress).toBeCloseTo(.75,2);
  await page.screenshot({path:'test-results/curved-page-high-curl-dream.png',fullPage:true});
});

test('records true WebGL book-leaf flip forward and backward',async ({browser})=>{
  const context=await browser.newContext({
    viewport:{width:1400,height:900},reducedMotion:'no-preference',
    recordVideo:{dir:'test-results/curved-leaf-video',size:{width:1400,height:900}}
  });
  const page=await context.newPage();
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto('/labs/paper-curl.html?from=grow');
    await awaitAssets(page);
    await page.waitForTimeout(400);
    await page.getByRole('button',{name:'向前翻 ↶'}).click();
    await expect.poll(async()=>(await readStatus(page))?.progress,{timeout:10000}).toBeCloseTo(1,1);
    await page.waitForTimeout(260);
    await page.getByRole('button',{name:'翻回来 ↷'}).click();
    await expect.poll(async()=>(await readStatus(page))?.progress,{timeout:10000}).toBeCloseTo(0,1);
    await page.waitForTimeout(340);
    await page.locator('#curl').fill('90');
    await page.getByRole('button',{name:'向前翻 ↶'}).click();
    await expect.poll(async()=>(await readStatus(page))?.progress,{timeout:10000}).toBeCloseTo(1,1);
    await page.waitForTimeout(300);
  }finally{
    await context.close(); // authentic Chromium .webm recorded for review
  }
  expect(errors).toEqual([]);
});
