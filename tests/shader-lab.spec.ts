import { expect, test } from '@playwright/test';

type LabStats={
  renderer:'webgl2'|'error'|'context-lost';
  loadedLayers?:number;
  drawCallsPerFrame?:number;
  scene?:string;
  texture?:number[];
  reason?:string;
};

test('our first-party GLSL parallax experiment loads the exact six illustrated planes',async ({page})=>{
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1300,height:860});
  await page.goto('/labs/parallax-shader.html?scene=hello');
  await expect(page.getByRole('heading',{name:'OUR OWN WEBGL SHADER'})).toBeVisible();
  await expect(page.locator('#css-stage img')).toHaveCount(6);
  await expect.poll(async()=>page.locator('#css-stage img').evaluateAll(nodes=>nodes.every(
    node=>(node as HTMLImageElement).complete&&(node as HTMLImageElement).naturalWidth===1200
  ))).toBe(true);

  const hasWebGL2=await page.evaluate(()=>Boolean(document.createElement('canvas').getContext('webgl2')));
  const mode=await page.evaluate(()=>(window as Window & {
    __shaderLabStats?:LabStats
  }).__shaderLabStats?.renderer);
  if(hasWebGL2){
    expect(mode,'GLSL shader must compile when the browser has WebGL2').toBe('webgl2');
  }else{
    expect(['error','context-lost']).toContain(mode);
  }
  if(mode==='webgl2'){
    await expect.poll(async()=>page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats?.loadedLayers)).toBe(6);
    const before=await page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats);
    expect(before?.drawCallsPerFrame).toBe(1);
    expect(before?.scene).toBe('hello');
    await page.locator('#depth').fill('120');
    await expect(page.locator('#depth-value')).toHaveText('120');
    await page.locator('#scene').selectOption('dream');
    await expect.poll(async()=>page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats?.scene)).toBe('dream');
    await expect.poll(async()=>page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats?.loadedLayers)).toBe(6);
    const atlas=await page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats?.texture);
    expect(atlas?.length).toBe(2);
    await page.screenshot({path:'test-results/custom-webgl-parallax-lab.png',fullPage:true});
    // Capture a genuinely offset depth state, not merely a neutral composition.
    await page.locator('#animate').uncheck();
    const box=await page.locator('#gpu-stage').boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x+box!.width*.88,box!.y+box!.height*.21);
    await page.waitForTimeout(150);
    await page.screenshot({path:'test-results/custom-webgl-parallax-offset.png',fullPage:true});
  }else{
    await expect(page.locator('#fallback')).toBeVisible();
    // Explicitly record unavailable GPU rather than reporting shader QA as passed.
    await page.screenshot({path:'test-results/custom-webgl-fallback.png',fullPage:true});
  }
  expect(errors).toEqual([]);
});

test('captures real GPU shader interaction while preserving the CSS baseline',async ({browser})=>{
  const context=await browser.newContext({
    viewport:{width:1300,height:860},reducedMotion:'no-preference',
    recordVideo:{dir:'test-results/shader-lab-motion',size:{width:1300,height:860}}
  });
  const page=await context.newPage();
  try{
    await page.goto('/labs/parallax-shader.html?scene=hello');
    const gpuAvailable=await page.evaluate(()=>Boolean(document.createElement('canvas').getContext('webgl2')));
    if(!gpuAvailable)test.skip(true,'Software Chromium runner lacks WebGL2');
    await expect.poll(async()=>page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats?.loadedLayers)).toBe(6);
    await page.locator('#depth').fill('135');
    await page.locator('#animate').check();
    const box=await page.locator('#gpu-stage').boundingBox();
    expect(box).not.toBeNull();
    for(const point of [[.18,.24],[.40,.62],[.84,.38],[.23,.79],[.50,.50]]){
      await page.mouse.move(box!.x+point[0]*box!.width,box!.y+point[1]*box!.height,{steps:12});
      await page.waitForTimeout(180);
    }
    await page.locator('#scene').selectOption('together');
    await expect.poll(async()=>page.evaluate(()=>(window as Window & {
      __shaderLabStats?:LabStats
    }).__shaderLabStats?.scene)).toBe('together');
    await page.waitForTimeout(400);
    await page.locator('#animate').uncheck();
    await page.screenshot({path:'test-results/custom-webgl-motion-final.png',fullPage:true});
  }finally{
    await context.close();
  }
});
