import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { gsap } from 'gsap';
import { getChapter } from '../data/story';
import { BlankPage, FrontCover, PageHalf } from './SceneArt';
import { capturePaperPrint, releasePaperPrint, type PaperPrint, type PrintedSurface } from './paperPrint';
import { PAPER_SEGMENTS, layoutPaper, posePaper, segmentCountForTolerance } from './paperGeometry';

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

function Half({position,side,name,wish,inkOnly=false,printed}:{
  position:number;side:'left'|'right';name:string;wish:string;inkOnly?:boolean;printed?:PrintedSurface;
}){
  if(position===0)return side==='right'?<FrontCover/>:<BlankPage/>;
  return <PageHalf chapter={getChapter(position)} side={side} name={name} wish={wish} inkOnly={inkOnly} printed={printed}/>;
}

export function Book({active,turning,onTurnFinished,name,wish,reducedMotion,debugPose,debugFrom}:Props){
  const leafRef=useRef<HTMLDivElement>(null);
  const shellRef=useRef<HTMLDivElement>(null);
  const lastTurn=useRef<PageTurn|null>(null);
  const [preparedTurn,setPreparedTurn]=useState<PageTurn|null>(null);
  const [paperSegments,setPaperSegments]=useState(PAPER_SEGMENTS);
  const [print,setPrint]=useState<(PaperPrint&{turn:PageTurn|null;pose:number|null;from:number;name:string;wish:string})|null>(null);
  const [decodedPrint,setDecodedPrint]=useState<{print:PaperPrint;segments:number}|null>(null);
  const showingTurn=debugPose===null?turning:{from:debugFrom,to:debugFrom+1,direction:1 as const};
  const flexible=!!showingTurn&&showingTurn.from>0&&showingTurn.to>0&&(!reducedMotion||debugPose!==null);
  const printAvailable=!!print&&print.turn===turning&&print.pose===debugPose&&print.from===debugFrom&&print.name===name&&print.wish===wish;
  const printReady=printAvailable&&decodedPrint?.print===print&&decodedPrint.segments===paperSegments;
  const waiting=flexible?!printReady:debugPose===null&&turning!==null&&preparedTurn!==turning;
  const closed=active===0&&(!showingTurn||waiting);

  useLayoutEffect(()=>{
    // Keep a leaf's topology fixed while it is turning. After a resize, choose
    // the smallest mesh with <= 0.5px model error before the next turn.
    if(turning)return;
    const shell=shellRef.current!;
    const choose=()=>{
      const width=shell.getBoundingClientRect().width/2;
      if(width>0)setPaperSegments(segmentCountForTolerance(width,.5,8,PAPER_SEGMENTS,window.devicePixelRatio));
    };
    choose();
    const observer=new ResizeObserver(choose);
    observer.observe(shell);
    window.addEventListener('resize',choose);
    return()=>{observer.disconnect();window.removeEventListener('resize',choose);};
  },[turning]);

  useLayoutEffect(()=>{
    if(!flexible)return;
    let cancelled=false;
    const pair=shellRef.current!.querySelector<HTMLElement>('.paper-source-pair')!;
    void capturePaperPrint(pair).then(texture=>{
      if(!cancelled)setPrint({turn:turning,pose:debugPose,from:debugFrom,name,wish,...texture});
      else releasePaperPrint(texture);
    });
    return()=>{cancelled=true;};
  },[flexible,turning,debugPose,debugFrom,name,wish]);

  useLayoutEffect(()=>()=>{if(print)releasePaperPrint(print);},[print]);

  useLayoutEffect(()=>{
    if(!flexible||!printAvailable||!print)return;
    let cancelled=false;
    const images=[...leafRef.current!.querySelectorAll<HTMLImageElement>('img')];
    void Promise.all(images.map(image=>image.decode())).then(async()=>{
      // Allow decoded print surfaces to enter WebKit's next display transaction
      // before replacing the outgoing spread with the incoming underlay.
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      if(!cancelled)setDecodedPrint({print,segments:paperSegments});
    });
    return()=>{cancelled=true;};
  },[flexible,printAvailable,print,paperSegments]);

  // Keep the entire outgoing spread painted while the new leaf's own image
  // elements decode. Cached URLs do not imply a newly mounted image is ready.
  useLayoutEffect(()=>{
    if(!turning||debugPose!==null)return;
    let cancelled=false;
    const images=[...shellRef.current!.querySelectorAll<HTMLImageElement>('.scene-plane')];
    void Promise.all(images.map(image=>image.decode().catch(()=>undefined))).then(()=>{
      if(!cancelled)setPreparedTurn(turning);
    });
    return()=>{cancelled=true;};
  },[turning,debugPose]);

  // Match retained and newly mounted halves before paint. CSS pauses the
  // original animation instead of removing it; the physical leaf receives
  // that exact printed pose, including pointer parallax and ambient effects.
  useLayoutEffect(()=>{
    const shell=shellRef.current;
    if(!shell)return;
    if(showingTurn){
      // WebKit can defer a CSS-only pause until its next animation sample.
      // Set an explicit hold time before reading/copying the printed pose.
      shell.querySelectorAll('.book-static .scene-plane').forEach(plane=>{
        plane.getAnimations().forEach(animation=>{
          const time=animation.currentTime;
          animation.pause();
          animation.currentTime=time;
        });
      });
      shell.querySelectorAll<HTMLElement>(flexible?'.paper-source-pair .page-surface':'.book-turn-leaf .page-surface').forEach(face=>{
        const source=shell.querySelector<HTMLElement>(
          `.book-static .page-surface[data-chapter="${face.dataset.chapter}"]`
        );
        if(!source)return;
        const originals=source.querySelectorAll<HTMLElement>('.scene-plane');
        face.querySelectorAll<HTMLElement>('.scene-plane').forEach((plane,index)=>{
          const original=originals[index];
          if(!original)return;
          const pose=getComputedStyle(original).transform;
          plane.style.animation='none';
          plane.style.transform=pose;
          // A running pointer transition must freeze at the same printed pose.
          original.style.transform=pose;
          original.style.transition='none';
        });
      });
      lastTurn.current=showingTurn;
    }else if(lastTurn.current){
      const retained=lastTurn.current.direction===1?'right':'left';
      const source=shell.querySelector(`.book-static.book-${retained}`);
      const target=shell.querySelector(`.book-static.book-${retained==='right'?'left':'right'}`);
      const originals=source?.querySelectorAll('.scene-plane');
      target?.querySelectorAll('.scene-plane').forEach((plane,index)=>{
        const sourceAnimations=originals?.[index]?.getAnimations()??[];
        plane.getAnimations().forEach((animation,i)=>{
          if(sourceAnimations[i])animation.currentTime=sourceAnimations[i].currentTime;
        });
      });
      shell.querySelectorAll<HTMLElement>('.book-static .scene-plane').forEach(plane=>{
        plane.style.removeProperty('transform');
        plane.style.removeProperty('transition');
        plane.getAnimations().forEach(animation=>animation.play());
      });
      lastTurn.current=null;
    }
  },[active,turning,debugPose,debugFrom,preparedTurn,printReady,flexible]);

  useLayoutEffect(()=>{
    if(!flexible||!printAvailable||!leafRef.current)return;
    const leaf=leafRef.current;
    const layout=()=>{
      layoutPaper(leaf);
      posePaper(leaf,debugPose??Number(leaf.dataset.progress??(turning?.direction===-1?1:0)));
    };
    layout();
    const observer=new ResizeObserver(layout);
    observer.observe(leaf);
    return()=>observer.disconnect();
  },[flexible,turning,debugPose,preparedTurn,printAvailable,print,paperSegments]);

  useLayoutEffect(()=>{
    if(debugPose!==null||!turning||waiting||!leafRef.current||!shellRef.current)return;
    if(reducedMotion){onTurnFinished(turning.to);return;}
    const leaf=leafRef.current;
    const shell=shellRef.current;
    const forward=turning.direction===1;
    const initialAngle=forward?0:-180;
    const finalAngle=forward?-180:0;
    const fromShift=turning.from===0?-25:0;
    const toShift=turning.to===0?-25:0;
    // All two-sided page transforms are owned by one cancellable timeline.
    const timeline=gsap.timeline({paused:true,onComplete:()=>onTurnFinished(turning.to)});
    // Mounting a reverse turn must start at its left endpoint even while
    // incoming images decode. Never expose an empty or wrong-facing leaf.
    if(!flexible)gsap.set(leaf,{rotateY:initialAngle});
    let cancelled=false;
    const printProgress={value:forward?0:1};
    const update=(progress:number)=>{
      leaf.style.setProperty('--leaf-shade',String(Math.sin(Math.PI*progress)*.34));
      if(flexible)posePaper(leaf,progress);
      else leaf.dataset.visibleFace=progress<.5?'front':'back';
    };
    if(flexible){
      // Project the joined curve as individual print surfaces; the hinge
      // remains fixed even though there is no edge-on transformed ancestor.
      timeline.to(printProgress,{value:forward?1:0,
        duration:1.28,ease:'power2.inOut',
        onUpdate:()=>update(printProgress.value)},0);
    }else{
      timeline.fromTo(leaf,{rotateY:initialAngle},
        {rotateY:finalAngle,duration:1.28,ease:'power2.inOut',
          onUpdate:()=>update(Math.abs(Number(gsap.getProperty(leaf,'rotationY')))/180)},0);
    }
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
    // Hold the outgoing face until every incoming image is ready to paint.
    const images=[...shell.querySelectorAll<HTMLImageElement>('.scene-plane')];
    void Promise.all(images.map(image=>image.decode().catch(()=>undefined))).then(()=>{
      if(!cancelled){
        if(flexible)posePaper(leaf,forward?0:1);
        timeline.play();
      }
    });
    return()=>{
      cancelled=true;
      timeline.kill();
      leaf.style.removeProperty('--leaf-shade');
      gsap.set(leaf,{clearProps:'transform'});
      gsap.set(shell,{clearProps:'transform'});
      const stack=shell.querySelector<HTMLElement>('.book-depth');
      if(stack)gsap.set(stack,{clearProps:'clipPath'});
    };
  },[turning,debugPose,reducedMotion,onTurnFinished,waiting,flexible]);

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
    if(turning||debugPose!==null)return;
    event.currentTarget.querySelectorAll<HTMLElement>('.scene-plane').forEach(plane=>{
      plane.style.removeProperty('--mx');
      plane.style.removeProperty('--my');
    });
  };

  // Two fixed pages sit under a *single* movable half-width leaf. During a
  // forward turn its front is today's right page, its reverse tomorrow's LEFT
  // page. Backward turning traverses the exact same physical path in reverse.
  const leftUnder=showingTurn&&!waiting
    ?(showingTurn.direction===1?showingTurn.from:showingTurn.to)
    :active;
  const rightUnder=showingTurn&&!waiting
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
    <div className={`book-shell ${closed?'is-closed':'is-open'} ${showingTurn?'is-turning':''} ${!waiting&&showingTurn?.from===0?'is-opening':''} ${!waiting&&showingTurn?.to===0?'is-closing':''}`}
      ref={shellRef} data-book-mode={closed?'closed':'open'}
      style={stageShift===undefined?undefined:{transform:`translateX(${stageShift}%)`}}>
      <div className="book-depth" aria-hidden="true"
        style={debugPose!==null&&showingTurn?.from===0?
          {clipPath:`inset(0 0 0 ${50*(1-debugPose)}%)`}:undefined}/>
      {!closed&&<>
        <div key={`static-left-${leftUnder}`} className="book-static book-left" data-page-role="left-under">
          <Half position={leftUnder} side="left" name={name} wish={wish}/>
        </div>
        <div key={`static-right-${rightUnder}`} className="book-static book-right" data-page-role="right-under">
          <Half position={rightUnder} side="right" name={name} wish={wish}/>
        </div>
      </>}
      {closed&&<div className="book-static book-right book-closed-cover">
        <FrontCover/>
      </div>}
      {flexible&&<div className={`paper-source-pair ${printReady?'is-ready':''}`} aria-hidden="true">
        <div className="paper-source" data-print="front"><Half position={leafFront} side="right" name={name} wish={wish}/></div>
        <div className="paper-source" data-print="back"><Half position={leafBack} side="left" name={name} wish={wish}/></div>
      </div>}
      <div className="book-binding" aria-hidden="true"/>
      {showingTurn&&<div
        key={`leaf-${showingTurn.from}-${showingTurn.to}`}
        className={`book-turn-leaf ${flexible?'is-flexible':''}`} data-page-role="turning-leaf" ref={leafRef}
        aria-hidden="true"
        data-texture-ready={flexible?String(printReady):undefined}
        data-print-available={flexible?String(printAvailable):undefined}
        data-loading={waiting?'true':undefined}
        data-visible-face={debugPose!==null?(debugPose<.5?'front':'back'):
          showingTurn.direction===1?'front':'back'}
        style={flexible||debugPose===null?undefined:{transform:`rotateY(${-180*debugPose}deg)`}}>
        {flexible?Array.from({length:paperSegments},(_,index)=><div className="paper-segment" key={index}>
          <div className="paper-segment-face paper-front" data-face="front">
            <div className="paper-print"><Half position={leafFront} side="right" name={name} wish={wish} inkOnly printed={print?.front}/></div>
          </div>
          <div className="paper-segment-face paper-back" data-face="back">
            <div className="paper-print"><Half position={leafBack} side="left" name={name} wish={wish} inkOnly printed={print?.back}/></div>
          </div>
        </div>):<><div className="book-leaf-face book-leaf-front" data-face="front">
          <Half position={leafFront} side="right" name={name} wish={wish}/>
          <span className="leaf-light" aria-hidden="true"/>
        </div>
        <div className="book-leaf-face book-leaf-back" data-face="back">
          <Half position={leafBack} side="left" name={name} wish={wish}/>
          <span className="leaf-light" aria-hidden="true"/>
        </div>
        </>}
      </div>}
      <div className="book-edge-shadow" aria-hidden="true"/>
    </div>
  </div>;
}
