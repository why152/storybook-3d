// Hand-authored WebGL2 flexible paper experiment. No graphics runtime dependency.
// This research page intentionally does NOT modify src/components/Book.tsx.
const chapters=['hello','grow','together','dream','wish'];
const planes=['background','midground','lettering','characters','foreground','effects'];
const $=selector=>document.querySelector(selector);
const controls={chapter:$('#chapter'),progress:$('#progress'),curl:$('#curl'),profile:$('#profile')};
const canvas=$('#gpu'),status=$('#status'),stats=$('#gpu-stats');
const media=window.matchMedia('(prefers-reduced-motion: reduce)');
const params=new URLSearchParams(window.location.search);
const requestedChapter=params.get('from');
if(chapters.slice(0,-1).includes(requestedChapter))controls.chapter.value=requestedChapter;
const state={
  from:controls.chapter.value,
  progress:Math.max(0,Math.min(1,Number(params.get('pose'))||0)),
  curl:Number(controls.curl.value)/100,
  profile:controls.profile.value==='roll'?1:0,
  generation:0,
  loading:false,
  animationToken:0
};
controls.progress.value=String(Math.round(state.progress*100));
$('#progress-value').value=Math.round(state.progress*100)+'%';

const gl=canvas.getContext('webgl2',{
  alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true
});
const gpu={
  available:false,program:null,vao:null,indexCount:0,front:null,back:null,
  uniforms:{},drawCalls:0
};
window.__curlLab={renderer:'initializing',loadedPages:0,
  drawCallsPerFrame:0,triangleCount:0,from:state.from};

function shader(type,source){
  const object=gl.createShader(type);
  gl.shaderSource(object,source);gl.compileShader(object);
  if(!gl.getShaderParameter(object,gl.COMPILE_STATUS)){
    const log=gl.getShaderInfoLog(object)||'No compiler message';
    gl.deleteShader(object);
    throw Error('GLSL shader compilation failed: '+log);
  }
  return object;
}
function texture(){
  const value=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,value);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  return value;
}
async function initializeGPU(){
  if(!gl)throw Error('This browser does not support WebGL2');
  const files=await Promise.all([
    fetch('/labs/curled-page.vert.glsl'),fetch('/labs/curled-page.frag.glsl')
  ]);
  for(const response of files){
    if(!response.ok)throw Error('GLSL file unavailable: '+response.url);
  }
  const sources=await Promise.all(files.map(file=>file.text()));
  const vert=shader(gl.VERTEX_SHADER,sources[0]);
  const frag=shader(gl.FRAGMENT_SHADER,sources[1]);
  const program=gl.createProgram();
  gl.attachShader(program,vert);gl.attachShader(program,frag);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
    const log=gl.getProgramInfoLog(program);
    throw Error('GLSL linking failed: '+log);
  }
  gl.deleteShader(vert);gl.deleteShader(frag);
  const nx=64,ny=24;
  const positions=[],indices=[];
  for(let row=0;row<=ny;row++)for(let col=0;col<=nx;col++)
    positions.push(col/nx,row/ny);
  for(let row=0;row<ny;row++)for(let col=0;col<nx;col++){
    const a=row*(nx+1)+col,b=a+1,c=a+nx+1,d=c+1;
    // UV v increases downward, so this is counter-clockwise in clip space.
    indices.push(a,c,b,b,c,d);
  }
  const vao=gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vertex=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,vertex);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.STATIC_DRAW);
  const attr=gl.getAttribLocation(program,'aUv');
  if(attr<0)throw Error('GLSL aUv attribute optimized away');
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  const element=gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,element);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  gpu.program=program;gpu.vao=vao;gpu.indexCount=indices.length;
  for(const key of ['uFront','uBack','uProgress','uCurl','uProfile'])
    gpu.uniforms[key]=gl.getUniformLocation(program,key);
  gpu.front=texture();gpu.back=texture();
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gpu.available=true;
  window.__curlLab={
    renderer:'webgl2',loadedPages:0,drawCallsPerFrame:0,
    triangleCount:indices.length/3,vertexCount:positions.length/2,
    from:state.from
  };
}

function fallback(reason){
  gpu.available=false;
  canvas.hidden=true;
  $('#fallback-leaf').hidden=false;
  $('#gpu-error').hidden=false;
  $('#gpu-error').textContent=reason+'。正在使用 CSS 回退书页。';
  stats.textContent='CSS FALLBACK';
  status.classList.add('error-status');
  status.textContent=reason;
  window.__curlLab={renderer:'fallback',reason,loadedPages:0};
}

