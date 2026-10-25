/* global document */
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const filename=process.argv[2]??'chromium-desktop-flexible-opening-forward-back.webm';
const browser=await chromium.launch();
const page=await browser.newPage();
await page.goto('http://127.0.0.1:5173/');
const png=await page.evaluate(async name=>{
 const video=document.createElement('video');video.src='/evidence/flexible-paper/'+name;
 video.muted=true;await new Promise((r,e)=>{video.onloadeddata=r;video.onerror=e;});
 const steps=Math.ceil(video.duration*4),canvas=document.createElement('canvas');
 canvas.width=1440;canvas.height=Math.ceil(steps/4)*245;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#111';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(let i=0;i<steps;i++){
  const time=Math.min(video.duration-.02,i/4+.01);
  await new Promise(r=>{video.onseeked=r;video.currentTime=time;});
  const x=i%4*360,y=Math.floor(i/4)*245;
  ctx.drawImage(video,x,y,360,225);ctx.fillStyle='#fff';ctx.font='13px sans-serif';ctx.fillText(time.toFixed(2)+'s',x+8,y+240);
 }
 return canvas.toDataURL('image/png').split(',')[1];
},filename);
await writeFile('evidence/flexible-paper/'+filename+'.png',Buffer.from(png,'base64'));
await browser.close();
