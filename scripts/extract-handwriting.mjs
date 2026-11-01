#!/usr/bin/env node
// Generate review-only authentic handwriting crops OUTSIDE the public checkout.
import {createHash} from 'node:crypto';
import {createReadStream,existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
function argument(name){
  const index=args.indexOf(name);
  if(index<0||!args[index+1]||args[index+1].startsWith('--'))
    throw new Error('Required argument: '+name);
  return path.resolve(args[index+1]);
}
function requirePrivate(file,label){
  const rel=path.relative(root,file);
  if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))
    throw new Error(label+' must be outside the public repository: '+file);
}
function validSegment(s){
  const crop=s?.crop;
  return typeof s?.id==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/.test(s.id)
    &&['hello','grow','together','dream','wish'].includes(s.chapter)
    &&['left','right'].includes(s.side)
    &&Number.isFinite(s.timestampSeconds)&&s.timestampSeconds>=0
    &&crop&&['x','y','width','height'].every(k=>
      Number.isInteger(crop[k])&&crop[k]>=0&&
      (k==='width'||k==='height'?crop[k]>0:true));
}
function sha256(file){
  return new Promise((resolve,reject)=>{
    const digest=createHash('sha256');
    const stream=createReadStream(file);
    stream.on('data',chunk=>digest.update(chunk));
    stream.on('end',()=>resolve(digest.digest('hex')));
    stream.on('error',reject);
  });
}
async function main(){
  const source=argument('--source'),mapPath=argument('--manifest'),output=argument('--output');
  requirePrivate(source,'Video');
  requirePrivate(mapPath,'Private source map');
  requirePrivate(output,'Output directory');
  if(path.basename(source)!=='4569.mp4')throw new Error('Expected the non-birthday 4569.mp4, NOT 4568.mp4.');
  if(!existsSync(source)||!existsSync(mapPath))throw new Error('Missing authorized private video or crop map.');
  const map=JSON.parse(readFileSync(mapPath,'utf8'));
  if(!Array.isArray(map.segments)||map.segments.length===0)throw new Error('No reviewed fragments provided.');
  const ids=new Set();
  for(const s of map.segments){
    if(!validSegment(s)||ids.has(s.id))throw new Error('Invalid or duplicate segment '+String(s?.id));
    ids.add(s.id);
  }
  const digest=await sha256(source);
  if(map.sourceSha256&&map.sourceSha256.toLowerCase()!==digest)
    throw new Error('Video checksum does not match the reviewed source.');
  const available=spawnSync('ffmpeg',['-version'],{encoding:'utf8'});
  if(available.error||available.status!==0)throw new Error('ffmpeg required locally for genuine frame extraction.');
  if(existsSync(path.join(output,'private-source-map.json')))
    throw new Error('Refusing to overwrite existing provenance map.');
  mkdirSync(output,{recursive:true});
  const prepared=[];
  for(const s of map.segments){
    const out=path.join(output,s.id+'.png');
    if(existsSync(out))throw new Error('Refusing to overwrite existing crop: '+s.id);
    const c=s.crop;
    const filter='crop='+c.width+':'+c.height+':'+c.x+':'+c.y;
    const result=spawnSync('ffmpeg',[
      '-hide_banner','-loglevel','error','-nostdin','-n',
      '-ss',String(s.timestampSeconds),'-i',source,
      '-frames:v','1','-vf',filter,'-an','-sn',out
    ],{encoding:'utf8'});
    if(result.error||result.status!==0)
      throw new Error('Failed to crop '+s.id+': '+String(result.stderr||result.error));
    prepared.push({id:s.id,chapter:s.chapter,side:s.side,
      timestampSeconds:s.timestampSeconds,crop:s.crop,file:s.id+'.png'});
    process.stdout.write('Private preview crop: '+s.id+'.png\n');
  }
  writeFileSync(path.join(output,'private-source-map.json'),JSON.stringify({
    source:'4569.mp4',sourceSha256:digest,
    note:'Raw source-pixel crops, not approved background-cleaned handwriting or publishable site assets.',
    segments:prepared
  },null,2)+'\n',{flag:'wx'});
  process.stdout.write('Created private SHA-256 source map. Nothing uploaded.\n');
}
main().catch(e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
