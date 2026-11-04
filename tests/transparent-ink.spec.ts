import {expect,test} from '@playwright/test';
import {chapters} from '../src/data/story';
import {writeFile} from 'node:fs/promises';

test('retina phone uses transparent original ink without live photo filters or blend groups',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
  try{
    const page=await context.newPage();
    const seen=new Set<string>();
    for(const chapter of chapters){
      await page.goto('/?story=letter&scene='+chapter.id);
      const fragments=page.locator('.book-static .handwriting-fragment');
      const results=await fragments.evaluateAll(async items=>Promise.all(items.map(async item=>{
        const image=item.querySelector('img')!;await image.decode();
        const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
        const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        let clear=0,dark=0,colored=0;
        for(let i=0;i<pixels.length;i+=4){
          if(pixels[i+3]===0)clear++;
          else {dark++;if(pixels[i]||pixels[i+1]||pixels[i+2])colored++;}
        }
        return {id:(item as HTMLElement).dataset.inkId!,clear:clear/(pixels.length/4),dark,colored,
          filter:getComputedStyle(image).filter,blend:getComputedStyle(item.parentElement!).mixBlendMode};
      })));
      expect(results.length).toBeGreaterThanOrEqual(2);
      for(const result of results){
        // RGB photos, blank images and live blend/filter regressions must fail.
        expect(result.clear).toBeGreaterThan(.8);expect(result.dark).toBeGreaterThan(500);
        expect(result.colored).toBe(0);expect(result.filter).toBe('none');expect(result.blend).toBe('normal');
        seen.add(result.id);
      }
    }
    expect(seen.size).toBe(12);
  }finally{await context.close();}
});

// Compare the rendered cached art to the actual native page, including the
// WISH ellipse. Endpoint-only tests would bypass this cache and miss errors.
test('opaque letter prints match native artwork and ink',async({page},testInfo)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const chapter of chapters){
    const last=chapter.id==='wish';
    await page.goto(`/?story=letter&from=${last?'dream':chapter.id}&pose=.5`);
    await expect(page.locator('.book-turn-leaf')).toHaveAttribute('data-texture-ready','true');
    const native=`.paper-source[data-print="${last?'back':'front'}"] .page-surface`;
    const printed=`.paper-${last?'back':'front'}.is-letter-print`;
    const faces=await page.locator(printed).evaluateAll(items=>items.map(item=>({
      children:item.childElementCount,background:getComputedStyle(item).backgroundImage,
    })));
    expect(faces.length).toBeGreaterThan(1);
    for(const face of faces){
      expect(face.children).toBe(0);
      expect(face.background).toMatch(/^url\("blob:/);
      expect(face.background).toBe(faces[0].background);
    }
    const images:Buffer[]=[];
    for(const background of ['',faces[0].background]){
      await page.evaluate(async({native,background})=>{
        const reference=document.querySelector<HTMLElement>(native)!;
        const style=getComputedStyle(reference);
        const proof=document.createElement('div');proof.dataset.letterPrintProof='';
        Object.assign(proof.style,{position:'fixed',left:'0',top:'0',width:style.width,height:style.height,zIndex:'2147483647'});
        if(background){
          const image=new Image();image.src=background.slice(5,-2);await image.decode();
          const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
          const context=canvas.getContext('2d')!;context.drawImage(image,0,0);
          const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
          for(let i=3;i<rgba.length;i+=4)if(rgba[i]!==255)throw new Error('Turning page print is transparent');
          Object.assign(image.style,{display:'block',width:'100%',height:'100%'});proof.append(image);
        }else{
          const copy=reference.cloneNode(true) as HTMLElement;
          // Edge and gutter lighting belong to the book, not the page bitmap.
          Object.assign(copy.style,{boxShadow:'none',borderRadius:'0'});
          copy.querySelectorAll('.page-print-grain,.paper-bevel').forEach(el=>el.remove());
          proof.append(copy);
        }
        document.body.append(proof);
      },{native,background});
      const proof=page.locator('[data-letter-print-proof]');
      await proof.evaluate(el=>Promise.all([...el.querySelectorAll('img')].map(image=>image.decode())));
      images.push(await proof.screenshot());await proof.evaluate(el=>el.remove());
    }
    const error=await page.evaluate(async pair=>{
      const read=async(src:string)=>{const image=new Image();image.src=src;await image.decode();return image;};
      const [a,b]=await Promise.all(pair.map(read));
      if(a.width!==b.width||a.height!==b.height)throw new Error('Print size changed');
      const canvas=document.createElement('canvas');canvas.width=a.width;canvas.height=a.height;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(a,0,0);const x=ctx.getImageData(0,0,a.width,a.height).data;
      ctx.clearRect(0,0,a.width,a.height);ctx.drawImage(b,0,0);const y=ctx.getImageData(0,0,a.width,a.height).data;
      let sum=0;for(let i=0;i<x.length;i+=4)for(let k=0;k<3;k++)sum+=Math.abs(x[i+k]-y[i+k]);
      return sum/(a.width*a.height*3);
    },images.map(image=>'data:image/png;base64,'+image.toString('base64')));
    await testInfo.attach(chapter.id+'-paint-error',{body:Buffer.from(JSON.stringify({error})),contentType:'application/json'});
    if(error>=1){
      await writeFile(testInfo.outputPath(chapter.id+'-native.png'),images[0]);
      await writeFile(testInfo.outputPath(chapter.id+'-cached.png'),images[1]);
      await testInfo.attach(chapter.id+'-native',{body:images[0],contentType:'image/png'});
      await testInfo.attach(chapter.id+'-cached',{body:images[1],contentType:'image/png'});
    }
    // SVG brush textures rasterize at the cache's source resolution, then
    // resample to the page. Use the existing letter endpoint's 2/255 budget.
    expect.soft(error,chapter.id+' actual cached paint').toBeLessThan(2);
  }
});
