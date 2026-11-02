import {createReadStream,existsSync,readFileSync,realpathSync,statSync} from 'node:fs';
import path from 'node:path';
import type {Plugin,ResolvedConfig} from 'vite';
import type {HandwritingFragment} from '../src/data/handwritingTypes';
import {chapters} from '../src/data/story';

const virtualId='virtual:storybook-handwriting';
const resolvedId='\0'+virtualId;
const chapterIds=new Set(chapters.map(chapter=>chapter.id));
const inside=(root:string,file:string)=>{
  const relative=path.relative(root,file);
  return relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative));
};

/** Private images are read from an explicitly selected directory, never from
 * the public checkout. CI has no directory and builds the existing edition.
 * A private production preview must also be emitted outside every checkout. */
export function privateHandwritingPlugin():Plugin{
  let config:ResolvedConfig;
  let fragments:HandwritingFragment[]=[];
  let sources=new Map<string,string>();
  return {
    name:'storybook-private-handwriting',
    configResolved(resolved){
      config=resolved;
      const directory=process.env.STORYBOOK_PRIVATE_INK_DIR;
      if(!directory)return;
      const privateRoot=realpathSync(directory);
      const repositories:string[]=[];
      for(let current=realpathSync(config.root);;current=path.dirname(current)){
        if(existsSync(path.join(current,'.git')))repositories.push(current);
        if(path.dirname(current)===current)break;
      }
      if(repositories.some(root=>inside(root,privateRoot)))throw new Error('Private handwriting must stay outside the public checkout.');
      const output=path.resolve(config.root,config.build.outDir);
      if(config.command==='build'&&repositories.some(root=>inside(root,output)))
        throw new Error('Private handwriting preview output must be outside the public checkout.');
      const data=JSON.parse(readFileSync(path.join(privateRoot,'layout.json'),'utf8'));
      if(!Array.isArray(data.fragments)||data.fragments.length===0)throw new Error('Missing reviewed handwriting fragments.');
      const ids=new Set<string>();
      sources=new Map();
      fragments=data.fragments.map((item:HandwritingFragment&{file:string})=>{
        if(!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(item.id)||ids.has(item.id)||
          !chapterIds.has(item.chapter)||!['left','right'].includes(item.side)||
          ![item.left,item.top,item.width,item.order].every(Number.isFinite)||item.left<0||item.top<0||item.top>85||
          item.width<=0||item.left+item.width>100||typeof item.alt!=='string'||!item.alt.trim())
          throw new Error('Invalid private handwriting layout.');
        ids.add(item.id);
        if(item.file!==item.id+'.png')throw new Error('Expected a reviewed PNG fragment filename.');
        const source=realpathSync(path.join(privateRoot,item.file));
        if(!inside(privateRoot,source)||statSync(source).size>2*1024*1024)throw new Error('Invalid private handwriting image.');
        const bytes=readFileSync(source);
        if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('Expected lossless source-pixel PNG.');
        const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
        if(!width||!height||item.top+item.width*(600/700)*height/width>99)
          throw new Error('Handwriting fragment would extend beyond its physical page.');
        sources.set(config.base+'handwriting/'+item.id+'.png',source);
        return {id:item.id,chapter:item.chapter,side:item.side,src:config.base+'handwriting/'+item.id+'.png',
          left:item.left,top:item.top,width:item.width,alt:item.alt,order:item.order};
      }).sort((a:HandwritingFragment,b:HandwritingFragment)=>a.order-b.order);
    },
    resolveId(id){if(id===virtualId)return resolvedId;},
    load(id){if(id===resolvedId)return 'export default '+JSON.stringify(fragments)+';';},
    configureServer(server){
      server.middlewares.use((request,response,next)=>{
        const source=sources.get((request.url??'').split('?')[0]);
        if(!source)return next();
        response.setHeader('Content-Type','image/png');
        response.setHeader('Cache-Control','no-store');
        createReadStream(source).pipe(response);
      });
    },
    generateBundle(){
      for(const [url,source] of sources)this.emitFile({type:'asset',fileName:url.slice(config.base.length),source:readFileSync(source)});
    },
  };
}
