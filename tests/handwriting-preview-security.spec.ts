import {expect,test} from '@playwright/test';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {resolveConfig} from 'vite';
import {privateHandwritingPlugin} from '../scripts/private-handwriting-plugin';
import {chapters} from '../src/data/story';

async function resolvePrivate(directory:string,output:string){
  const previous=process.env.STORYBOOK_PRIVATE_INK_DIR;
  process.env.STORYBOOK_PRIVATE_INK_DIR=directory;
  try{
    return await resolveConfig({configFile:false,root:process.cwd(),logLevel:'silent',
      plugins:[privateHandwritingPlugin()],build:{outDir:output}},'build');
  }finally{
    if(previous===undefined)delete process.env.STORYBOOK_PRIVATE_INK_DIR;
    else process.env.STORYBOOK_PRIVATE_INK_DIR=previous;
  }
}

test('private handwriting cannot be sourced from the public checkout',async()=>{
  await expect(resolvePrivate(process.cwd(),path.join(tmpdir(),'unused-ink-output')))
    .rejects.toThrow('Private handwriting must stay outside the public checkout');
});

test('private handwriting cannot be bundled into the public checkout',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'storybook-ink-security-'));
  try{
    await expect(resolvePrivate(directory,path.resolve('dist')))
      .rejects.toThrow('Private handwriting preview output must be outside the public checkout');
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('private preview accepts reviewed PNGs outside Git and rejects unsafe layout names',async()=>{
  const directory=await mkdtemp(path.join(tmpdir(),'storybook-ink-layout-'));
  const fragment={id:'fixture',chapter:chapters[0].id,side:'left',file:'fixture.png',
    left:5,top:5,width:10,order:0,alt:'Synthetic test pixel'};
  try{
    await writeFile(path.join(directory,'fixture.png'),Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jg1kAAAAASUVORK5CYII=','base64'));
    await writeFile(path.join(directory,'layout.json'),JSON.stringify({fragments:[fragment]}));
    await expect(resolvePrivate(directory,path.join(directory,'preview'))).resolves.toBeDefined();
    await writeFile(path.join(directory,'layout.json'),JSON.stringify({fragments:[{...fragment,file:'../fixture.png'}]}));
    await expect(resolvePrivate(directory,path.join(directory,'preview'))).rejects.toThrow('reviewed PNG fragment filename');
    await writeFile(path.join(directory,'layout.json'),JSON.stringify({fragments:[{...fragment,left:99,width:50}]}));
    await expect(resolvePrivate(directory,path.join(directory,'preview'))).rejects.toThrow('Invalid private handwriting layout');
  }finally{await rm(directory,{recursive:true,force:true});}
});
