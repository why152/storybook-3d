/* global document, window, requestAnimationFrame */
import {webkit} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const baseline=process.env.STORYBOOK_SEGMENT_BASELINE??'http://127.0.0.1:5179';
const candidate=process.env.STORYBOOK_SEGMENT_CANDIDATE??'http://127.0.0.1:5175';
const output=process.argv[2]??'/tmp/storybook-segment-benchmark.json';
const b=await webkit.launch(),results=[];
for(const n of [13,8,8,13,13,8]){
 const context=await b.newContext({viewport:{width:390,height:844},reducedMotion:'no-preference'});const p=await context.newPage();
 await p.addInitScript(()=>{window.__frames=[];window.__counts=new Set();let last=0;const tick=now=>{if(last&&document.querySelector('.book-turn-leaf.is-flexible')){window.__frames.push(now-last);window.__counts.add(document.querySelectorAll('.paper-segment').length);}last=now;requestAnimationFrame(tick)};requestAnimationFrame(tick)});
 await p.goto(n===8?candidate:baseline);await p.waitForTimeout(500);
 await p.getByRole('button',{name:'下一页'}).click();await p.waitForFunction(()=>!document.querySelector('.book-turn-leaf'));
 for(const key of ['下一页','上一页','下一页','上一页']){
  await p.getByRole('button',{name:key}).click();await p.waitForFunction(()=>!document.querySelector('.book-turn-leaf'));await p.waitForTimeout(250);
 }
 const data=await p.evaluate(()=>{const frames=window.__frames.slice(2).sort((a,b)=>a-b);return {segmentCounts:[...window.__counts],frames:frames.length,p50:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)],max:frames.at(-1)}});
 results.push({segments:n,...data});console.log(JSON.stringify(results.at(-1)));await context.close();
}
await writeFile(output,JSON.stringify(results,null,2));await b.close();
