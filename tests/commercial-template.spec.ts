import {expect,test} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import type {AddressInfo} from 'node:net';
import {preview,type PreviewServer} from 'vite';

const samples=[
  {fixture:'afterglow',title:'晚风来信',firstLine:'今天的风带着一点橘子香。',otherTitle:'给追星的你',music:true},
  {fixture:'stargazer',title:'给追星的你',firstLine:'借你一张今晚的夜空地图。',otherTitle:'晚风来信',music:false},
] as const;
const runId='qa-'+randomUUID().slice(0,18);
const idFor=(fixture:string)=>runId+'-'+fixture;
const root=resolve('build/books');
let inputRoot:string;
const dist=(fixture:string,version='v1')=>join(root,idFor(fixture),'releases',version);
const templateURL=(fixture:string,version='v1')=>base+'/'+idFor(fixture)+'/releases/'+version+'/';

let server:PreviewServer|undefined;
let base:string;

const build=(path:string)=>spawnSync(process.execPath,['scripts/build-book.mjs',path],{
  encoding:'utf8',env:{...process.env,STORYBOOK_PRIVATE_INK_DIR:join(inputRoot,'must-not-be-read')},
});

test.beforeAll(async()=>{
  inputRoot=mkdtempSync(join(tmpdir(),'storybook-template-'));
  for(const sample of samples){
    const folder=join(inputRoot,sample.fixture);
    cpSync('examples/books/'+sample.fixture,folder,{recursive:true});
    const input=join(folder,'book.json');
    const config=JSON.parse(readFileSync(input,'utf8'));
    config.id=idFor(sample.fixture);
    writeFileSync(input,JSON.stringify(config));
    const result=build(input);
    expect(result.status,result.stderr).toBe(0);
  }
  server=await preview({configFile:false,build:{outDir:root},preview:{host:'127.0.0.1',port:0},appType:'mpa'});
  base='http://127.0.0.1:'+(server.httpServer.address() as AddressInfo).port;
});

test.afterAll(async()=>{
  await server?.close();
  if(inputRoot)rmSync(inputRoot,{recursive:true,force:true});
  for(const sample of samples)rmSync(join(root,idFor(sample.fixture)),{recursive:true,force:true});
});

test('the two published directories isolate copy and assets, and reject overwriting a release',async({page})=>{
  for(const sample of samples){
    const dir=dist(sample.fixture);
    const files=readdirSync(dir,{recursive:true,encoding:'utf8'});
    const script=files.find(name=>/^assets\/index-.*\.js$/.test(name))!;
    const code=readFileSync(join(dir,script),'utf8');
    expect(code).toContain(sample.firstLine);
    for(const personal of [sample.otherTitle,'Tokirinn','当你读到这封信的时候','handwriting/','展信舒颜']){
      expect(code).not.toContain(personal);
    }
    expect(files.some(name=>name.startsWith('handwriting')||name.endsWith('book.json'))).toBe(false);
    expect(files.includes('audio/the-long-way-home.mp3')).toBe(sample.music);
    expect(files.includes('audio/CREDITS.txt')).toBe(sample.music);

    const url=templateURL(sample.fixture);
    await page.goto(url+'?story=birthday#gift=legacy');
    await expect(page).toHaveTitle(sample.title+' · 立体绘本');
    await expect(page.locator('.book-closed-cover .cover-main-title')).toHaveText(sample.title);
    await expect(page.getByRole('button',{name:'定制祝福'})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'背景音乐'})).toHaveCount(sample.music?1:0);
  }

  const folder=join(inputRoot,'afterglow');
  const input=join(folder,'book.json');
  const firstIndex=readFileSync(join(dist('afterglow'),'index.html'),'utf8');
  expect(build(input).stderr).toContain('已经出包');
  expect(readFileSync(join(dist('afterglow'),'index.html'),'utf8')).toBe(firstIndex);

  const config=JSON.parse(readFileSync(input,'utf8'));
  writeFileSync(input,JSON.stringify({...config,version:'rejected',cover:'../stargazer/cover.webp'}));
  expect(build(input).stderr).toContain('超出配置目录');
  expect(existsSync(dist('afterglow','rejected'))).toBe(false);

  cpSync('public/audio/the-long-way-home.mp3',join(folder,'revision.mp3'));
  config.music={file:'revision.mp3',title:'The Long Way Home',author:'Scott Buckley',
    source:'https://www.scottbuckley.com.au/library/the-long-way-home/',license:'CC BY 4.0',
    licenseUrl:'https://creativecommons.org/licenses/by/4.0/',changes:'音量下调、重新编码'};
  writeFileSync(input,JSON.stringify({...config,version:'v2',title:'晚风再来'}));
  const result=build(input);
  expect(result.status,result.stderr).toBe(0);
  await page.goto(templateURL('afterglow','v2'));
  await expect(page).toHaveTitle('晚风再来 · 立体绘本');
  await expect(page.locator('audio')).toHaveAttribute('src','./template/music.mp3');
  await expect(page.getByRole('link',{name:'The Long Way Home · Scott Buckley'})).toBeVisible();
  await page.goto(templateURL('afterglow'));
  await expect(page).toHaveTitle('晚风来信 · 立体绘本');
});

