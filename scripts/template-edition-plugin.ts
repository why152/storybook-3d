import {readFileSync, realpathSync, statSync} from 'node:fs';
import {dirname, extname, isAbsolute, relative, resolve, sep} from 'node:path';
import type {Plugin} from 'vite';
import {actingScenes, coverArt, planes} from '../src/data/bookArt';
import type {LetterLeaf, LetterSpread} from '../src/data/letterStory';
import {chapters} from '../src/data/story';
import {defaultMusic, type MusicTrack, type TemplateEdition} from '../src/data/template';

const editionId='virtual:storybook-template';
const inkId='virtual:storybook-handwriting';
const lettersId='virtual:storybook-template-letters';
const publishedInkId='virtual:storybook-template-empty-ink';
const pictureExtensions=['.png','.jpg','.jpeg','.webp'];

function record(value:unknown,field:string,fields:readonly string[]):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error(field+' 必须是对象');
  for(const key of Object.keys(value)){
    if(!fields.includes(key))throw new Error(field+' 含有未知字段 '+key);
  }
  return value as Record<string,unknown>;
}

function singleLine(value:unknown,field:string,max:number){
  if(typeof value!=='string'||!value.trim()||Array.from(value).length>max||/[\r\n\t]/.test(value)){
    throw new Error(field+' 必须是一行文字，长度为 1–'+max+' 个字符');
  }
  return value.trim();
}

function httpsUrl(value:unknown,field:string){
  const url=new URL(singleLine(value,field,400));
  if(url.protocol!=='https:'||url.username||url.password)throw new Error(field+' 必须是 HTTPS 链接');
  return url.href;
}

function readEdition(path:string,publicRoot:string){
  const root=dirname(realpathSync(path));
  const assets=new Map<string,Buffer>();
  const include=(file:string)=>assets.set(file,readFileSync(resolve(publicRoot,file)));
  const asset=(value:unknown,field:string,name:string,extensions:readonly string[],limit:number)=>{
    const input=singleLine(value,field,180);
    if(isAbsolute(input))throw new Error(field+' 必须使用配置目录内的相对路径');
    const source=realpathSync(resolve(root,input));
    const local=relative(root,source);
    if(!local||local==='..'||local.startsWith('..'+sep)||isAbsolute(local))throw new Error(field+' 超出配置目录');
    const extension=extname(source).toLowerCase();
    const file=statSync(source);
    if(!extensions.includes(extension)||!file.isFile()||file.size<1||file.size>limit){
      throw new Error(field+' 的文件类型或大小不符合要求');
    }
    const output='template/'+name+extension;
    const bytes=readFileSync(source);
    const format=extension==='.png'?bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a'
      :extension==='.webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'
      :extension==='.mp3'?bytes.toString('ascii',0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)
      :bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(!format)throw new Error(field+' 的实际格式与扩展名不符');
    assets.set(output,bytes);
    return output;
  };
  const picture=(value:unknown,field:string,name:string)=>asset(value,field,name,pictureExtensions,2_000_000);

  const raw=record(JSON.parse(readFileSync(path,'utf8')),'绘本',['id','version','title','subtitle','author','cover','music','spreads']);
  const spreads=record(raw.spreads,'spreads',chapters.map(chapter=>chapter.id));
  const letters:LetterSpread[]=chapters.map(({id})=>{
    const spread=record(spreads[id],id,['word','left','right']);
    const leaf=(side:'left'|'right'):LetterLeaf=>{
      const field=id+'.'+side;
      const input=record(spread[side],field,['kicker','lines','signature','photo']);
      if(!Array.isArray(input.lines)||input.lines.length<1||input.lines.length>3){
        throw new Error(field+'.lines 必须有 1–3 行正文');
      }
      const photo=input.photo===undefined?undefined:record(input.photo,field+'.photo',['file','alt']);
      return {
        kicker:singleLine(input.kicker,field+'.kicker',10),
        lines:input.lines.map((line,index)=>singleLine(line,field+'.lines['+index+']',14)),
        signature:input.signature===undefined?undefined:singleLine(input.signature,field+'.signature',12),
        photo:photo?{
          src:picture(photo.file,field+'.photo.file',id+'-'+side),
          alt:singleLine(photo.alt,field+'.photo.alt',80),
        }:undefined,
      };
    };
    for(const plane of planes)include('assets/'+id+'/'+plane+'.svg');
    for(const actor of actingScenes[id])include('assets/'+id+'/actors/'+actor+'.svg');
    return {id,word:singleLine(spread.word,id+'.word',8),left:leaf('left'),right:leaf('right')};
  });

  let music:MusicTrack|null=null;
  if(raw.music==='default'){
    music=defaultMusic;
    include(defaultMusic.src);
    include('audio/CREDITS.txt');
  }else if(raw.music!=='off'){
    const input=record(raw.music,'music',['file','title','author','source','license','licenseUrl','changes']);
    music={
      src:asset(input.file,'music.file','music',['.mp3'],8_000_000),
      title:singleLine(input.title,'music.title',80),
      author:singleLine(input.author,'music.author',80),
      source:httpsUrl(input.source,'music.source'),
      license:singleLine(input.license,'music.license',40),
      licenseUrl:httpsUrl(input.licenseUrl,'music.licenseUrl'),
      changes:input.changes===undefined?undefined:singleLine(input.changes,'music.changes',80),
    };
  }
  const edition:TemplateEdition={
    title:singleLine(raw.title,'title',8),
    subtitle:singleLine(raw.subtitle,'subtitle',20),
    author:singleLine(raw.author,'author',12),
    cover:raw.cover===undefined?undefined:picture(raw.cover,'cover','cover'),
    music,
  };
  if(!edition.cover)include(coverArt);
  return {edition,letters,assets};
}

export function templateEditionPlugin(commercial:boolean):Plugin{
  let book:ReturnType<typeof readEdition>|undefined;
  return {
    name:'storybook-template-edition',
    enforce:'pre',
    configResolved(config){
      if(!commercial)return;
      const path=process.env.STORYBOOK_TEMPLATE_CONFIG;
      if(config.command!=='build'||!path)throw new Error('请通过 npm run book:build -- <book.json> 生成交付版');
      book=readEdition(path,resolve(config.root,'public'));
    },
    resolveId(source,importer){
      if(source===editionId)return '\0'+source;
      if(!book)return;
      if(source===inkId)return '\0'+source;
      if(source==='./demoLetter'&&importer?.endsWith('/src/data/letterStory.ts'))return '\0'+lettersId;
      if(source==='./publishedHandwriting'&&importer?.endsWith('/src/data/handwriting.ts'))return '\0'+publishedInkId;
    },
    load(id){
      if(id==='\0'+editionId)return 'export default '+JSON.stringify(book?.edition??null);
      if(book&&id==='\0'+inkId)return 'export default []';
      if(id==='\0'+publishedInkId)return 'export const publishedHandwriting=[]';
      if(id==='\0'+lettersId)return 'export const LETTER_SOURCE={}; export const demoRunningHead={}; export const letterSpreads='+JSON.stringify(book!.letters);
    },
    transformIndexHtml(html){
      if(!book)return html;
      const title=book.edition.title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
      return html.replace(/<title>[^<]+<\/title>/,()=>`<title>${title} · 立体绘本</title>`);
    },
    generateBundle(){
      for(const [fileName,source] of book?.assets??[])this.emitFile({type:'asset',fileName,source});
    },
  };
}
