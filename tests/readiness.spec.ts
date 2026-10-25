import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type Capture = {
  viewport: string;
  chapter: string;
  width: number;
  height: number;
  sceneImageCount: number;
  allImagesLoaded: boolean;
  totalDocumentWidth: number;
  horizontalOverflowPx: number;
  bookWidth: number;
  bookHeight: number;
  bindingToBookMiddlePx: number;
  sceneResourceCount: number;
  sceneTransferBytes: number;
  sceneDecodedBytes: number;
  browserSample: {
    durationMs: number;
    frames: number;
    medianIntervalMs: number | null;
    p95IntervalMs: number | null;
    note: string;
  };
  screenCapture: string;
};

const chapters = ['hello','grow','together','dream','wish'] as const;
const sizes = [
  {name:'desktop-1280x720',width:1280,height:720},
  {name:'mobile-390x844',width:390,height:844},
] as const;

function rounded(number:number){return Math.round(number*100)/100;}

test('capture reproducible book asset/layout/readability baselines before premium shader work', async ({browser})=>{
  test.setTimeout(140_000);
  const captures: Capture[]=[];
  const problems: string[]=[];
  const out='test-results';
  mkdirSync(out,{recursive:true});
  const context=await browser.newContext({
    viewport:{width:1280,height:720},
    reducedMotion:'reduce',
    deviceScaleFactor:1,
  });
  const page=await context.newPage();
  page.on('pageerror',error=>problems.push('Page error: '+error.message));
  page.on('console',message=>{
    if(message.type()==='error')problems.push('Console error: '+message.text());
  });
  try{
    for(const viewport of sizes){
      await page.setViewportSize({width:viewport.width,height:viewport.height});
      for(const chapter of chapters){
        await page.goto('/?scene='+chapter,{waitUntil:'networkidle'});
        const images=page.locator('.book-static .page-surface .scene-plane');
        await expect(images).toHaveCount(chapter==='hello'?14:16);
        await expect.poll(async()=>images.evaluateAll(list=>list.every(
          img=>(img as HTMLImageElement).complete &&
               (img as HTMLImageElement).naturalWidth===1200 &&
               (img as HTMLImageElement).naturalHeight===700
        ))).toBe(true);
        await expect(page.locator('.book-shell.is-open:not(.is-turning)')).toHaveCount(1);
        await expect(page.locator('.book-static .page-surface[data-chapter="'+chapter+'"]')).toHaveCount(2);
        const sceneStats=await page.evaluate(()=>{
          const book=document.querySelector<HTMLElement>('.book-shell')!;
          const binding=document.querySelector<HTMLElement>('.book-binding')!;
          const rect=book.getBoundingClientRect();
          const bindingRect=binding.getBoundingClientRect();
          const images=[...document.querySelectorAll<HTMLImageElement>('.book-static .scene-plane')];
          const resources=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
          const illustration=resources.filter(x=>x.name.includes('/assets/'));
          return {
            imageCount:images.length,
            imageReady:images.every(x=>x.complete&&x.naturalWidth===1200&&x.naturalHeight===700),
            docWidth:document.documentElement.scrollWidth,
            bookWidth:rect.width,
            bookHeight:rect.height,
            gutterDelta:Math.abs(bindingRect.left+bindingRect.width/2-(rect.left+rect.width/2)),
            resources:illustration.length,
            transferBytes:illustration.reduce((sum,r)=>sum+(r.transferSize||0),0),
            decodedBytes:illustration.reduce((sum,r)=>sum+(r.decodedBodySize||0),0),
          };
        });
        const raf=await page.evaluate(async ()=>{
          const intervals:number[]=[];
          let previous=0;
          const until=performance.now()+450;
          await new Promise<void>(done=>{
            const step=(time:number)=>{
              if(previous)intervals.push(time-previous);
              previous=time;
              if(time>=until)done();
              else requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          });
          intervals.sort((a,b)=>a-b);
          return {
            frames:intervals.length,
            p50:intervals.length?intervals[Math.floor(intervals.length/2)]:null,
            p95:intervals.length?intervals[Math.min(intervals.length-1,Math.floor(intervals.length*.95))]:null,
          };
        });
        const imageName='qa-'+viewport.name+'-'+chapter+'.png';
        await page.screenshot({path:join(out,imageName),animations:'disabled'});
        const item:Capture={
          viewport:viewport.name,chapter,width:viewport.width,height:viewport.height,
          sceneImageCount:sceneStats.imageCount,
          allImagesLoaded:sceneStats.imageReady,
          totalDocumentWidth:sceneStats.docWidth,
          horizontalOverflowPx:Math.max(0,sceneStats.docWidth-viewport.width),
          bookWidth:rounded(sceneStats.bookWidth),
          bookHeight:rounded(sceneStats.bookHeight),
          bindingToBookMiddlePx:rounded(sceneStats.gutterDelta),
          sceneResourceCount:sceneStats.resources,
          sceneTransferBytes:sceneStats.transferBytes,
          sceneDecodedBytes:sceneStats.decodedBytes,
          browserSample:{
            durationMs:450,frames:raf.frames,
            medianIntervalMs:raf.p50===null?null:rounded(raf.p50),
            p95IntervalMs:raf.p95===null?null:rounded(raf.p95),
            note:'Headless Chromium rAF cadence with reduced-motion stills; NOT a GPU benchmark, FPS guarantee, energy estimate, or final shader comparison.',
          },
          screenCapture:imageName,
        };
        captures.push(item);
        expect(item.horizontalOverflowPx,viewport.name+'/'+chapter+' overflow').toBeLessThanOrEqual(2);
        expect(item.bindingToBookMiddlePx,chapter+' book-spine registration').toBeLessThanOrEqual(8);
        expect(item.allImagesLoaded).toBeTruthy();
      }
    }
  }finally{
    await context.close();
  }
  const report={
    schema:1,
    description:'Reproducible fixed-view image, page-geometry and browser-sampling audit, not verified mobile GPU throughput',
    createdAt:new Date().toISOString(),
    commit:process.env.GITHUB_SHA||'local-working-tree',
    chapters:[...chapters],viewports:sizes,captures,problems,
  };
  writeFileSync(join(out,'qa-readiness.json'),JSON.stringify(report,null,2)+'\n');
  const markdown=[
    '# Book readiness — two viewports × five chapters',
    '',
    'CI evidence, not a frame-rate guarantee. Source: actual Chromium DOM + image decoding.',
    '',
    '| Viewport | Chapter | SVG images | Image loaded | Gutter Δpx | Overflow px | p95 rAF interval ms | Screenshot |',
    '| --- | --- | ---: | --- | ---: | ---: | ---: | --- |',
    ...captures.map(c=>`| ${c.viewport} | ${c.chapter.toUpperCase()} | ${c.sceneImageCount} | ${c.allImagesLoaded?'yes':'NO'} | ${c.bindingToBookMiddlePx} | ${c.horizontalOverflowPx} | ${c.browserSample.p95IntervalMs??'n/a'} | [open](${c.screenCapture}) |`),
    '',
    'Treat the rAF interval as a **software Chromium environment observation**. Never use it to claim a GPU shader outperforms CSS. Real device profiling is required.',
    '',
    'Full machine-readable data: [qa-readiness.json](qa-readiness.json).',
    '',
  ].join('\n');
  writeFileSync(join(out,'qa-readiness.md'),markdown);
  expect(captures).toHaveLength(10);
  expect(problems).toEqual([]);
});