for(const phone of [false,true]){
  test(`${phone?'Phone':'Desktop'} template: opening, five spreads and return, with opaque custom photo print`,async({browser})=>{
    const viewport=phone?{width:390,height:844}:{width:1440,height:900};
    const context=await browser.newContext({viewport,deviceScaleFactor:phone?3:1,hasTouch:phone,reducedMotion:'reduce'});
    try{
      const page=await context.newPage();
      const errors:string[]=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{if(response.status()>=400)errors.push(response.url());});
      for(const sample of samples){
        const url=templateURL(sample.fixture);
        await page.goto(url);
        const next=page.getByRole('button',{name:'下一页'});
        const prev=page.getByRole('button',{name:'上一页'});
        for(const chapter of ['hello','grow','together','dream','wish']){
          await next.click();
          const settled=page.locator(`.book-static .page-surface[data-chapter="${chapter}"]`);
          await expect(settled.locator('.template-letter')).toHaveCount(2);
          await settled.locator('img').evaluateAll(images=>Promise.all(images.map(img=>(img as HTMLImageElement).decode())));
          if(chapter==='hello'){
            await expect(settled.getByText(sample.firstLine)).toBeVisible();
            await expect(settled.locator('.template-photo')).toBeVisible();
            if(phone){
              await page.getByRole('button',{name:'放大右页'}).click();
              await expect(page.locator('.book-reading-stage')).toHaveAttribute('data-reading-side','right');
              await page.getByRole('button',{name:'双页全貌'}).click();
            }
          }
        }
        await expect(next).toBeDisabled();
        for(let position=4;position>=0;position--){
          await prev.click();
          await expect(page.locator('.page-count')).toHaveText(`0${position} / 05`);
        }
        await expect(page.locator('.book-closed-cover')).toBeVisible();

        await page.goto(url+'?from=hello&pose=.5');
        const leaf=page.locator('.book-turn-leaf');
        await expect(leaf).toHaveAttribute('data-texture-ready','true');
        await expect(leaf).toHaveAttribute('data-paper-kind','letter');
        const front=await page.locator('.paper-source[data-print="front"] .page-surface').evaluate(async surface=>{
          const photo=surface.querySelector('img.template-photo') as HTMLImageElement;
          const face=document.querySelector('.paper-front.is-letter-print')!;
          const texture=new Image();
          texture.src=(face as HTMLElement).style.backgroundImage.slice(5,-2);
          await texture.decode();
          const canvas=document.createElement('canvas');
          canvas.width=texture.width;canvas.height=texture.height;
          const ctx=canvas.getContext('2d')!;
          ctx.drawImage(texture,0,0);
          const print=surface.getBoundingClientRect(),rect=photo.getBoundingClientRect();
          const x=Math.round((rect.left-print.left+rect.width/2)*texture.width/print.width);
          const y=Math.round((rect.top-print.top+rect.height/2)*texture.height/print.height);
          const printed=Array.from(ctx.getImageData(x,y,1,1).data);
          ctx.clearRect(0,0,1,1);
          ctx.drawImage(photo,-Math.floor(photo.naturalWidth/2),-Math.floor(photo.naturalHeight/2));
          return {printed,original:Array.from(ctx.getImageData(0,0,1,1).data)};
        });
        expect(front.printed[3]).toBe(255);
        await page.screenshot({path:test.info().outputPath(sample.fixture+'-half-turn.png')});
        expect(Math.max(...front.printed.map((channel,i)=>Math.abs(channel-front.original[i])))).toBeLessThan(12);
      }
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.goto(templateURL('afterglow')+'?scene=hello');
      const book=page.locator('.book-viewport');
      const rect=(await book.boundingBox())!;
      const x=rect.x+rect.width*.88,y=rect.y+rect.height*.3;
      await page.mouse.move(x,y);
      await page.mouse.down();
      const held=page.locator('.book-turn-leaf');
      await expect(held).toHaveAttribute('data-texture-ready','true');
      await page.mouse.move(x-rect.width*.37,y,{steps:3});
      await expect.poll(async()=>Number(await held.getAttribute('data-progress'))).toBeCloseTo(.74,1);
      await page.mouse.move(x-rect.width*.08,y,{steps:3});
      await page.mouse.up();
      await expect(held).toHaveCount(0);
      await expect(page.locator('.book-static [data-chapter="hello"]')).toHaveCount(2);
      expect(errors).toEqual([]);
    }finally{await context.close();}
  });
}
