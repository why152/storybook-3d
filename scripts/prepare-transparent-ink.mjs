/* global Image, document */
// Reproduce the approved CSS grayscale(1) brightness(1.3) contrast(1.1)
// + multiply as black ink with alpha. No tracing, resampling or new strokes.
// Original approved RGB crops remain recoverable from the pinned Git revision.
import {chromium} from '@playwright/test';
import {execFileSync} from 'node:child_process';
import {readdir,readFile,writeFile} from 'node:fs/promises';
const write=process.argv.includes('--write');
const sourceRef='6b08146';
const browser=await chromium.launch();
try{
 const page=await browser.newPage();
 const report=[];
 for(const file of (await readdir('public/handwriting')).filter(f=>f.endsWith('.png')).sort()){
  const original=execFileSync('git',['show',`${sourceRef}:public/handwriting/${file}`]);
  const result=await page.evaluate(async ({src,current,write})=>{
   const image=new Image();image.src=src;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
   const pixels=ctx.getImageData(0,0,image.width,image.height);
   let transparent=0,ink=0;
   for(let i=0;i<pixels.data.length;i+=4){
    const gray=.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2];
    const filtered=Math.max(0,Math.min(255,1.1*1.3*gray-.05*255));
    const alpha=Math.round((255-filtered)*pixels.data[i+3]/255);
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=0;pixels.data[i+3]=alpha;
    if(!alpha)transparent++;else ink++;
   }
   if(!write){
    const actual=new Image();actual.src=current;await actual.decode();
    if(actual.width!==image.width||actual.height!==image.height)throw new Error('Source geometry changed');
    ctx.clearRect(0,0,image.width,image.height);ctx.drawImage(actual,0,0);
    const rgba=ctx.getImageData(0,0,image.width,image.height).data;
    if(rgba.some((value,index)=>value!==pixels.data[index]))throw new Error('Ink differs from the original pixel conversion');
   }
   ctx.putImageData(pixels,0,0);
   return {png:canvas.toDataURL('image/png').split(',')[1],width:image.width,height:image.height,transparent,ink};
  },{src:'data:image/png;base64,'+original.toString('base64'),current:'data:image/png;base64,'+(await readFile('public/handwriting/'+file)).toString('base64'),write});
  const {png,...stats}=result;
  if(write)await writeFile('public/handwriting/'+file,Buffer.from(png,'base64'));report.push({file,...stats});
 }
 console.log(JSON.stringify({sourceRef,method:'Black alpha = 1 - prior CSS-filtered luminance; exact source pixel coordinates',report},null,2));
}finally{await browser.close();}
