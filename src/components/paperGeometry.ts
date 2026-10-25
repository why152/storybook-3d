/** Piecewise-developable paper anchored at the spine. Each straight strip
 * retains its arc length; the circular target curve is sampled at strip
 * midpoints. All layout geometry is independent of animation progress.
 */
export const PAPER_SEGMENTS = 20;
export const MAX_BEND_RADIANS = 1.15;

/** Conservative screen-space sagitta budget for a circular approximation.
 * W: actual flat leaf width in CSS pixels; N: number of equal-length strips.
 * This is a bound for LOCAL curvature error, not a rasterization guarantee.
 */
export function curvatureErrorPx(width: number, segments: number) {
  if(!Number.isFinite(width)||width<=0||segments<1)return Infinity;
  const k=MAX_BEND_RADIANS;
  return width*(1-Math.cos(k/(2*segments)))/k;
}
export function segmentCountForTolerance(width: number, tolerancePx: number,
  minSegments=4,maxSegments=24) {
  if(!Number.isFinite(tolerancePx)||tolerancePx<=0)throw new RangeError('Invalid pixel budget');
  for(let n=minSegments;n<=maxSegments;n++){
    if(curvatureErrorPx(width,n)<=tolerancePx)return n;
  }
  return maxSegments;
}

export function paperGeometry(progress: number, count = PAPER_SEGMENTS) {
  const p = Math.max(0, Math.min(1, progress));
  const theta = Math.PI * p;
  const bend = MAX_BEND_RADIANS * Math.sin(theta);
  let x = 0;
  let z = 0;
  return Array.from({length: count}, (_, index) => {
    const angle = bend * (index + .5) / count;
    const segment = {x, z, angle, length: 1 / count};
    x += Math.cos(angle) / count;
    z -= Math.sin(angle) / count;
    return segment;
  });
}

type StripElements={
  strip:HTMLElement;
  front:HTMLElement|null;
  back:HTMLElement|null;
};
type Layout={width:number;segments:StripElements[]};
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
  const segmentWidth=width/count;
  const strips=stripNodes.map((strip,index)=>{
    strip.style.width=`${segmentWidth}px`;
    strip.querySelectorAll<HTMLElement>('.paper-print').forEach((print,side)=>{
      print.style.width=`${width}px`;
      print.style.left=`${.75-(side?count-1-index:index)*segmentWidth}px`;
    });
    return {
      strip,
      front:strip.querySelector<HTMLElement>('.paper-front'),
      back:strip.querySelector<HTMLElement>('.paper-back'),
    };
  });
  layouts.set(leaf,{width,segments:strips});
}

/** Per-frame O(N) vertex transforms, face visibility and lighting only.
 * No layout reads or print layout writes on animation frames.
 */
export function posePaper(leaf:HTMLElement, progress:number){
  let layout=layouts.get(leaf);
  if(!layout){layoutPaper(leaf);layout=layouts.get(leaf);}
  if(!layout)return;
  const {width,segments}=layout;
  const count=segments.length;
  const p=Math.max(0,Math.min(1,progress));
  const theta=Math.PI*p;
  const bend=MAX_BEND_RADIANS*Math.sin(theta);
  let x=0,z=0;
  for(let index=0;index<count;index++){
    const {strip,front,back}=segments[index];
    const angle=bend*(index+.5)/count;
    strip.style.transform=`translate3d(${x*width}px,0,${z*width}px) rotateY(${angle}rad)`;
    const facing=Math.cos(-theta+angle)>=0;
    if(front)front.style.visibility=facing?'visible':'hidden';
    if(back)back.style.visibility=facing?'hidden':'visible';
    const edgeShade=(edge:number)=>(1-Math.abs(Math.cos(-theta+bend*edge/count)))*.22;
    strip.style.setProperty('--shade-start',String(edgeShade(index)));
    strip.style.setProperty('--shade-end',String(edgeShade(index+1)));
    x+=Math.cos(angle)/count;
    z-=Math.sin(angle)/count;
  }
}
