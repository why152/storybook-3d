/* global document, requestAnimationFrame */
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const target=process.env.COVER_REVIEW_TARGET||'candidate';
const baseURL=process.env.COVER_REVIEW_URL||'http://127.0.0.1:5175';
const story=process.env.COVER_REVIEW_STORY||'birthday';
const output=path.resolve(process.env.COVER_REVIEW_OUTPUT||`test-results/cover-review/${target}`);
await mkdir(output,{recursive:true});
const metrics=[];
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const from of ['cover','grow'])for(const pose of [0,.25,.5,.75,1]){
   await page.goto(`${baseURL}/?story=${story}&from=${from}&pose=${pose}`);
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
   if(from!=='cover')await page.locator('.book-turn-leaf').waitFor({state:'visible'});
   if(from!=='cover')await page.waitForFunction(()=>document.querySelector('.book-turn-leaf')?.dataset.textureReady==='true');
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.screenshot({path:path.join(output,`${engine}-${device}-${from}-${pose}.png`)});
  }
  await context.close();
  const moving=await browser.newContext({viewport,recordVideo:{dir:output,size:viewport}});
  const live=await moving.newPage();
  const errors=[];live.on('pageerror',e=>errors.push(e.message));
  await live.goto(`${baseURL}/?story=${story}`);
  await live.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await live.waitForTimeout(300);
  for(const direction of ['下一页','下一页','上一页','上一页']){
   const start=Date.now();
   await live.getByRole('button',{name:direction}).click();
   await live.waitForFunction(()=>!document.querySelector('.book-shell.is-turning'));
   metrics.push({engine,device,direction,totalMs:Date.now()-start});
   await live.waitForTimeout(250);
  }
  const video=live.video();await moving.close();
  await video.saveAs(path.join(output,`${engine}-${device}-open-forward-back-close.webm`));
  metrics.push({engine,device,errors});
 }
 await browser.close();
 console.log(`${target}: ${engine} complete`);
}
await writeFile(path.join(output,'timings.json'),JSON.stringify(metrics,null,2));