// Every DOM half is a slice of the same 1200x700 artboard.
// This keeps the experimental source equal to the original book's assets.
function paintDom(){
  const current=state.from,next=chapters[chapters.indexOf(current)+1];
  document.querySelectorAll('[data-part]').forEach(art=>{
    const part=art.getAttribute('data-part');
    const scene=part.startsWith('from')?current:next;
    const side=part.endsWith('right')?'right':'left';
    art.className='print'+(side==='right'?' right':'');
    art.replaceChildren();
    for(const layer of planes){
      const img=new Image();
      img.alt='';img.draggable=false;
      img.src='/assets/'+scene+'/'+layer+'.svg';
      art.append(img);
    }
  });
}
function loadImage(url){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(Error('Could not load '+url));
    img.src=url;
  });
}
// A texture is 600x700 and shows exactly one paper SIDE. Front is the
// current RIGHT half; reverse is next chapter's LEFT half.
async function pageTexture(scene,side){
  const images=await Promise.all(planes.map(plane=>
    loadImage('/assets/'+scene+'/'+plane+'.svg')));
  const surface=document.createElement('canvas');
  surface.width=600;surface.height=700;
  const context=surface.getContext('2d');
  if(!context)throw Error('Canvas 2D layer composition unavailable');
  for(const img of images)
    context.drawImage(img,side==='right'?-600:0,0,1200,700);
  return surface;
}
async function loadPair(){
  const id=++state.generation;
  const scene=state.from,next=chapters[chapters.indexOf(scene)+1];
  state.loading=true;
  paintDom();
  status.textContent='正在载入 '+scene.toUpperCase()+' → '+next.toUpperCase()+' 的绘本图层…';
  if(!gpu.available){
    state.loading=false;
    draw();
    return;
  }
  try{
    const [front,back]=await Promise.all([
      pageTexture(scene,'right'),pageTexture(next,'left')
    ]);
    if(id!==state.generation)return;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,gpu.front);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,600,700,0,gl.RGBA,gl.UNSIGNED_BYTE,front);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D,gpu.back);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,600,700,0,gl.RGBA,gl.UNSIGNED_BYTE,back);
    state.loading=false;
    window.__curlLab.loadedPages=2;
    window.__curlLab.from=scene;
    window.__curlLab.to=next;
    status.textContent='两面原创书页已载入：64×24 网格 / '+
      gpu.indexCount/3+' 个三角形。拖动进度条或直接拖书页进行比较。';
    status.classList.remove('error-status');
    draw();
  }catch(error){
    if(id!==state.generation)return;
    state.loading=false;
    fallback('Shader 书页图像装载失败：'+String(error));
  }
}
function resizeGPU(){
  if(!gpu.available)return;
  const box=canvas.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(1,Math.round(box.width*dpr));
  const h=Math.max(1,Math.round(box.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  gl.viewport(0,0,w,h);
}
function draw(){
  const degrees=state.progress*180;
  for(const node of [$('#css-leaf'),$('#fallback-leaf')]){
    node.style.transform='rotateY(-'+degrees.toFixed(2)+'deg)';
    node.style.setProperty('--shade',
      (Math.sin(Math.PI*state.progress)*.74).toFixed(3));
  }
  controls.progress.value=String(Math.round(state.progress*100));
  $('#progress-value').value=Math.round(state.progress*100)+'%';
  if(!gpu.available||state.loading||window.__curlLab.loadedPages!==2)return;
  resizeGPU();
  gl.clearColor(0,0,0,0);gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(gpu.program);
  gl.bindVertexArray(gpu.vao);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,gpu.front);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D,gpu.back);
  gl.uniform1i(gpu.uniforms.uFront,0);
  gl.uniform1i(gpu.uniforms.uBack,1);
  gl.uniform1f(gpu.uniforms.uProgress,state.progress);
  gl.uniform1f(gpu.uniforms.uCurl,state.curl);
  gl.uniform1f(gpu.uniforms.uProfile,state.profile);
  gl.drawElements(gl.TRIANGLES,gpu.indexCount,gl.UNSIGNED_SHORT,0);
  window.__curlLab.drawCallsPerFrame=1;
  window.__curlLab.progress=state.progress;
  window.__curlLab.curl=state.curl;
  window.__curlLab.profile=state.profile===1?'roll':'arch';
  stats.textContent=(state.profile===1?'卷曲':'弧形')+' · 1 draw · '+gpu.indexCount/3+' triangles · '+
    Math.round(degrees)+'°';
  const error=gl.getError();
  if(error!==gl.NO_ERROR){
    status.classList.add('error-status');
    status.textContent='WebGL error: '+error;
    window.__curlLab.lastError=error;
  }
}
let raf=0;
function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;draw();});
}
function setProgress(value){
  state.progress=Math.max(0,Math.min(1,value));
  schedule();
}
function animate(target){
  const token=++state.animationToken;
  const begin=performance.now();
  const from=state.progress;
  const duration=media.matches?0:1450;
  if(!duration){setProgress(target);return;}
  const step=now=>{
    if(token!==state.animationToken)return;
    const t=Math.min(1,(now-begin)/duration);
    const eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
    state.progress=from+(target-from)*eased;
    draw();
    if(t<1)requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
controls.progress.addEventListener('input',()=>{
  state.animationToken++;
  setProgress(Number(controls.progress.value)/100);
});
controls.curl.addEventListener('input',()=>{
  state.curl=Number(controls.curl.value)/100;
  $('#curl-value').value=controls.curl.value;
  schedule();
});
controls.profile.addEventListener('change',()=>{
  state.profile=controls.profile.value==='roll'?1:0;
  schedule();
});
controls.chapter.addEventListener('change',()=>{
  state.animationToken++;
  state.from=controls.chapter.value;
  state.progress=0;
  loadPair();
});
$('#forward').addEventListener('click',()=>animate(1));
$('#reverse').addEventListener('click',()=>animate(0));
$('#reset').addEventListener('click',()=>{state.animationToken++;setProgress(0);});
for(const stage of document.querySelectorAll('.book')){
  let lastX=null;
  stage.addEventListener('pointerdown',event=>{
    lastX=event.clientX;state.animationToken++;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove',event=>{
    if(lastX===null)return;
    const delta=(lastX-event.clientX)/stage.getBoundingClientRect().width;
    setProgress(state.progress+delta*1.65);
    lastX=event.clientX;
  });
  stage.addEventListener('pointerup',()=>{lastX=null;});
  stage.addEventListener('pointercancel',()=>{lastX=null;});
}
window.addEventListener('resize',schedule,{passive:true});
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();
  state.animationToken++;
  fallback('GPU context was lost');
});
try{
  await initializeGPU();
  $('#gpu-error').hidden=true;
}catch(error){
  fallback(String(error));
}
await loadPair();
schedule();
