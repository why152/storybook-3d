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

export function paperGeometry(progress: number, count = PAPER_SEGMENTS,cuts?:readonly number[]) {
  const p = Math.max(0, Math.min(1, progress));
  const theta = Math.PI * p;
  const bend = MAX_BEND_RADIANS * Math.sin(theta);
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
type Layout={width:number;height:number;camera:number;cuts:number[];segments:StripElements[]};
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
    return {
      strip,
      front:strip.querySelector<HTMLElement>('.paper-front'),
      back:strip.querySelector<HTMLElement>('.paper-back'),
    };
  });
  const camera=parseFloat(getComputedStyle(leaf.closest('.book-viewport')!).perspective);
  layouts.set(leaf,{width,height,camera,cuts,segments:strips});
}

/** Per-frame O(N) vertex transforms, face visibility and lighting only.
 * No layout reads or print layout writes on animation frames.
 */
export function posePaper(leaf:HTMLElement, progress:number){
  let layout=layouts.get(leaf);
  if(!layout){layoutPaper(leaf);layout=layouts.get(leaf);}
  if(!layout)return;
  const {width,height,camera,cuts,segments}=layout;
  const count=segments.length;
  const p=Math.max(0,Math.min(1,progress));
  leaf.dataset.progress=String(p);
  const theta=Math.PI*p;
  const bend=MAX_BEND_RADIANS*Math.sin(theta);
  const pieces=paperGeometry(p,count,cuts);
  for(let index=0;index<count;index++){
    const {strip,front,back}=segments[index];
    const {x,z,angle}=pieces[index];

    const worldX=Math.cos(theta)*x-Math.sin(theta)*z;
    const worldZ=Math.sin(theta)*x+Math.cos(theta)*z;
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
