/* global document, window, Image, requestAnimationFrame */
// Lab only. Install pinned packages into a scratch directory with --ignore-scripts.
// No library code, generated captures or alternate engine ships in the application.
import {chromium,webkit} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const [packages,output]=process.argv.slice(2);
if(!packages||!output)throw new Error('Usage: node scripts/compare-open-source-turns.mjs <node_modules> <output>');
const base=process.env.STORYBOOK_TEST_BASE_URL??'http://127.0.0.1:5174';
const engine=process.env.STORYBOOK_TEST_BROWSER??'webkit';
const browser=await ({chromium,webkit}[engine]).launch();
const viewport={width:390,height:844};
await mkdir(output,{recursive:true});
const results=[];
try{
  const capture=await browser.newContext({viewport,deviceScaleFactor:3,reducedMotion:'reduce'});
  const source=await capture.newPage();
  const art=[];
  let box;
  for(const chapter of ['hello','grow','together']){
    await source.goto(`${base}/?story=letter&scene=${chapter}`);
    await source.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
    box=await source.locator('.book-shell').boundingBox();
    for(const side of ['left','right']){
      const png=await source.locator(`.book-static.book-${side} .page-surface`).screenshot();
      art.push('data:image/png;base64,'+png.toString('base64'));
    }
  }
  await capture.close();
  for(const variant of ['storybook','stpageflip','grabfold-dom','grabfold-webgl']){
    const context=await browser.newContext({viewport,deviceScaleFactor:3,recordVideo:{dir:output+'/raw',size:viewport}});
    const page=await context.newPage();
    if(variant==='storybook')await page.goto(`${base}/?story=letter&scene=hello`);
    else{
      await page.route('**/__book-lab/**',async route=>{
        const pathname=new URL(route.request().url()).pathname;
        if(pathname==='/__book-lab/index.html')return route.fulfill({contentType:'text/html',body:`
          <!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
          <style>body{background:#191923;margin:0}#book{position:absolute;left:${box.x}px;top:${box.y}px;width:${box.width}px;height:${box.height}px}</style>
          <div id="book"></div>`});
        const file=pathname.split('/').at(-1);
        if(!/^[\w.-]+\.js$/.test(file))return route.abort();
        const dir=pathname.includes('/grabfold/')?'grabfold/dist':'page-flip/dist/js';
        return route.fulfill({contentType:'text/javascript',body:await readFile(resolve(packages,dir,file))});
      });
      await page.goto(base+'/__book-lab/index.html');
      const available=await page.evaluate(async({variant,art,box})=>{
        const images=await Promise.all(art.map(async src=>{const img=new Image();img.src=src;await img.decode();return img;}));
        const root=document.querySelector('#book');
        if(variant==='stpageflip'){
          const {PageFlip}=await import('/__book-lab/page-flip/page-flip.module.js');
          const flip=new PageFlip(root,{width:Math.floor(box.width/2),height:Math.floor(box.height),usePortrait:false,flippingTime:1280});
          const ready=new Promise(resolve=>flip.on('init',resolve));
          flip.loadFromImages(art);await ready;
          window.labTurn=forward=>new Promise(resolve=>{
            let moving=false;
            const state=event=>{if(event.data==='flipping')moving=true;if(moving&&event.data==='read'){flip.off('changeState');resolve();}};
            flip.on('changeState',state);if(forward)flip.flipNext('bottom');else flip.flipPrev('bottom');
          });
        }else{
          const {Grabfold}=await import('/__book-lab/grabfold/index.js');
          const {webglFold,supportsWebGL}=await import('/__book-lab/grabfold/webgl.js');
          if(variant==='grabfold-webgl'&&!supportsWebGL())return false;
          const index=page=>page.kind==='cover'?0:page.sheet*2+(page.kind==='front'?1:2);
          const book=new Grabfold(root,{sheets:3,covers:'inside',layout:'spread',pageRatio:box.width/2/box.height,
            duration:1280,peek:false,grabBlock:false,
            foldRenderer:variant==='grabfold-webgl'?webglFold({texture:page=>images[index(page)]}):undefined,
            render(slot,page){const image=images[index(page)];if(image){const copy=image.cloneNode();copy.style.cssText='width:100%;height:100%;display:block';slot.append(copy);}},
          });
          window.labTurn=forward=>forward?book.next():book.prev();
        }
        return true;
      },{variant,art,box});
      if(!available){results.push({engine,variant,available});await context.close();continue;}
    }
    await page.evaluate(()=>{
      let frames=[],active=false,last=0;
      const tick=now=>{if(active){if(last)frames.push(now-last);last=now;}requestAnimationFrame(tick);};
      requestAnimationFrame(tick);
      window.measureStart=()=>{active=true;last=0;frames=[];};
      window.measureEnd=()=>{active=false;frames.sort((a,b)=>a-b);return {count:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)]};};
    });
    const turns=[];
    await page.screenshot({path:`${output}/${engine}-${variant}-start.png`});
    for(const [i,forward] of [true,true,false,false].entries()){
      await page.evaluate(()=>window.measureStart());const started=Date.now();
      if(variant==='storybook'){
        await page.getByRole('button',{name:forward?'下一页':'上一页'}).click();
        await page.waitForFunction(()=>!document.querySelector('.book-turn-leaf'));
      }else await page.evaluate(forward=>window.labTurn(forward),forward);
      turns.push({forward,total:Date.now()-started,...await page.evaluate(()=>window.measureEnd())});
      await page.screenshot({path:`${output}/${engine}-${variant}-landed-${i}.png`});
      await page.waitForTimeout(200);
    }
    const video=page.video();await context.close();await video.saveAs(`${output}/${engine}-${variant}.webm`);await video.delete();
    results.push({engine,variant,available:true,turns});
  }
}finally{
  await browser.close();await writeFile(`${output}/${engine}-open-source-timings.json`,JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
}
