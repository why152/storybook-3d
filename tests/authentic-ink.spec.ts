import {expect,test} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {chapters} from '../src/data/story';

const enabled=process.env.STORYBOOK_TEST_PRIVATE_INK==='1';
const evidence=process.env.STORYBOOK_PRIVATE_EVIDENCE_DIR;
test.skip(!enabled,'Private original ink is tested only with an external private evidence directory.');

test.beforeAll(async()=>{
  if(!evidence||!path.isAbsolute(evidence))throw new Error('Private evidence must have an absolute external path.');
  const common=execFileSync('git',['rev-parse','--git-common-dir'],{encoding:'utf8'}).trim();
  for(const root of [process.cwd(),path.dirname(path.resolve(common))]){
    const relative=path.relative(root,evidence);
    if(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative))
      throw new Error('Never write private screenshots into the public checkout.');
  }
  await mkdir(evidence,{recursive:true});
});

async function ready(page:import('@playwright/test').Page){
  await page.waitForFunction(()=>[...document.images].every(image=>image.complete&&image.naturalWidth>0));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}

for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  test(`${viewport.width}: original handwriting shares all five illustrated spreads`,async({page,browserName})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    const seen=new Set<string>();
    for(const chapter of chapters){
      await page.goto('/?story=letter&scene='+chapter.id);await ready(page);
      await expect(page.locator('.has-authentic-handwriting')).toHaveCount(1);
      await expect(page.locator('.letter-leaf')).toHaveCount(0);
      const surfaces=page.locator('.book-static .page-surface');
      await expect(surfaces).toHaveCount(2);
      await expect(surfaces.locator('.plane-lettering')).toHaveCount(2);
      expect(await surfaces.locator('.scene-actor').count()).toBeGreaterThanOrEqual(4);
      const ink=await surfaces.locator('.handwriting-fragment').evaluateAll(items=>items.map(item=>{
        const image=item.querySelector('img')!;
        const paper=item.closest('.page-surface')!.getBoundingClientRect(),box=item.getBoundingClientRect();
        return {id:(item as HTMLElement).dataset.inkId,decoded:image.complete&&image.naturalWidth>0,
          inside:box.left>=paper.left&&box.right<=paper.right+1&&box.top>=paper.top&&box.bottom<=paper.bottom+1,
          area:box.width*box.height/(paper.width*paper.height)};
      }));
      expect(ink.length).toBeGreaterThanOrEqual(2);
      for(const fragment of ink){
        expect(fragment.decoded).toBe(true);expect(fragment.inside).toBe(true);
        expect(fragment.area).toBeLessThan(.22);seen.add(fragment.id!);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
      await page.screenshot({path:path.join(evidence!,`${browserName}-${viewport.width}-${chapter.id}.png`)});
      await expect(page.locator('.handwriting-reader')).toHaveCount(0);
      await expect(page.locator('.book-reading-hint')).toContainText('放大左页');
      if(viewport.width<=600){
        await expect(page.locator('.book-reading-hint')).toBeVisible();
        for(const side of ['left','right'] as const){
          const zoom=page.getByRole('button',{name:side==='left'?'放大左页':'放大右页'});
          await zoom.click();await expect(zoom).toHaveAttribute('aria-pressed','true');
          await expect(page.locator('.book-reading-stage')).toHaveAttribute('data-reading-side',side);
          const visibleInk=page.locator(`.book-${side} .handwriting-image`);
          await expect(visibleInk).not.toHaveCount(0);
          const contained=await visibleInk.evaluateAll(items=>{
            const stage=document.querySelector('.book-reading-stage')!.getBoundingClientRect();
            return items.every(item=>{const box=item.getBoundingClientRect();
              return box.left>=stage.left-1&&box.right<=stage.right+1&&box.top>=stage.top-1&&box.bottom<=stage.bottom+1;});
          });
          expect(contained).toBe(true);
          expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
          await page.screenshot({path:path.join(evidence!,`${browserName}-${viewport.width}-${chapter.id}-${side}-reader.png`),fullPage:true});
        }
      }
      await page.screenshot({path:path.join(evidence!,`${browserName}-${viewport.width}-${chapter.id}-reader.png`),fullPage:true});
    }
    expect(seen.size).toBe(12);
  });

  test(`${viewport.width}: original front/back ink stays on the curved paper at five poses`,async({page,browserName})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    for(const pose of [0,.25,.5,.75,1]){
      await page.goto(`/?story=letter&from=grow&pose=${pose}`);
      const leaf=page.locator('.book-turn-leaf.is-flexible');
      await expect(leaf).toHaveAttribute('data-texture-ready','true');await ready(page);
      await expect(leaf).toHaveCount(1);
      expect(await leaf.locator('.paper-front .handwriting-image').count()).toBeGreaterThan(0);
      expect(await leaf.locator('.paper-back .handwriting-image').count()).toBeGreaterThan(0);
      expect(await leaf.locator('.letter-leaf').count()).toBe(0);
      const dimensions=await leaf.evaluate(el=>({leaf:el.getBoundingClientRect().width,shell:el.closest('.book-shell')!.getBoundingClientRect().width}));
      expect(dimensions.leaf/dimensions.shell).toBeCloseTo(.5,2);
      await page.screenshot({path:path.join(evidence!,`${browserName}-${viewport.width}-turn-${pose}.png`)});
    }
  });

  test(`${viewport.width}: original ink endpoints match the settled front and back pages`,async({page,browserName})=>{
    await page.setViewportSize(viewport);await page.emulateMedia({reducedMotion:'reduce'});
    for(const [pose,scene] of [[0,'grow'],[1,'together']] as const){
      await page.goto(`/?story=letter&from=grow&pose=${pose}`);
      await expect(page.locator('.book-turn-leaf')).toHaveAttribute('data-texture-ready','true');await ready(page);
      const moving=await page.locator('.book-shell').screenshot();
      await page.goto('/?story=letter&scene='+scene);await ready(page);
      const settled=await page.locator('.book-shell').screenshot();
      const error=await page.evaluate(async([a,b])=>{
        const read=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return image;};
        const [first,last]=await Promise.all([read(a),read(b)]);
        if(first.width!==last.width||first.height!==last.height)throw new Error('Book bounds changed');
        const c=document.createElement('canvas');c.width=first.width;c.height=first.height;
        const ctx=c.getContext('2d')!;ctx.drawImage(first,0,0);const x=ctx.getImageData(0,0,c.width,c.height).data;
        ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(last,0,0);const y=ctx.getImageData(0,0,c.width,c.height).data;
        let difference=0;
        for(let i=0;i<x.length;i+=4)for(let k=0;k<3;k++)difference+=Math.abs(x[i+k]-y[i+k]);
        return difference/(c.width*c.height*3);
      },[moving,settled].map(image=>'data:image/png;base64,'+image.toString('base64')));
      await writeFile(path.join(evidence!,`${browserName}-${viewport.width}-endpoint-${pose}.json`),JSON.stringify({error}));
      expect(error).toBeLessThan(2);
    }
  });

  test(`${viewport.width}: records real private opening and bidirectional turns with resource timings`,async({browser,browserName})=>{
    const context=await browser.newContext({viewport,recordVideo:{dir:evidence!,size:viewport}});
    const page=await context.newPage();
    await page.addInitScript(()=>{
      const active=new Map<string,number>();
      const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
      URL.createObjectURL=blob=>{const url=create(blob);active.set(url,blob instanceof Blob?blob.size:0);return url;};
      URL.revokeObjectURL=url=>{active.delete(url);revoke(url);};
      let start=0,previous=0,readinessMs:number|null=null,frames:number[]=[];
      const tick=(now:number)=>{
        const leaf=document.querySelector<HTMLElement>('.book-turn-leaf');
        if(start&&leaf&&leaf.dataset.loading!=='true'){
          readinessMs??=now-start;
          if(previous)frames.push(now-previous);
          previous=now;
        }else previous=0;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      Object.assign(window,{
        startInkMeasurement:()=>{start=performance.now();readinessMs=null;frames=[];previous=0;},
        inkResources:()=>{
          const sorted=[...frames].sort((a,b)=>a-b);
          return {count:active.size,bytes:[...active.values()].reduce((a,b)=>a+b,0),readinessMs,
            samples:frames.length,frameP50:sorted[Math.floor(sorted.length*.5)],frameP95:sorted[Math.floor(sorted.length*.95)]};
        },
      });
    });
    const measurements=[];
    try{
      await page.goto('/?story=letter');await ready(page);
      for(const direction of ['下一页','下一页','上一页','下一页','上一页','上一页']){
        await page.evaluate(()=>(window as unknown as {startInkMeasurement:()=>void}).startInkMeasurement());
        const started=Date.now();
        await page.getByRole('button',{name:direction}).click();
        await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:20000});
        const resources=await page.evaluate(()=>{
          const measure=(window as unknown as {inkResources:()=>{count:number;bytes:number}}).inkResources;
          return measure();
        });
        expect(resources.count).toBe(0);
        measurements.push({direction,totalMs:Date.now()-started,...resources});
        await page.waitForTimeout(180);
      }
      await expect(page.locator('.book-shell')).toHaveAttribute('data-book-mode','closed');
      await writeFile(path.join(evidence!,`${browserName}-${viewport.width}-timings.json`),JSON.stringify(measurements,null,2));
    }finally{
      const video=page.video();await context.close();
      await video?.saveAs(path.join(evidence!,`${browserName}-${viewport.width}-private-motion.webm`));
    }
  });
}
