import { useLayoutEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { gsap } from 'gsap';
import { getChapter } from '../data/story';
import { BlankPage, FrontCover, PageHalf } from './SceneArt';

export type PageTurn = Readonly<{from:number;to:number;direction:-1|1}>;
type Props={
  active:number;
  turning:PageTurn|null;
  onTurnFinished:(position:number)=>void;
  name:string;
  wish:string;
  reducedMotion:boolean;
  debugPose:number|null;
  debugFrom:number;
};

function Half({position,side,name,wish}:{
  position:number;side:'left'|'right';name:string;wish:string;
}){
  if(position===0)return side==='right'?<FrontCover/>:<BlankPage/>;
  return <PageHalf chapter={getChapter(position)} side={side} name={name} wish={wish}/>;
}

export function Book({active,turning,onTurnFinished,name,wish,reducedMotion,debugPose,debugFrom}:Props){
  const leafRef=useRef<HTMLDivElement>(null);
  const shellRef=useRef<HTMLDivElement>(null);
  const showingTurn=debugPose===null?turning:{from:debugFrom,to:debugFrom+1,direction:1 as const};
  const closed=active===0&&!showingTurn;

  useLayoutEffect(()=>{
    if(debugPose!==null||!turning||!leafRef.current||!shellRef.current)return;
    const leaf=leafRef.current;
    const shell=shellRef.current;
    const forward=turning.direction===1;
    const initialAngle=forward?0:-180;
    const finalAngle=forward?-180:0;
    const fromShift=turning.from===0?-25:0;
    const toShift=turning.to===0?-25:0;
    // All two-sided page transforms are owned by one cancellable timeline.
    const timeline=gsap.timeline({onComplete:()=>onTurnFinished(turning.to)});
    timeline.fromTo(leaf,{rotateY:initialAngle},
      {rotateY:finalAngle,duration:reducedMotion ? 0.025 : 1.28,ease:'power2.inOut',
      onUpdate:()=>{
        const progress=Math.abs(Number(gsap.getProperty(leaf,'rotationY')))/180;
        leaf.style.setProperty('--leaf-shade',String(Math.sin(Math.PI*progress)*.34));
      }},0);
    if(fromShift!==toShift){
      const moveDuration=reducedMotion ? 0.025 : 1.28;
      timeline.fromTo(shell,{xPercent:fromShift},
        {xPercent:toShift,duration:moveDuration,ease:'power2.inOut'},0);
      // A closed cover must not reveal the full-width pale page block before
      // its spine opens. Unfold the physical paper stack with the cover.
      const paperStack=shell.querySelector<HTMLElement>('.book-depth');
      if(paperStack)timeline.fromTo(paperStack,{
        clipPath:turning.from===0?'inset(0 0 0 50%)':'inset(0 0 0 0%)'
      },{
        clipPath:turning.to===0?'inset(0 0 0 50%)':'inset(0 0 0 0%)',
        duration:moveDuration,ease:'power2.inOut'
      },0);
    }
    return()=>{
      timeline.kill();
      leaf.style.removeProperty('--leaf-shade');
      gsap.set(leaf,{clearProps:'transform'});
      gsap.set(shell,{clearProps:'transform'});
      const stack=shell.querySelector<HTMLElement>('.book-depth');
      if(stack)gsap.set(stack,{clearProps:'clipPath'});
    };
  },[turning,debugPose,reducedMotion,onTurnFinished]);

  const handlePointer=(event:PointerEvent<HTMLDivElement>)=>{
    if(turning||debugPose!==null||reducedMotion||event.pointerType!=='mouse')return;
    const bounds=event.currentTarget.getBoundingClientRect();
    const dx=((event.clientX-bounds.left)/bounds.width-.5)*2;
    const dy=((event.clientY-bounds.top)/bounds.height-.5)*2;
    event.currentTarget.querySelectorAll<HTMLElement>('.book-static .scene-plane').forEach(plane=>{
      const depth=Number(plane.dataset.depth||0);
      plane.style.setProperty('--mx',`${(-dx*depth*1.55).toFixed(1)}px`);
      plane.style.setProperty('--my',`${(-dy*depth*1.2).toFixed(1)}px`);
    });
  };
  const clearPointer=(event:React.PointerEvent<HTMLDivElement>)=>{
    event.currentTarget.querySelectorAll<HTMLElement>('.scene-plane').forEach(plane=>{
      plane.style.removeProperty('--mx');
      plane.style.removeProperty('--my');
    });
  };

  // Two fixed pages sit under a *single* movable half-width leaf. During a
  // forward turn its front is today's right page, its reverse tomorrow's LEFT
  // page. Backward turning traverses the exact same physical path in reverse.
  const leftUnder=showingTurn
    ?(showingTurn.direction===1?showingTurn.from:showingTurn.to)
    :active;
  const rightUnder=showingTurn
    ?(showingTurn.direction===1?showingTurn.to:showingTurn.from)
    :active;
  const leafFront=showingTurn
    ?(showingTurn.direction===1?showingTurn.from:showingTurn.to)
    :active;
  const leafBack=showingTurn
    ?(showingTurn.direction===1?showingTurn.to:showingTurn.from)
    :active;

  const stageShift=debugPose!==null&&showingTurn?.from===0?(-25+25*debugPose):undefined;
  return <div className="book-viewport" onPointerMove={handlePointer} onPointerLeave={clearPointer}>
    <div className={`book-shell ${closed?'is-closed':'is-open'} ${showingTurn?'is-turning':''} ${showingTurn?.from===0?'is-opening':''} ${showingTurn?.to===0?'is-closing':''}`}
      ref={shellRef} data-book-mode={closed?'closed':'open'}
      style={stageShift===undefined?undefined:{transform:`translateX(${stageShift}%)`}}>
      <div className="book-depth" aria-hidden="true"
        style={debugPose!==null&&showingTurn?.from===0?
          {clipPath:`inset(0 0 0 ${50*(1-debugPose)}%)`}:undefined}/>
      {(!closed||showingTurn)&&<>
        <div className="book-static book-left" data-page-role="left-under">
          <Half position={leftUnder} side="left" name={name} wish={wish}/>
        </div>
        <div className="book-static book-right" data-page-role="right-under">
          <Half position={rightUnder} side="right" name={name} wish={wish}/>
        </div>
      </>}
      {closed&&<div className="book-static book-right book-closed-cover">
        <FrontCover/>
      </div>}
      <div className="book-binding" aria-hidden="true"/>
      {showingTurn&&<div
        key={`leaf-${showingTurn.from}-${showingTurn.to}`}
        className="book-turn-leaf" data-page-role="turning-leaf" ref={leafRef}
        style={debugPose===null?undefined:{transform:`rotateY(${-180*debugPose}deg)`}}>
        <div className="book-leaf-face book-leaf-front" data-face="front">
          <Half position={leafFront} side="right" name={name} wish={wish}/>
          <span className="leaf-light" aria-hidden="true"/>
        </div>
        <div className="book-leaf-face book-leaf-back" data-face="back">
          <Half position={leafBack} side="left" name={name} wish={wish}/>
          <span className="leaf-light" aria-hidden="true"/>
        </div>
      </div>}
      <div className="book-edge-shadow" aria-hidden="true"/>
    </div>
  </div>;
}
