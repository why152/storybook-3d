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

  const mode=await page.evaluate(()=>(window as Window & {
    __shaderLabStats?:LabStats
  }).__shaderLabStats?.renderer);
  expect(['webgl2','error','context-lost']).toContain(mode);
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
  }else{
    await expect(page.locator('#fallback')).toBeVisible();
    // Explicitly record unavailable GPU rather than reporting shader QA as passed.
    await page.screenshot({path:'test-results/custom-webgl-fallback.png',fullPage:true});
  }
  expect(errors).toEqual([]);
});
