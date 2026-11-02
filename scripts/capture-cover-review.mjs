/* global document, requestAnimationFrame */
import {chromium,webkit} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const target=process.env.COVER_REVIEW_TARGET||'candidate';
const baseURL=process.env.COVER_REVIEW_URL||'http://127.0.0.1:5175';
const story=process.env.COVER_REVIEW_STORY||'birthday';
const turns=(process.env.COVER_REVIEW_FROM||'cover,grow').split(',');
const output=path.resolve(process.env.COVER_REVIEW_OUTPUT||`test-results/cover-review/${target}`);
await mkdir(output,{recursive:true});
const metrics=[];
for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch();
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});
  const page=await context.newPage();
  if(story==='letter'){
   await page.goto(`${baseURL}/?story=letter&scene=hello`);
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
   await page.screenshot({path:path.join(output,`${engine}-${device}-hello.png`)});
   if(device==='mobile'&&await page.getByRole('button',{name:'放大左页'}).count()){
    for(const side of ['左','右']){
     await page.getByRole('button',{name:`放大${side}页`}).click();
     await page.screenshot({path:path.join(output,`${engine}-${device}-read-${side==='左'?'left':'right'}.png`),fullPage:true});
    }
   }
  }
  for(const from of turns)for(const pose of [0,.25,.5,.75,1]){
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
   // Record reading on the actual first spread before continuing the same
   // bound-book forward/backward sequence. No second renderer or montage.
   if(story==='letter'&&device==='mobile'&&metrics.filter(m=>m.engine===engine&&m.device===device&&m.direction).length===1
      &&await live.getByRole('button',{name:'放大左页'}).count()){
    for(const name of ['放大左页','放大右页','双页全貌']){
     await live.getByRole('button',{name}).click();await live.waitForTimeout(700);
    }
   }
  }
  const video=live.video();await moving.close();
  await video.saveAs(path.join(output,`${engine}-${device}-open-forward-back-close.webm`));
  metrics.push({engine,device,errors});
 }
 await browser.close();
 console.log(`${target}: ${engine} complete`);
}
await writeFile(path.join(output,'timings.json'),JSON.stringify(metrics,null,2));
