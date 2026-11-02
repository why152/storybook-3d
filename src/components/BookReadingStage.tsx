import {useLayoutEffect, useRef, type ReactNode} from 'react';

export type ReadingSide='left'|'right'|null;

/** Magnify the existing bound book, without mounting a second page renderer.
 * The scroll aperture is outside the book's perspective/3D scene. During a
 * turn App returns to the full spread so the whole physical leaf is visible. */
export function BookReadingStage({children,side}:{children:ReactNode;side:ReadingSide}){
  const stage=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    const element=stage.current!;
    const align=()=>{element.scrollLeft=side==='right'?element.scrollWidth-element.clientWidth:0;};
    align();
    const observer=new ResizeObserver(align);
    observer.observe(element);
    return()=>observer.disconnect();
  },[side]);
  return <div ref={stage} className="book-reading-stage" data-reading-side={side??'spread'}>
    {children}
  </div>;
}
