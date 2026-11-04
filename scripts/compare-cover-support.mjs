/* global document, Image, MutationObserver */
// Compares temporary render variants against the same published art and camera.
import {webkit,chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output=process.argv[2];
if(!output)throw new Error('Pass an output directory.');
const base=process.env.STORYBOOK_TEST_BASE_URL??'https://storybook.35-76-143-76.sslip.io';
const engine=process.env.STORYBOOK_TEST_BROWSER??'webkit';
const variants=['baseline','crossfade','angle'].filter(variant=>
  !process.env.STORYBOOK_COVER_VARIANT||variant===process.env.STORYBOOK_COVER_VARIANT);
const browser=await ({webkit,chromium}[engine]).launch();
await mkdir(output,{recursive:true});

function installVariant({variant,fixedPose}){
  const shell=document.querySelector('.book-shell');
  const support=[...shell.querySelectorAll(':scope > .book-depth,:scope > .book-edge-shadow')];
  const copies=variant==='crossfade'?support.map(element=>{
    const copy=element.cloneNode();element.before(copy);copy.style.clipPath='none';return copy;
  }):[];
  const paint=()=>{
    const leaf=shell.querySelector('.book-turn-leaf');
    const active=shell.matches('.is-opening,.is-closing');
    const angle=Number(leaf?.style.transform.match(/rotateY\((-?[\d.]+)deg\)/)?.[1]??0);
    const progress=fixedPose??Math.min(1,Math.abs(angle)/180);
    if(!active){
      support.forEach(el=>{el.style.removeProperty('left');el.style.removeProperty('clip-path');el.style.removeProperty('opacity');});
      copies.forEach(el=>{el.style.display='none';});return;
    }
    if(variant==='crossfade'){
      const ramp=Math.max(0,Math.min(1,(progress-.76)/.24));
      const alpha=ramp*ramp*(3-2*ramp);
      support.forEach((el,i)=>{el.style.opacity=String(1-alpha);copies[i].style.display='';copies[i].style.opacity=String(alpha);});
    }else if(variant==='angle'){
      const unfolded=Math.max(0,-Math.cos(Math.PI*progress));
      support.forEach(el=>{
        const inset=el.classList.contains('book-depth')?.45:0;
        el.style.clipPath='none';el.style.left=`${50-(50-inset)*unfolded}%`;
      });
    }
  };
  paint();
  if(fixedPose===null)new MutationObserver(records=>{
    if(records.some(record=>record.target===shell||record.target.classList?.contains('book-turn-leaf')))paint();
  }).observe(shell,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
}

const metrics=[];
try{
  for(const [device,viewport,dpr] of [['desktop',{width:1440,height:900},1],['phone',{width:390,height:844},3]]){
    const context=await browser.newContext({viewport,deviceScaleFactor:dpr,reducedMotion:'reduce'});
    const page=await context.newPage();
    const ready=()=>page.evaluate(async()=>{
      await Promise.all([...document.images].map(image=>image.decode()));await document.fonts.ready;
    });
    const reference={};
    for(const [end,query] of [['closed',''],['open','&scene=hello']]){
      await page.goto(`${base}/?story=letter${query}`);await ready();
      reference[end]=await page.screenshot({path:`${output}/${engine}-${device}-settled-${end}.png`});
    }
    for(const variant of variants){
      for(const pose of [0,.25,.5,.75,.9,.98,.99,1]){
        await page.goto(`${base}/?story=letter&from=cover&pose=${pose}`);await ready();
        if(variant!=='baseline')await page.evaluate(installVariant,{variant,fixedPose:pose});
        const png=await page.screenshot({path:`${output}/${engine}-${device}-${variant}-${pose}.png`});
        if(pose===0||pose===1){
          // Only the support zone, excluding print and the changing UI below.
          const area=await page.locator('.book-viewport').boundingBox();
          const box=pose===1?area:{x:area.x+area.width*.25,y:area.y,width:area.width/2,height:area.height};
          const score=await page.evaluate(async({pair,box,dpr})=>{
            async function read(src){
              const img=new Image();img.src=src;await img.decode();
              const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
              const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
              const x=Math.round(box.x*dpr),y=Math.round((box.y+box.height+2)*dpr);
              return ctx.getImageData(x,y,Math.round(box.width*dpr),Math.round(10*dpr)).data;
            }
            const [a,b]=await Promise.all(pair.map(read));let diff=0;
            for(let i=0;i<a.length;i+=4)for(let c=0;c<3;c++)diff+=Math.abs(a[i+c]-b[i+c]);
            return diff/(a.length/4*3);
          },{pair:[png,reference[pose===0?'closed':'open']].map(image=>'data:image/png;base64,'+image.toString('base64')),box,dpr});
          metrics.push({device,variant,pose,meanRGBError:score});
        }
      }
    }
    await context.close();
    for(const variant of variants){
      const live=await browser.newContext({viewport,deviceScaleFactor:dpr,recordVideo:{dir:output+'/raw',size:viewport}});
      const page=await live.newPage();
      await page.goto(`${base}/?story=letter`);
      await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
      if(variant!=='baseline')await page.evaluate(installVariant,{variant,fixedPose:null});
      await page.waitForTimeout(250);
      for(const name of ['下一页','上一页']){
        await page.getByRole('button',{name}).click();
        await page.locator('.book-turn-leaf').waitFor({state:'detached'});
        await page.waitForTimeout(300);
      }
      const video=page.video();await live.close();await video.saveAs(`${output}/${engine}-${device}-${variant}.webm`);await video.delete();
    }
  }
}finally{
  await browser.close();await writeFile(`${output}/${engine}-endpoint-scores.json`,JSON.stringify(metrics,null,2));
  console.log(JSON.stringify(metrics));
}
