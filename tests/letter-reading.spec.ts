import {expect,test} from '@playwright/test';

for(const width of [320,390]){
  test(`${width}: read the same bound pages, then return to a physical turn`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:844});
    await page.goto('/?story=letter&scene=hello');
    await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
    const shell=page.locator('.book-shell');
    const original=await shell.elementHandle();
    const spreadWidth=(await shell.boundingBox())!.width;
    for(const side of ['left','right'] as const){
      await page.getByRole('button',{name:side==='left'?'放大左页':'放大右页'}).click();
      expect(await original!.evaluate(el=>el===document.querySelector('.book-shell'))).toBe(true);
      await expect(page.locator('.book-static .page-surface')).toHaveCount(2);
      await expect(page.locator('.book-viewport')).toHaveAttribute('data-grab-enabled','false');
      expect((await shell.boundingBox())!.width).toBeCloseTo(spreadWidth*2,0);
      // The requested original paper fills the aperture; its ink stays inside.
      const visible=await page.locator(`.book-${side} .handwriting-image`).evaluateAll(images=>images.every(image=>{
        const box=image.getBoundingClientRect();return box.left>=0&&box.right<=innerWidth;
      }));
      expect(visible).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
      // Swiping across a magnified word must not accidentally start a turn.
      await page.mouse.move(width*.8,180);await page.mouse.down();
      await page.mouse.move(width*.2,180,{steps:8});await page.mouse.up();
      await expect(page.locator('.book-turn-leaf')).toHaveCount(0);
      await page.screenshot({path:testInfo.outputPath(`hello-read-${side}.png`),fullPage:true});
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'双页全貌'})).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'放大右页'}).click();
    await page.getByRole('button',{name:'下一页',exact:true}).click();
    await expect(page.locator('.book-reading-stage')).toHaveAttribute('data-reading-side','spread');
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:20000});
    await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
    await page.getByRole('button',{name:'上一页',exact:true}).click();
    await expect(page.locator('.book-turn-leaf')).toHaveCount(0,{timeout:20000});
    await expect(page.locator('.book-static .letter-opening')).toHaveCount(2);
    await page.getByRole('button',{name:'放大左页'}).click();
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('.book-reading-stage')).toHaveAttribute('data-reading-side','spread');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
  });
}

for(const width of [1440,390]){
  test(`${width}: new letter layout remains registered at both turn endpoints`,async({page},testInfo)=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const [pose,scene] of [[0,'hello'],[1,'grow']] as const){
      await page.goto(`/?story=letter&from=hello&pose=${pose}`);
      await expect(page.locator('.book-turn-leaf')).toHaveAttribute('data-texture-ready','true');
      const moving=await page.locator('.book-shell').screenshot();
      await page.goto(`/?story=letter&scene=${scene}`);
      await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
      const settled=await page.locator('.book-shell').screenshot();
      const error=await page.evaluate(async([a,b])=>{
        const read=async(src:string)=>{const i=new Image();i.src=src;await i.decode();return i;};
        const [x,y]=await Promise.all([read(a),read(b)]);
        if(x.width!==y.width||x.height!==y.height)throw new Error('Book dimensions changed');
        const c=document.createElement('canvas');c.width=x.width;c.height=x.height;
        const ctx=c.getContext('2d')!;ctx.drawImage(x,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;
        ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(y,0,0);const q=ctx.getImageData(0,0,c.width,c.height).data;
        let sum=0;for(let i=0;i<p.length;i+=4)for(let k=0;k<3;k++)sum+=Math.abs(p[i+k]-q[i+k]);
        return sum/(c.width*c.height*3);
      },[moving,settled].map(image=>'data:image/png;base64,'+image.toString('base64')));
      if(error>=2){
        await testInfo.attach('turning',{body:moving,contentType:'image/png'});
        await testInfo.attach('settled',{body:settled,contentType:'image/png'});
      }
      expect(error).toBeLessThan(2);
    }
  });
}
