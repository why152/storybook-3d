import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const base=new URL(process.argv[2]??'https://why152.github.io/storybook-3d/');
if(!base.pathname.endsWith('/'))base.pathname+='/';
const expected=JSON.parse(await readFile(new URL('../public/ink-release.json',import.meta.url),'utf8'));
const read=async(url)=>{
  for(let attempt=0;attempt<3;attempt++){
    const response=await fetch(url,{headers:{'Cache-Control':'no-cache'}});
    if(response.ok)return response;
    if(attempt===2)throw new Error(`${response.status}: ${url}`);
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
};
const manifest=await (await read(new URL('ink-release.json',base))).json();
if(JSON.stringify(manifest.fragments)!==JSON.stringify(expected.fragments))
  throw new Error('Hosted original-ink manifest differs from the approved release.');
const results=await Promise.allSettled(expected.fragments.map(async fragment=>{
  const body=Buffer.from(await (await read(new URL(fragment.file,base))).arrayBuffer());
  if(createHash('sha256').update(body).digest('hex')!==fragment.sha256)
    throw new Error('Hosted source-pixel crop mismatch: '+fragment.id);
}));
for(const result of results)if(result.status==='rejected')throw result.reason;
console.log(`PASS ${results.length} approved original-ink crops on ${base}`);
