export type PrintedSurface=
  |{kind:'layered';below:string;above:string;letteringTransform:string;letteringOrigin:string}
  |{kind:'letter';composition:string};
export type PaperPrint={front:PrintedSurface;back:PrintedSurface};

export function releasePaperPrint(print:PaperPrint){
  for(const face of [print.front,print.back]){
    for(const url of face.kind==='letter'?[face.composition]:[face.below,face.above])URL.revokeObjectURL(url);
  }
}

/** Freeze the existing printed pose once per turn. Birthday pages retain
 * native vector lettering between two bands; letter pages bake their faint
 * lettering and fade into one band to avoid live masks on every strip. */
export async function capturePaperPrint(pair:HTMLElement):Promise<PaperPrint>{
  await Promise.all([...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')]
    .filter(link=>new URL(link.href).origin===location.origin)
    .map(link=>link.sheet?Promise.resolve():new Promise<void>(resolve=>{
      link.addEventListener('load',()=>resolve(),{once:true});
      link.addEventListener('error',()=>resolve(),{once:true});
    })));
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  const created:string[]=[];
  const encode=async(canvas:HTMLCanvasElement)=>{
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Paper print encoding failed')),'image/png'));
    const url=URL.createObjectURL(blob);created.push(url);
    const ready=new Image();ready.src=url;await ready.decode();return url;
  };
  try{
    const results=await Promise.allSettled([...pair.querySelectorAll<HTMLElement>('.page-surface')].map(async(surface):Promise<PrintedSurface>=>{
      const images=[...surface.querySelectorAll<HTMLImageElement>('.scene-plane')];
      await Promise.all(images.map(image=>image.complete
        ?(image.naturalWidth>0?Promise.resolve():Promise.reject(new Error('Original page artwork failed to load')))
        :new Promise<void>((resolve,reject)=>{
          image.addEventListener('load',()=>resolve(),{once:true});
          image.addEventListener('error',()=>reject(new Error('Original page artwork failed to load')),{once:true});
        })));
      const {height}=surface.getBoundingClientRect();
      const artWidth=surface.querySelector('.spread-composition')!.getBoundingClientRect().width;
      if(!(artWidth>0&&height>0))throw new Error('Paper source has no styled layout');
      const pixelWidth=Math.max(images[0].naturalWidth,Math.ceil(artWidth*window.devicePixelRatio));
      const pixelHeight=Math.round(pixelWidth*images[0].naturalHeight/images[0].naturalWidth);
      const make=()=>{
        const canvas=document.createElement('canvas');canvas.width=pixelWidth;canvas.height=pixelHeight;
        const ctx=canvas.getContext('2d')!;ctx.scale(pixelWidth/artWidth,pixelHeight/height);
        return {canvas,ctx};
      };
      const letter=surface.classList.contains('letter-page');
      const below=make(),above=letter?below:make();
      below.ctx.fillStyle=getComputedStyle(surface).backgroundColor;below.ctx.fillRect(0,0,artWidth,height);
      let ctx=below.ctx,letteringTransform='none',letteringOrigin='50% 50%';
      for(const image of images){
        const ink=getComputedStyle(image);
        const [originX,originY]=ink.transformOrigin.split(' ').map(parseFloat);
        if(!letter&&image.classList.contains('plane-lettering')){
          letteringTransform=ink.transform;letteringOrigin=`${originX/artWidth*100}% ${originY/height*100}%`;
          ctx=above.ctx;continue;
        }
        const matrix=new DOMMatrix(ink.transform==='none'?undefined:ink.transform);
        ctx.save();ctx.globalAlpha=Number(ink.opacity);ctx.translate(originX,originY);
        ctx.transform(matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f);
        ctx.translate(-originX,-originY);ctx.drawImage(image,0,0,artWidth,height);ctx.restore();
      }
      if(letter){
        // Freeze the *same* composition and CSS-authored fade once. Repeating
        // live masks on every projected strip forces WebKit to rasterize the
        // art again as lighting changes. Native settled pages keep their actors.
        const style=getComputedStyle(surface.querySelector('.spread-composition')!);
        const value=(name:string)=>parseFloat(style.getPropertyValue('--letter-'+name));
        ctx=below.ctx;ctx.save();ctx.globalCompositeOperation='destination-in';
        let fade:CanvasGradient;
        if(style.getPropertyValue('--letter-mask-shape').trim()==='ellipse'){
          const x=value('mask-x')*artWidth,y=value('mask-y')*height;
          const rx=Math.max(x,artWidth-x)*Math.SQRT2,ry=Math.max(y,height-y)*Math.SQRT2;
          ctx.translate(x,y);ctx.scale(rx,ry);
          fade=ctx.createRadialGradient(0,0,0,0,0,1);
        }else fade=ctx.createLinearGradient(0,0,0,height);
        fade.addColorStop(value('fade-start'),'transparent');fade.addColorStop(value('fade-end'),'#000');
        ctx.fillStyle=fade;
        // Fill in artboard coordinates even when the gradient uses an ellipse.
        ctx.setTransform(below.canvas.width/artWidth,0,0,below.canvas.height/height,0,0);
        ctx.fillRect(0,0,artWidth,height);ctx.restore();
        return {kind:'letter',composition:await encode(below.canvas)};
      }
      // Wait for both encoders before cleanup even if one of them fails.
      const encoded=await Promise.allSettled([encode(below.canvas),encode(above.canvas)]);
      const urls=encoded.map(result=>{if(result.status==='rejected')throw result.reason;return result.value;});
      return {kind:'layered',below:urls[0],above:urls[1],letteringTransform,letteringOrigin};
    }));
    const pages=results.map(result=>{if(result.status==='rejected')throw result.reason;return result.value;});
    return {front:pages[0],back:pages[1]};
  }catch(error){created.forEach(url=>URL.revokeObjectURL(url));throw error;}
}
