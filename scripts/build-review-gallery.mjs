#!/usr/bin/env node
/**
 * Turn raw Playwright screenshots, browser videos and quantitative diagnostics
 * into ONE portable offline HTML review artifact. No dependencies, no API
 * calls, no model quota. CI uploads it with the rest of test-results/.
 *
 *   node scripts/build-review-gallery.mjs [test-results]
 */
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const root=resolve(process.argv[2]||'test-results');
if(!existsSync(root))mkdirSync(root,{recursive:true});
const allowedImages=/\.(png|jpe?g|webp)$/i;
const allowedVideos=/\.(webm|mp4)$/i;
const items=[];

function walk(folder,depth=0){
  if(depth>7)return;
  for(const entry of readdirSync(folder,{withFileTypes:true})){
    if(entry.name.startsWith('.')||entry.name==='node_modules')continue;
    const file=resolve(folder,entry.name);
    if(entry.isDirectory())walk(file,depth+1);
    else if(entry.isFile()&&(allowedImages.test(entry.name)||allowedVideos.test(entry.name))){
      const path=relative(root,file).split(sep).join('/');
      items.push({path,bytes:statSync(file).size,kind:allowedVideos.test(entry.name)?'video':'image'});
    }
  }
}
walk(root);
items.sort((a,b)=>a.path.localeCompare(b.path,'en'));
const escapeText=value=>String(value).replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const urlPath=value=>value.split('/').map(encodeURIComponent).join('/');
const filesByKind=kind=>items.filter(item=>item.kind===kind);
const tile=item=>{
  const url=urlPath(item.path);
  const name=escapeText(item.path);
  const media=item.kind==='image'
    ?`<img src="${url}" alt="${name}" loading="lazy"/>`
    :`<video src="${url}" controls preload="metadata" playsinline aria-label="${name}"></video>`;
  return `<article class="tile" data-path="${escapeText(item.path.toLowerCase())}"><a class="open" href="${url}" target="_blank" rel="noopener">Open original</a>${media}<div class="foot"><strong>${name}</strong><span>${(item.bytes/1048576).toFixed(2)} MiB</span></div></article>`;
};
let metrics='';
const metricsPath=resolve(root,'qa-readiness.json');
if(existsSync(metricsPath)){
  try{
    const data=JSON.parse(readFileSync(metricsPath,'utf8'));
    metrics=`<section class="metrics"><h2>Deterministic readiness check</h2><p>${escapeText(data.captures?.length||0)} captures across desktop / mobile and five scenes; based on decoded image dimensions and browser DOM measurements.</p><a href="qa-readiness.md">Readable baseline table</a> · <a href="qa-readiness.json">Machine-readable report</a><p class="note">rAF sampling in headless Chromium is not a real mobile GPU performance claim.</p></section>`;
  }catch(error){metrics=`<p class="warning">Cannot parse qa-readiness.json: ${escapeText(error.message)}</p>`;}
}
const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Storybook 3D — Local visual evidence</title>
<style>
:root{color-scheme:dark;font:14px/1.6 system-ui,sans-serif;background:#101115;color:#f0e8dc}
*{box-sizing:border-box}
body{margin:0 auto;padding:30px clamp(16px,4vw,60px);max-width:1700px}
h1{font:700 clamp(28px,5vw,56px)/1.05 Georgia,serif;letter-spacing:-1.5px;margin:12px 0}
h2{font-size:20px;margin:30px 0 14px}
p{color:#bdb6b2}
label{font-weight:700;margin-right:9px}
input{border:1px solid #777;border-radius:7px;background:#1b1d23;color:white;padding:12px;font:inherit;width:min(620px,100%)}
a{color:#e8b996}
.stats{margin:15px 0 25px;color:#c4b3a3;letter-spacing:1px}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:16px}
.tile{border:1px solid #454249;background:#1a1b21;border-radius:12px;padding:10px;position:relative;min-width:0}
.tile[hidden]{display:none}
.tile img,.tile video{width:100%;height:clamp(180px,27vw,330px);object-fit:contain;background:#09090b;border-radius:7px}
.open{display:block;position:absolute;top:15px;right:15px;background:#242027d8;border:1px solid #ffffff65;padding:5px 9px;font-size:11px;border-radius:5px}
.foot{display:flex;justify-content:space-between;align-items:start;gap:10px;padding:10px 4px 3px;font-size:12px;word-break:break-word}
.foot span{flex:none;color:#9e9292}
.metrics{background:#29222a;border-radius:10px;padding:12px 20px;border:1px solid #555057}
.metrics h2{margin:6px 0}
.note{font-size:11px}
.warning{color:#ffb8a8}
.empty{color:#888}
footer{margin-top:35px;border-top:1px solid #6665;padding-top:12px;color:#aaa;font-size:11px}
</style></head>
<body>
<header><div class="stats">STORYBOOK 3D / AI-FIRST REAL-BROWSER REVIEW</div><h1>Visual evidence gallery</h1>
<p>Portable captures from real Chromium. Video and screenshot files are local; no online account, cloud font, or external scripts required.
Screenshots prove pixel output, not subjective artistic approval.</p>
<label for="filter">Filter filename</label><input id="filter" type="search" placeholder="e.g. mobile, hello, 50%, motion, actor" autocomplete="off"/>
<div class="stats">${filesByKind('image').length} stills · ${filesByKind('video').length} real videos · <span id="visible">${items.length}</span> shown</div></header>
${metrics}
<section><h2>Video evidence</h2><div class="gallery">${filesByKind('video').map(tile).join('')||'<p class="empty">No recorded browser videos yet.</p>'}</div></section>
<section><h2>Visual stills</h2><div class="gallery">${filesByKind('image').map(tile).join('')||'<p class="empty">No screenshots yet.</p>'}</div></section>
<footer>Generated from local artifacts only. For latest open tasks, refer to repo AGENTS.md and Notion project hub. Do not claim high-end-model blockers without two tested failure approaches.</footer>
<script>
const filter=document.querySelector('#filter');
const tiles=[...document.querySelectorAll('.tile')];
filter.addEventListener('input',()=>{
  const q=filter.value.trim().toLowerCase();
  let shown=0;
  for(const t of tiles){t.hidden=!t.dataset.path.includes(q);if(!t.hidden)shown++;}
  document.querySelector('#visible').textContent=String(shown);
});
</script></body></html>`;
writeFileSync(resolve(root,'review.html'),html,'utf8');
console.log(`Review gallery: ${resolve(root,'review.html')} (${items.length} media files, ${filesByKind('video').length} videos)`);
