/* global document, window, requestAnimationFrame, devicePixelRatio */
import {chromium, webkit} from '@playwright/test';
import {mkdir, writeFile} from 'node:fs/promises';
const engine=process.env.STORYBOOK_TEST_BROWSER==='webkit'?'webkit':'chromium';
const browser=await ({chromium,webkit}[engine]).launch();
const root=process.argv[2]??'test-results/flexible-paper-comparison';
await mkdir(root,{recursive:true});
// One camera for both variants, matching the candidate's actual production CSS.
const camera='.book-shell{perspective:none}';
const metrics=[];
for(const [device,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:390,height:844}]]){
 for(const [variant,port] of [['rigid',5176],['flexible',5175]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const chapter of ['cover','grow'])for(const pose of [0,.25,.5,.75,1]){
   await page.goto(`http://127.0.0.1:${port}/?from=${chapter}&pose=${pose}`);
   await page.addStyleTag({content:camera});
   await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));await document.fonts.ready;});
   await page.locator('.book-turn-leaf').waitFor({state:'visible'});
   await page.waitForTimeout(200);
   await page.screenshot({path:`${root}/${engine}-${device}-${variant}-${chapter}-${pose}.png`});
  }
  await context.close();
  const live=await browser.newContext({viewport,reducedMotion:'no-preference',recordVideo:{dir:root+'/raw',size:viewport}});
  const run=await live.newPage();
  await run.addInitScript(()=>{
   window.__paperFrames=[];let last=0;
   const tick=now=>{if(last&&document.querySelector('.is-turning'))window.__paperFrames.push(now-last);last=now;requestAnimationFrame(tick);};
   requestAnimationFrame(tick);
  });
  await run.goto(`http://127.0.0.1:${port}/`);
  await run.addStyleTag({content:camera});
  await run.waitForTimeout(500);
  for(const direction of ['下一页','下一页','上一页','上一页']){
   await run.getByRole('button',{name:direction}).click();
   await run.waitForFunction(()=>!document.querySelector('.book-turn-leaf'));
   await run.waitForTimeout(350);
  }
  const timing=await run.evaluate(()=>{
   const a=window.__paperFrames.slice(2).sort((a,b)=>a-b);
   return {frames:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],max:a.at(-1),userAgent:navigator.userAgent,dpr:devicePixelRatio};
  });
  metrics.push({engine,device,variant,...timing});
  const video=run.video();await live.close();
  await video.saveAs(`${root}/${engine}-${device}-${variant}-opening-forward-back.webm`);
  await video.delete();
 }
}
await writeFile(`${root}/${engine}-timings.json`,JSON.stringify({environment:'Local macOS automated browser; viewport simulation, NOT a real phone benchmark',metrics},null,2));
await browser.close();
console.log(JSON.stringify(metrics,null,2));
