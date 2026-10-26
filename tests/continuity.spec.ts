import { expect, test } from '@playwright/test';
import { chapters } from '../src/data/story';

// Freeze a deliberately non-neutral printed pose: resetting to registration
// coordinates must fail, even if all page-count/navigation tests still pass.
for(const chapter of chapters.slice(0,-1)){
  test(`${chapter.word} keeps the printed pose through forward and reverse handoffs`,async ({page})=>{
    await page.goto('/?scene='+chapter.id);
    await page.evaluate(async()=>{
      await Promise.all([...document.images].map(image=>image.decode()));
      for(const el of document.querySelectorAll('.book-static .scene-plane')){
        for(const animation of el.getAnimations()){
          animation.pause();
          await animation.ready;
          animation.currentTime=1250;
        }
      }
    });
    const nativeSurface=page.locator('.book-right .page-surface');
    const printBox=(await nativeSurface.boundingBox())!;
    await nativeSurface.evaluate(surface=>surface.querySelectorAll<HTMLElement>('.page-print-grain,.paper-bevel,.page-chapter,.page-quote').forEach(el=>{el.style.visibility='hidden'}));
    const nativePrint=await page.screenshot();
    await nativeSurface.evaluate(surface=>surface.querySelectorAll<HTMLElement>('.page-print-grain,.paper-bevel,.page-chapter,.page-quote').forEach(el=>{el.style.removeProperty('visibility')}));
    const source=await page.locator('.book-left .scene-plane').evaluateAll(planes=>
      planes.map(el=>getComputedStyle(el).transform));
    await page.getByRole('button',{name:'下一页'}).click();
    const leaf=page.locator('.book-turn-leaf');
    await expect(leaf).toBeVisible();
    // Paint the actual shared SVG at the same viewport coordinates. Resizing
    // an element screenshot into a canvas changes its fractional pixel phase.
    await page.evaluate(async box=>{
      const source=document.querySelector<HTMLImageElement>('.paper-front .paper-art')!;
      const proof=document.createElement('div');proof.dataset.paperPrintProof='';
      Object.assign(proof.style,{position:'fixed',left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px',overflow:'hidden',zIndex:'2147483647',background:'#f4e0c4'});
      const image=new Image();image.src=source.src;
      Object.assign(image.style,{position:'absolute',left:-box.width+'px',top:'0',width:2*box.width+'px',height:box.height+'px'});
      proof.append(image);document.body.append(proof);await image.decode();
    },printBox);
    const printedProof=await page.screenshot();
    await page.locator('[data-paper-print-proof]').evaluate(el=>el.remove());
    const bitmapError=await page.evaluate(async({native,proof,box})=>{
      const read=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return image;};
      const [original,print]=await Promise.all([read('data:image/png;base64,'+native),read('data:image/png;base64,'+proof)]);
      const canvas=document.createElement('canvas');canvas.width=original.width;canvas.height=original.height;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(original,0,0);
      const a=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(print,0,0);
      const b=ctx.getImageData(0,0,canvas.width,canvas.height).data;let sum=0,n=0;
      for(let y=Math.ceil(box.y+box.height*.03);y<box.y+box.height*.97;y++)for(let x=Math.ceil(box.x+box.width*.03);x<box.x+box.width*.97;x++){
        const i=(y*canvas.width+x)*4;for(let c=0;c<3;c++){sum+=Math.abs(a[i+c]-b[i+c]);n++;}
      }return sum/n;
    },{native:nativePrint.toString('base64'),proof:printedProof.toString('base64'),box:printBox});
    expect(bitmapError,'shared print must preserve the actual frozen artwork, not just source metadata').toBeLessThan(2.5);
    const moving=await page.locator('.paper-source[data-print=front] .scene-plane').evaluateAll(planes=>
      planes.map(el=>(el as HTMLElement).style.transform));
    const stationary=await page.locator('.book-left .scene-plane').evaluateAll(planes=>
      planes.map(el=>getComputedStyle(el).transform));
    expect(moving).toEqual(source);
    expect(stationary).toEqual(source);
    // Incoming page and its printed reverse must agree before landing.
    const arrival=await page.locator('.book-right .scene-plane').evaluateAll(planes=>
      planes.map(el=>getComputedStyle(el).transform));
    expect(await page.locator('.paper-source[data-print=back] .scene-plane').evaluateAll(planes=>
      planes.map(el=>(el as HTMLElement).style.transform))).toEqual(arrival);
    await expect(leaf).toHaveCount(0);
    const playing=await page.locator('.book-static .scene-plane').evaluateAll(planes=>
      planes.flatMap(plane=>plane.getAnimations().map(animation=>animation.playState)));
    expect(playing.length).toBeGreaterThan(0);
    expect(playing.every(state=>state==='running')).toBe(true);
    // Both halves must continue the same animation clocks on the spread.
    const phaseError=await page.locator('.book-shell').evaluate(shell=>{
      const left=shell.querySelectorAll('.book-left .scene-plane');
      const right=shell.querySelectorAll('.book-right .scene-plane');
      return Math.max(0,...[...left].flatMap((el,i)=>el.getAnimations().map((a,j)=>{
        const b=right[i].getAnimations()[j];
        return Math.abs(Number(a.currentTime)-Number(b?.currentTime??0));
      })));
    });
    expect(phaseError).toBeLessThan(2);
    await page.getByRole('button',{name:'上一页'}).click();
    await expect(leaf).toBeVisible();
    const reverse=await page.locator('.paper-source[data-print=back] .scene-plane').evaluateAll(planes=>
      planes.map(el=>(el as HTMLElement).style.transform));
    expect(reverse).toEqual(await page.locator('.book-right .scene-plane').evaluateAll(planes=>
      planes.map(el=>getComputedStyle(el).transform)));
    await expect(leaf).toHaveCount(0);
    await expect(page.locator(`.book-static .page-surface[data-chapter="${chapter.id}"]`)).toHaveCount(2);
  });
}

test('cold incoming artwork is decoded before the paper starts moving',async ({page})=>{
  let release!:()=>void;
  const pending=new Promise<void>(resolve=>{release=resolve});
  await page.route('**/assets/grow/**',async route=>{await pending;await route.continue()});
  await page.goto('/?scene=hello');
  await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
  await page.getByRole('button',{name:'下一页'}).click();
  const leaf=page.locator('.book-turn-leaf');
  await expect(leaf).toHaveCount(1);
  await expect(leaf).not.toBeVisible();
  await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
  const start=await leaf.evaluate(el=>getComputedStyle(el).transform);
  await page.waitForTimeout(300);
  expect(await leaf.evaluate(el=>getComputedStyle(el).transform)).toBe(start);
  await expect(page.getByRole('button',{name:'下一页'})).toBeDisabled();
  release();
  await expect(leaf).toHaveCount(0);
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});

// Compare actual painted pixels against each settled spread. DOM face counts
// cannot detect a compositor painting mirrored back-face children in WebKit.
for(const width of [1280,390])for(const pose of [0,1]){
  test(`painted ${width}px turn endpoint ${pose} matches its settled artwork`,async ({page})=>{
    await page.setViewportSize({width,height:width===390?844:720});
    await page.emulateMedia({reducedMotion:'reduce'});
    const chapter=chapters[1+pose];
    const ready=()=>page.evaluate(async()=>{
      await document.fonts.ready;
      await Promise.all([...document.images].map(image=>image.decode()));
    });
    await page.goto('/?scene='+chapter.id);
    await ready();
    const box=(await page.locator('.book-viewport').boundingBox())!;
    const settled=await page.screenshot();
    await page.goto(`/?pose=${pose}&from=${chapters[1].id}`);
    await ready();
    await expect(page.locator('.book-turn-leaf')).toBeVisible();
    const turning=await page.screenshot({path:`test-results/endpoint-${width}-${pose}.png`});
    const error=await page.evaluate(async({a,b,box})=>{
      const read=async(data:string)=>{
        const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
        const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
        return ctx.getImageData(0,0,canvas.width,canvas.height);
      };
      const [first,second]=await Promise.all([read(a),read(b)]);
      let sum=0,count=0;
      // Exclude page bevel/shadows while retaining both actual printed halves.
      for(let y=Math.ceil(box.y+box.height*.05);y<box.y+box.height*.95;y++){
        for(let x=Math.ceil(box.x+box.width*.05);x<box.x+box.width*.95;x++){
          const i=(y*first.width+x)*4;
          for(let c=0;c<3;c++){sum+=Math.abs(first.data[i+c]-second.data[i+c]);count++;}
        }
      }
      return sum/count;
    },{a:settled.toString('base64'),b:turning.toString('base64'),box});
    expect(error,'painted artwork must match, including readable face orientation').toBeLessThan(3);
  });
}
