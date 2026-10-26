export type PrintedSurface={url:string;width:number;height:number;offsetX:number;offsetY:number};
export type PaperPrint={front:PrintedSurface;back:PrintedSurface;sourceWidth:number;sourceHeight:number};

const sources=new Map<string,Promise<string>>();
function embeddedSource(url:string){
  let source=sources.get(url);
  if(!source){
    source=fetch(url).then(response=>{
      if(!response.ok)throw new Error(`Page artwork ${response.status}`);
      return response.text();
    });
    sources.set(url,source);
  }
  return source;
}

/** Share registered original SVG art, while typography and paper finish
 * continue to use the same native HTML/CSS as settled pages. No scene metadata
 * or text layout is recreated in the renderer. */
export async function capturePaperPrint(pair:HTMLElement):Promise<PaperPrint>{
  // Module execution can precede stylesheet completion in WebKit. A frame
  // alone does not guarantee styled layout while the first CSS request loads.
  await Promise.all([...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map(link=>link.sheet?Promise.resolve():new Promise<void>(resolve=>{
    link.addEventListener('load',()=>resolve(),{once:true});
    link.addEventListener('error',()=>resolve(),{once:true});
  })));
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  const sources=[...pair.querySelectorAll<HTMLElement>('.page-surface')];
  const pages=await Promise.all(sources.map(async surface=>{
    const images=[...surface.querySelectorAll<HTMLImageElement>('.scene-plane')];
    // WebKit may reject overlapping decode() calls on the same SVG element.
    // Source load is enough here; decode the shared SVG resource separately.
    await Promise.all(images.map(image=>image.complete?(image.naturalWidth>0?Promise.resolve():Promise.reject(new Error('Original page artwork failed to load'))):new Promise<void>((resolve,reject)=>{
      image.addEventListener('load',()=>resolve(),{once:true});
      image.addEventListener('error',()=>reject(new Error('Original page artwork failed to load')),{once:true});
    })));
    const bounds=surface.getBoundingClientRect();
    const {width,height}=bounds;
    if(!(width>0&&height>0))throw new Error(`Paper source has no layout: ${width}x${height}`);
    const style=getComputedStyle(surface);
    const composition=surface.querySelector('.spread-composition')!.getBoundingClientRect();
    const artWidth=composition.width;
    const layers:string[]=[];
    let intrinsicWidth=0,intrinsicHeight=0;
    for(const [index,image] of images.entries()){
      const ink=getComputedStyle(image);
      const [originX,originY]=ink.transformOrigin.split(' ').map(parseFloat);
      const matrix=new DOMMatrix(ink.transform==='none'?undefined:ink.transform);
      const original=await embeddedSource(image.currentSrc||image.src);
      const svg=new DOMParser().parseFromString(original,'image/svg+xml').documentElement;
      if(index===0){
        const viewBox=svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
        intrinsicWidth=viewBox[2];intrinsicHeight=viewBox[3];
      }
      // Keep each source's gradients, masks and patterns independent after
      // embedding paths. No asynchronous nested image resources remain.
      const ids=new Map([...svg.querySelectorAll('[id]')].map(el=>[el.id,`plane-${index}-${el.id}`]));
      for(const element of [svg,...svg.querySelectorAll('*')])for(const attribute of [...element.attributes]){
        if(attribute.name==='id')element.setAttribute('id',ids.get(attribute.value)!);
        else element.setAttribute(attribute.name,attribute.value.replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${ids.get(id)??id})`).replace(/^#(.+)$/,(_,id)=>ids.has(id)?`#${ids.get(id)}`:`#${id}`));
      }
      svg.setAttribute('width',String(artWidth));svg.setAttribute('height',String(height));
      svg.setAttribute('preserveAspectRatio','none');
      layers.push(`<g transform="translate(${originX} ${originY}) matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f}) translate(${-originX} ${-originY})">${new XMLSerializer().serializeToString(svg)}</g>`);
    }
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${intrinsicWidth}" height="${intrinsicHeight}" viewBox="0 0 ${artWidth} ${height}" preserveAspectRatio="none"><rect width="100%" height="100%" fill="${style.backgroundColor}"/>${layers.join('')}</svg>`;
    const url='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const ready=new Image();ready.src=url;
    await ready.decode();
    return {url,width:artWidth,height,offsetX:surface.dataset.side==='right'?width:0,offsetY:0,sourceWidth:width,sourceHeight:height};
  }));
  return {front:pages[0],back:pages[1],sourceWidth:pages[0].sourceWidth,sourceHeight:pages[0].sourceHeight};
}
