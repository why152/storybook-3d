/* global document, window, requestAnimationFrame */
import {chromium,webkit} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.argv[2];
if(!root)throw new Error('Usage: node scripts/capture-safari-repair.mjs <evidence-directory>');
const engine=process.env.STORYBOOK_TEST_BROWSER??'webkit';
const base=process.env.STORYBOOK_TEST_BASE_URL??'http://127.0.0.1:5173';
await mkdir(root,{recursive:true});
const browser=await ({chromium,webkit}[engine]).launch();
const reports=[];
try{
 for(const [device,viewport,dpr] of [['desktop',{width:1440,height:900},1],['phone',{width:390,height:844},3]]){
  const context=await browser.newContext({viewport,deviceScaleFactor:dpr,reducedMotion:'reduce'});
  const page=await context.newPage();
  for(const scene of ['hello','grow','together','dream','wish']){
   await page.goto(`${base}/?story=letter&scene=${scene}`);
   await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));await document.fonts.ready;});
   await page.screenshot({path:`${root}/${engine}-${device}-${scene}.png`});
   if(device==='phone'&&scene==='hello'){
    await page.getByRole('button',{name:'放大左页'}).click();
    await page.screenshot({path:`${root}/${engine}-${device}-hello-zoom.png`});
   }
  }
  for(const from of ['cover','grow'])for(const pose of [0,.25,.5,.75,1]){
   await page.goto(`${base}/?story=letter&from=${from}&pose=${pose}`);
   if(from!=='cover')await page.waitForSelector('[data-texture-ready="true"]',{state:'attached'});
   await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));await document.fonts.ready;});
   await page.screenshot({path:`${root}/${engine}-${device}-${from}-${pose}.png`});
  }
  await context.close();
  const live=await browser.newContext({viewport,deviceScaleFactor:dpr,reducedMotion:'no-preference',recordVideo:{dir:root+'/raw',size:viewport}});
  const run=await live.newPage();
  await run.addInitScript(()=>{
   let last=0,start=0,readiness=null,frames=[],maxNodes=0,maxImages=0;
   const tick=now=>{
    const leaf=document.querySelector('.book-turn-leaf');
    if(start&&leaf){
     maxNodes=Math.max(maxNodes,leaf.querySelectorAll('*').length);
     maxImages=Math.max(maxImages,leaf.querySelectorAll('img').length);
     if(leaf.dataset.loading!=='true'){
      readiness??=now-start;
      if(last)frames.push(now-last);
      last=now;
     }
    }else last=0;
    requestAnimationFrame(tick);
   };requestAnimationFrame(tick);
   window.beginTurn=()=>{start=performance.now();readiness=null;frames=[];last=0;maxNodes=0;maxImages=0;};
   window.turnMetrics=()=>{const f=[...frames].sort((a,b)=>a-b);return {readinessMs:readiness,frames:f.length,p50:f[Math.floor(f.length*.5)],p95:f[Math.floor(f.length*.95)],max:f.at(-1),maxNodes,maxImages};};
  });
  await run.goto(`${base}/?story=letter`);await run.waitForTimeout(400);
  const turns=[];
  for(const direction of ['下一页','下一页','下一页','上一页','上一页','上一页']){
   await run.evaluate(()=>window.beginTurn());
   const started=Date.now();await run.getByRole('button',{name:direction}).click();
   await run.waitForFunction(()=>!document.querySelector('.book-turn-leaf'),null,{timeout:60000});
   turns.push({direction,totalMs:Date.now()-started,...await run.evaluate(()=>window.turnMetrics())});
   await run.waitForTimeout(200);
  }
  reports.push({engine,device,viewport,dpr,turns});
  const video=run.video();await live.close();await video.saveAs(`${root}/${engine}-${device}-opening-forward-back.webm`);await video.delete();
 }
 await writeFile(`${root}/${engine}-timings.json`,JSON.stringify({environment:'Local macOS browser, phone viewport + DPR simulation; not a physical iPhone benchmark',reports},null,2));
 console.log(JSON.stringify(reports,null,2));
}finally{await browser.close();}
