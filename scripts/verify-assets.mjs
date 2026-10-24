#!/usr/bin/env node
// Asset contract check: every chapter has a genuine six-file illustrated
// spread on the same 1200x700 artboard. Fast, dependency-free and CI friendly.
import { readFileSync, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root=process.cwd();
const src=readFileSync(resolve(root,'src/data/story.ts'),'utf8');
const ids=[...src.matchAll(/\bid:\s*'([a-z]+)'\s*,\s*label:/g)].map(x=>x[1]);
const expectedPlanes=['background','midground','lettering','characters','foreground','effects'];
const findings=[];
const assets=[];
function check(ok,message){if(!ok)findings.push(message);}
check(ids.length===5,'Expected exactly 5 story chapters in canonical story.ts');
check(new Set(ids).size===ids.length,'Duplicate chapter IDs in story.ts');

for(const id of ids){
  const directory=resolve(root,'public/assets',id);
  const manifestFile=resolve(directory,'manifest.json');
  check(existsSync(manifestFile),`${id}: missing manifest.json`);
  if(!existsSync(manifestFile))continue;
  let manifest;
  try{manifest=JSON.parse(readFileSync(manifestFile,'utf8'));}
  catch(e){findings.push(`${id}: invalid manifest JSON: ${String(e)}`);continue;}
  check(manifest.scene===id,`${id}: manifest scene mismatch`);
  check(manifest.artboard?.width===1200&&manifest.artboard?.height===700,
    `${id}: artboard must equal 1200x700`);
  check(Array.isArray(manifest.layers)&&manifest.layers.length===6,
    `${id}: manifest must list exactly 6 illustration planes`);
  const actualIds=(manifest.layers||[]).map(x=>x.id);
  check(JSON.stringify(actualIds)===JSON.stringify(expectedPlanes),
    `${id}: plane order must remain ${expectedPlanes.join(', ')}`);
  for(const plane of expectedPlanes){
    const found=manifest.layers?.find(x=>x.id===plane);
    check(Boolean(found)&&found.file===plane+'.svg',
      `${id}: manifest file mismatch for ${plane}`);
    const filename=resolve(directory,plane+'.svg');
    check(existsSync(filename),`${id}: missing ${plane}.svg`);
    if(!existsSync(filename))continue;
    const stat=statSync(filename);
    const text=readFileSync(filename,'utf8');
    check(stat.size>100,`${id}/${plane}: SVG is unexpectedly empty`);
    check(/<svg\b/.test(text)&&/<\/svg>\s*$/.test(text),
      `${id}/${plane}: not an SVG root document`);
    const viewbox=text.match(/\bviewBox\s*=\s*["']\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*["']/i);
    check(Boolean(viewbox)&&Number(viewbox[1])===1200&&Number(viewbox[2])===700,
      `${id}/${plane}: SVG viewBox not 0 0 1200 700`);
    check(!/<\s*(?:script|foreignObject)\b/i.test(text),
      `${id}/${plane}: executable/embedded content forbidden`);
    check(!/\b(?:href|xlink:href)\s*=\s*["']https?:/i.test(text),
      `${id}/${plane}: remote dependencies forbidden`);
    assets.push({id,plane,bytes:stat.size});
  }
}

if(findings.length){
  for(const finding of findings)console.error('FAIL',finding);
  console.error(`Asset contract failed with ${findings.length} issue(s).`);
  process.exitCode=1;
}else{
  const bytes=assets.reduce((sum,x)=>sum+x.bytes,0);
  console.log(`PASS ${ids.length} spreads / ${assets.length} original aligned SVG planes / ${Math.round(bytes/1024)} KiB total`);
  console.log('Chapters:',ids.join(' → '));
}
