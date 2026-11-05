/** Piecewise-developable paper anchored at the spine. Each straight strip
 * retains its arc length; the circular target curve is sampled at strip
 * midpoints. All layout geometry is independent of animation progress.
 */
export const PAPER_SEGMENTS = 13;
export const MAX_BEND_RADIANS = 1.15;

/** Conservative screen-space sagitta budget for a circular approximation.
 * W: actual flat leaf width in CSS pixels; N: number of equal-length strips.
 * This is a bound for LOCAL curvature error, not a rasterization guarantee.
 */
export function curvatureErrorPx(width: number, segments: number,dpr?:number) {
  if(!Number.isFinite(width)||width<=0||segments<1)return Infinity;
  if(dpr!==undefined&&(!Number.isFinite(dpr)||dpr<=0))return Infinity;
  const k=MAX_BEND_RADIANS;
  const cuts=dpr===undefined?undefined:paperCuts(width,segments,dpr);
  const longest=cuts?Math.max(...cuts.slice(1).map((end,i)=>end-cuts[i])):1/segments;
  return width*(1-Math.cos(k*longest/2))/k;
}
export function segmentCountForTolerance(width: number, tolerancePx: number,
  minSegments=4,maxSegments=24,dpr?:number) {
  if(!Number.isFinite(tolerancePx)||tolerancePx<=0)throw new RangeError('Invalid pixel budget');
  for(let n=minSegments;n<=maxSegments;n++){
    if(curvatureErrorPx(width,n,dpr)<=tolerancePx)return n;
  }
  return maxSegments;
}

export function paperCuts(width:number,count=PAPER_SEGMENTS,dpr=1){
  return Array.from({length:count+1},(_,i)=>i===count?1:Math.round(width*dpr*i/count)/(width*dpr));
}

export function paperGeometry(progress: number, count = PAPER_SEGMENTS,cuts?:readonly number[],direction:1|-1=1) {
  const p = Math.max(0, Math.min(1, progress));
  const theta = Math.PI * p;
  // A leaf picked up from the left bends toward the reader from that side.
  // The crease is mirrored, while the same physical endpoints are retained.
  const bend = direction * MAX_BEND_RADIANS * Math.sin(theta);
  let x = 0;
  let z = 0;
  return Array.from({length: count}, (_, index) => {
    const start=cuts?.[index]??index/count;
    const end=cuts?.[index+1]??(index+1)/count;
    const angle=bend*(start+end)*.5;
    const length=end-start;
    const segment={x,z,angle,length};
    x+=Math.cos(angle)*length;
    z-=Math.sin(angle)*length;
    return segment;
  });
}

type StripElements={
  strip:HTMLElement;
  front:HTMLElement|null;
  back:HTMLElement|null;
};
type Layout={width:number;height:number;camera:number;cuts:number[];segments:StripElements[];sourcePair:HTMLElement|null};
/** Weak references prevent a detached turning leaf retaining its DOM. */
const layouts=new WeakMap<HTMLElement,Layout>();

/** Run on mount/resize ONLY. Setting hundreds of constant CSS widths and
 * text offsets at 60Hz forces needless style/layout/raster work on WebKit.
 */
export function layoutPaper(leaf:HTMLElement){
  const width=parseFloat(getComputedStyle(leaf).width);
  if(!(width>0))return;
  const stripNodes=[...leaf.querySelectorAll<HTMLElement>('.paper-segment')];
  if(!stripNodes.length)return;
  const count=stripNodes.length;
  const cuts=paperCuts(width,count,window.devicePixelRatio);
  const overlap=1/window.devicePixelRatio;
  leaf.style.setProperty('--paper-overlap-start',`${-overlap}px`);
  leaf.style.setProperty('--paper-overlap-span',`${2*overlap}px`);
  const height=parseFloat(getComputedStyle(leaf).height);
  const strips=stripNodes.map((strip,index)=>{
    strip.style.width=`${width*(cuts[index+1]-cuts[index])}px`;
    strip.querySelectorAll<HTMLElement>('.paper-print').forEach((print,side)=>{
      print.style.width=`${width}px`;
      print.style.left=`${overlap-(side?1-cuts[index+1]:cuts[index])*width}px`;
    });
    for(const face of strip.querySelectorAll<HTMLElement>('.is-letter-print')){
      const offset=face.dataset.face==='back'?1-cuts[index+1]:cuts[index];
      face.style.backgroundSize=`${width}px ${height}px`;
      face.style.backgroundPosition=`${overlap-offset*width}px 0`;
    }
    return {
      strip,
      front:strip.querySelector<HTMLElement>('.paper-front'),
      back:strip.querySelector<HTMLElement>('.paper-back'),
    };
  });
  const camera=parseFloat(getComputedStyle(leaf.closest('.book-viewport')!).perspective);
  const sourcePair=leaf.closest('.book-shell')?.querySelector<HTMLElement>('.paper-source-pair')??null;
  layouts.set(leaf,{width,height,camera,cuts,segments:strips,sourcePair});
}

/** Per-frame O(N) vertex transforms, face visibility and lighting only.
 * No layout reads or print layout writes on animation frames.
 */
export function posePaper(leaf:HTMLElement, progress:number){
  let layout=layouts.get(leaf);
  if(!layout){layoutPaper(leaf);layout=layouts.get(leaf);}
  if(!layout)return;
  const {width,height,camera,cuts,segments,sourcePair}=layout;
  const count=segments.length;
  const p=Math.max(0,Math.min(1,progress));
  leaf.dataset.progress=String(p);
  // The zero-curvature endpoints are native DOM paper faces. This is exact,
  // not an approximation, and avoids WebKit/Chromium strip sampling seams.
  const endpoint=p===0?'front':p===1?'back':'none';
  leaf.dataset.paperEndpoint=endpoint;
  if(sourcePair)sourcePair.dataset.paperEndpoint=endpoint;
  const theta=Math.PI*p;
  const direction=leaf.dataset.turnDirection==='-1'?-1:1;
  const sin=Math.sin(theta),cos=Math.cos(theta);
  const bend=direction*MAX_BEND_RADIANS*sin;
  const pieces=paperGeometry(p,count,cuts,direction);
  for(let index=0;index<count;index++){
    const {strip,front,back}=segments[index];
    const {x,z,angle}=pieces[index];

    const worldX=cos*x-sin*z;
    const worldZ=sin*x+cos*z;
    const rotation=angle-theta;
    const denominator=1-worldZ*width/camera;
    const perspectiveSlope=Math.sin(rotation)/camera;
    // Project the developable 3D strip directly into its final screen plane.
    // z'=0 avoids WebKit's nested 3D clipping/culling, while the homography
    // retains the exact perspective, readable HTML print and bent silhouette.
    strip.style.transform=`matrix3d(${Math.cos(rotation)},${height*.5*perspectiveSlope},0,${perspectiveSlope},0,1,0,0,0,0,1,0,${worldX*width},${height*.5*(denominator-1)},0,${denominator})`;
    strip.style.zIndex=String(Math.round(worldZ*width*100));
    const normalX=Math.sin(angle-theta),normalZ=Math.cos(angle-theta);
    const facing=normalZ*(camera-worldZ*width)-normalX*worldX*width>=0;
    if(front)front.style.display=facing?'block':'none';
    if(back)back.style.display=facing?'none':'block';
    const edgeShade=(edge:number)=>(1-Math.abs(Math.cos(-theta+bend*cuts[edge])))*.22;
    strip.style.setProperty('--shade-start',String(edgeShade(index)));
    strip.style.setProperty('--shade-end',String(edgeShade(index+1)));

  }
}
