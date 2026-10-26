/* global document, getComputedStyle */
import { chromium,webkit } from 'playwright';
import { resolve } from 'node:path';
import fs from 'node:fs/promises';
const out=resolve(process.argv[2]||'test-results/continuity-comparison');
const baseline=process.env.STORYBOOK_BASELINE_URL||'http://127.0.0.1:5174';
const candidate=process.env.STORYBOOK_CANDIDATE_URL||'http://127.0.0.1:5175';
await fs.mkdir(out,{recursive:true});
const report=[];
for(const [engine,browserType] of Object.entries({chromium,webkit})){
 const browser=await browserType.launch();
 for(const [variant,base] of [['before',baseline],['after',candidate]]){
  for(const [size,viewport] of [['desktop',{width:1280,height:720}],['mobile',{width:390,height:844}]]){
   const context=await browser.newContext({viewport,deviceScaleFactor:1,recordVideo:{dir:out+'/raw',size:viewport}});
   const page=await context.newPage();
   await page.goto(base+'/');await page.waitForTimeout(400);
   for(const label of ['下一页','下一页','上一页']){
    await page.getByRole('button',{name:label}).click();
    await page.locator('.book-turn-leaf').waitFor({state:'detached'});
    await page.waitForTimeout(600);
   }
   // Matched chapter, viewport, source art and CSS animation time.
   await page.goto(base+'/?scene=hello');
   await page.evaluate(async()=>{
    await document.fonts.ready;
    await Promise.all([...document.images].map(i=>i.decode()));
    for(const el of document.querySelectorAll('.book-static .scene-plane'))for(const a of el.getAnimations()){
      a.pause();await a.ready;a.currentTime=1250;
    }
   });
   const read=()=>page.locator('.book-left .scene-plane').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
   const rest=await read();
   await page.screenshot({path:`${out}/${engine}-${size}-${variant}-rest.png`});
   await page.getByRole('button',{name:'下一页'}).click();
   await page.locator('.book-turn-leaf').waitFor({state:'visible'});
   const frozen=await read();
   const printed=await page.locator('.book-leaf-front .scene-plane').evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
   await page.screenshot({path:`${out}/${engine}-${size}-${variant}-start.png`});
   report.push({engine,variant,size,chapter:'hello',animationTimeMs:1250,rest,frozen,printed,unchanged:JSON.stringify(rest)===JSON.stringify(printed)});
   await page.locator('.book-turn-leaf').waitFor({state:'detached'});
   const video=page.video();await context.close();
   await video.saveAs(`${out}/${engine}-${size}-${variant}.webm`);
   await video.delete();
  }
 }
 await browser.close();
}
await fs.writeFile(out+'/matched-poses.json',JSON.stringify(report,null,2)+'\n');
console.log(report.map(({engine,variant,size,unchanged})=>({engine,variant,size,unchanged})));

await fs.rmdir(out+'/raw');
