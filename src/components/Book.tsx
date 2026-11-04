import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { gsap } from 'gsap';

// WebKit can spend >500ms painting/screenshotting one curved multi-layer leaf.
// GSAP's default 500ms lag smoothing would then advance only ~33ms of book
// time after every stalled frame, effectively trapping navigation mid-turn.
// Honor elapsed wall-clock time on resumed frames rather than extending a
// 1.28s physical turn into a multi-second frozen sheet.
gsap.ticker.lagSmoothing(0);
import { getChapter, type StoryMode } from '../data/story';
import { BlankPage, FrontCover, PageHalf } from './SceneArt';
import { capturePaperPrint, releasePaperPrint, type LayeredPrint, type PaperPrint, type PrintedSurface } from './paperPrint';
import { PAPER_SEGMENTS, layoutPaper, posePaper, segmentCountForTolerance } from './paperGeometry';

export type PageTurn = Readonly<{from:number;to:number;direction:-1|1;interactive?:true}>;

type Props={
  active:number;
  turning:PageTurn|null;
  onTurnFinished:(position:number)=>void;
  onGrabTurn:(direction:-1|1)=>boolean;
  name:string;
  wish:string;
  storyMode:StoryMode;
  reducedMotion:boolean;
  debugPose:number|null;
  debugFrom:number;
  reading?:boolean;
};

function Half({position,side,name,wish,storyMode,printed}:{
  position:number;side:'left'|'right';name:string;wish:string;storyMode:StoryMode;printed?:LayeredPrint;
}){
  if(position===0)return side==='right'?<FrontCover storyMode={storyMode}/>:<BlankPage/>;
  return <PageHalf chapter={getChapter(position,storyMode)} side={side} name={name} wish={wish} storyMode={storyMode} printed={printed}/>;
}

type Grip={
  pointerId:number; startX:number; progress:number;
  released:boolean; commit:boolean; direction:-1|1;
  releaseSpeed:number;
  paint?:(progress:number)=>void; settle?:()=>void;
};

const FLICK_WINDOW_MS=100;
const FLICK_MIN_TRAVEL=.07;
const FLICK_MIN_SPEED=.001;

// Only the back of the hardcover can support a left-hand footprint. Its
// horizontal projection grows from zero at 90° to one half at 180°.
const coverUnfold=(progress:number)=>Math.max(0,-Math.cos(Math.PI*progress));

export function Book({active,turning,onTurnFinished,onGrabTurn,name,wish,storyMode,reducedMotion,debugPose,debugFrom,reading=false}:Props){
  // The grip owns the gesture until pointerup/cancel; React never owns its
  // frame-by-frame progress. Moving a pointer backward is a physical reversal
  // of the SAME mounted sheet, not a second page-turn command.
  const gripRef=useRef<Grip|null>(null);
  const gripListenerCleanupRef=useRef<(()=>void)|null>(null);
  const leafRef=useRef<HTMLDivElement>(null);
  const shellRef=useRef<HTMLDivElement>(null);
  const lastTurn=useRef<PageTurn|null>(null);
  const [preparedTurn,setPreparedTurn]=useState<PageTurn|null>(null);
  const [paperSegments,setPaperSegments]=useState(PAPER_SEGMENTS);
  const [print,setPrint]=useState<(PaperPrint&{turn:PageTurn|null;pose:number|null;from:number;name:string;wish:string})|null>(null);
  const [decodedPrint,setDecodedPrint]=useState<{print:PaperPrint;segments:number}|null>(null);
  const showingTurn=debugPose===null?turning:{from:debugFrom,to:debugFrom+1,direction:1 as const};
  const flexible=!!showingTurn&&showingTurn.from>0&&showingTurn.to>0&&(!reducedMotion||debugPose!==null||!!turning?.interactive);
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

  // Native pages own the settled spread. Release the previous turn's
  // temporary texture URLs now, rather than retaining them until another
  // turn (or component unmount), including while the cover is closed.
  useLayoutEffect(()=>{
    if(showingTurn)return;
    if(print)setPrint(null);
    if(decodedPrint)setDecodedPrint(null);
  },[showingTurn,print,decodedPrint]);

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

  // The cover has no print capture. Keep the outgoing spread visible while
  // its incoming artwork decodes. Curved leaves have their own readiness gate.
  useLayoutEffect(()=>{
    if(!turning||debugPose!==null||flexible)return;
    let cancelled=false;
    const images=[...shellRef.current!.querySelectorAll<HTMLImageElement>('.scene-plane,.handwriting-image')];
    void Promise.all(images.map(image=>image.decode().catch(()=>undefined))).then(()=>{
      if(!cancelled)setPreparedTurn(turning);
    });
    return()=>{cancelled=true;};
  },[turning,debugPose,flexible]);

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


  // Physically coupled dragging: the animation never advances by its own
  // clock while the pointer is held. Both forward and backward turns share
  // the same 0..1 sheet pose (1=left, 0=right). Releasing settles to the
  // nearest legal page; dragging back before release cancels naturally.
  useLayoutEffect(()=>{
    if(debugPose!==null||!turning?.interactive||waiting||!leafRef.current||!shellRef.current)return;
    const leaf=leafRef.current;
    const shell=shellRef.current;
    const grip=gripRef.current;
    if(!grip)return;
    let tween:gsap.core.Tween|undefined;
    let finished=false;
    const fromShift=turning.from===0?-25:0;
    const toShift=turning.to===0?-25:0;
    const paint=(value:number)=>{
      const p=Math.max(0,Math.min(1,value));
      grip.progress=p;
      if(flexible)posePaper(leaf,p);
      else {
        leaf.style.setProperty('--leaf-shade',String(Math.sin(Math.PI*p)*.34));
        gsap.set(leaf,{rotateY:-180*p});
        leaf.dataset.visibleFace=p<.5?'front':'back';
      }
      if(fromShift!==toShift){
        shell.style.setProperty('--cover-unfold',String(coverUnfold(p)));
        const completed=turning.direction===1?p:1-p;
        gsap.set(shell,{xPercent:fromShift+(toShift-fromShift)*completed});
      }
    };
    const settle=()=>{
      if(!grip.released||finished||tween)return;
      const endpoint=grip.commit?(turning.direction===1?1:0):(turning.direction===1?0:1);
      const done=()=>{
        if(finished)return;
        finished=true;
        if(gripRef.current===grip)gripRef.current=null;
        onTurnFinished(grip.commit?turning.to:turning.from);
      };
      if(reducedMotion||Math.abs(endpoint-grip.progress)<.005){
        paint(endpoint);done();return;
      }
      const transition={progress:grip.progress};
      const distance=Math.abs(endpoint-grip.progress);
      const stockDuration=Math.max(.18,.46*distance);
      // A decisive flick carries its velocity into the first part of the
      // cubic ease-out. A quiet release uses the usual settling duration.
      const duration=grip.releaseSpeed
        ?Math.min(stockDuration,Math.max(.12,3*distance/(1000*Math.abs(grip.releaseSpeed))))
        :stockDuration;
      tween=gsap.to(transition,{progress:endpoint,duration,
        ease:'power2.out',onUpdate:()=>paint(transition.progress),onComplete:done});
    };
    grip.paint=paint;
    grip.settle=settle;
    paint(grip.progress);
    if(grip.released)settle();
    return()=>{
      tween?.kill();
      grip.paint=undefined;
      grip.settle=undefined;
      leaf.style.removeProperty('--leaf-shade');
      shell.style.removeProperty('--cover-unfold');
      gsap.set(leaf,{clearProps:'transform'});
      gsap.set(shell,{clearProps:'transform'});
    };
  },[turning,waiting,debugPose,reducedMotion,flexible,onTurnFinished]);

  useLayoutEffect(()=>{
    if(debugPose!==null||!turning||turning.interactive||waiting||!leafRef.current||!shellRef.current)return;
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
    if(fromShift!==toShift)shell.style.setProperty('--cover-unfold',String(coverUnfold(forward?0:1)));
    const printProgress={value:forward?0:1};
    const update=(progress:number)=>{
      if(flexible)posePaper(leaf,progress);
      else {
        leaf.style.setProperty('--leaf-shade',String(Math.sin(Math.PI*progress)*.34));
        leaf.dataset.visibleFace=progress<.5?'front':'back';
        if(fromShift!==toShift)shell.style.setProperty('--cover-unfold',String(coverUnfold(progress)));
      }
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
    }
    // Readiness is already established before this effect:
    // capturePaperPrint waits for the source artwork and printReady waits for
    // the mounted printed images to decode. A SECOND decode() of every scene
    // image here deadlocks on WebKit when a hidden/paused source is present:
    // the timeline never starts, so onComplete never unmounts the leaf.
    // Start the physical motion after the readiness gate, synchronously.
    if(flexible)posePaper(leaf,forward?0:1);
    timeline.play();
    return()=>{
      timeline.kill();
      leaf.style.removeProperty('--leaf-shade');
      shell.style.removeProperty('--cover-unfold');
      gsap.set(leaf,{clearProps:'transform'});
      gsap.set(shell,{clearProps:'transform'});
    };
  },[turning,debugPose,reducedMotion,onTurnFinished,waiting,flexible]);

  useLayoutEffect(()=>()=>gripListenerCleanupRef.current?.(),[]);

  // Pointer capture is not consistently delivered to React's bubble handlers
  // when WebKit re-composites/mounts a curved page under the active pointer.
  // Window CAPTURE listeners are the authoritative gesture transport. They
  // continue to receive move/up/cancel if the original leaf DOM is replaced.
  const releaseGrip=(pointerId:number,host:HTMLDivElement,cancelled=false,releaseSpeed=0)=>{
    const grip=gripRef.current;
    if(!grip||grip.released||grip.pointerId!==pointerId)return;
    grip.released=true;
    const travel=grip.direction===1?grip.progress:1-grip.progress;
    // Slow releases settle by position. A decisive recent pull back can
    // return the sheet even when it is still just past the halfway point.
    grip.commit=!cancelled&&(releaseSpeed?releaseSpeed>0:travel>=.5);
    grip.releaseSpeed=cancelled?0:releaseSpeed;
    delete host.dataset.grabActive;
    gripListenerCleanupRef.current?.();
    gripListenerCleanupRef.current=null;
    try{if(host.hasPointerCapture(pointerId))host.releasePointerCapture(pointerId);}
    catch{/* a detached/composited element may have lost capture */}
    grip.settle?.(); // If textures aren't ready, readiness will settle later.
  };
  const handleGripStart=(event:PointerEvent<HTMLDivElement>)=>{
    if(reading||turning||gripRef.current||debugPose!==null||!event.isPrimary||
       (event.pointerType==='mouse'&&event.button!==0))return;
    const host=event.currentTarget;
    const bounds=host.getBoundingClientRect();
    const local=event.clientX-bounds.left;
    const direction:1|-1=local>=bounds.width/2?1:-1;
    if((direction===1&&active>=5)||(direction===-1&&active<=0))return;
    if(!onGrabTurn(direction))return;
    const grip:Grip={
      pointerId:event.pointerId,startX:event.clientX,direction,
      progress:direction===1?0:1,released:false,commit:false,releaseSpeed:0
    };
    gripRef.current=grip;
    host.dataset.grabActive='true';
    // Freeze the coordinate scale at contact. Each refresh consumes the most
    // recent input, even when a device reports multiple reversals per frame.
    const halfWidth=Math.max(1,bounds.width/2);
    const allowsFlick=active>0&&active+direction>0&&!reducedMotion;
    const samples=[{time:event.timeStamp,travel:0}];
    let frame=0;
    const updateProgress=({clientX,timeStamp}:globalThis.PointerEvent)=>{
      const travel=Math.max(0,Math.min(1,-direction*(clientX-grip.startX)/halfWidth));
      grip.progress=direction===1?travel:1-travel;
      if(!allowsFlick||Math.abs(travel-samples.at(-1)!.travel)<.004)return;
      samples.push({time:timeStamp,travel});
      while(samples.length>2&&timeStamp-samples[0].time>FLICK_WINDOW_MS)samples.shift();
    };
    const recentFlick=(time:number)=>{
      const last=samples.at(-1)!;
      if(time-last.time>FLICK_WINDOW_MS)return 0;
      let first=last,sign=0;
      for(let index=samples.length-2;index>=0;index--){
        const sample=samples[index];
        const step=Math.sign(first.travel-sample.travel);
        if(sign&&step!==sign)break;
        sign=step;first=sample;
        // Retain the preceding position when the finger moves abruptly
        // after a pause, even if it predates the velocity window.
        if(time-sample.time>FLICK_WINDOW_MS)break;
      }
      const traveled=last.travel-first.travel;
      const speed=traveled/Math.min(FLICK_WINDOW_MS,Math.max(16,time-first.time));
      return Math.abs(traveled)>=FLICK_MIN_TRAVEL&&Math.abs(speed)>=FLICK_MIN_SPEED?speed:0;
    };
    const flushPaint=()=>{
      if(frame)cancelAnimationFrame(frame);
      frame=0;
      grip.paint?.(grip.progress);
    };
    const onMove=(e:globalThis.PointerEvent)=>{
      if(grip.released||grip.pointerId!==e.pointerId)return;
      updateProgress(e);
      if(grip.paint&&!frame)frame=requestAnimationFrame(flushPaint);
      if(e.cancelable)e.preventDefault();
    };
    const onUp=(e:globalThis.PointerEvent)=>{
      if(grip.released||grip.pointerId!==e.pointerId)return;
      updateProgress(e);
      flushPaint();
      releaseGrip(e.pointerId,host,false,allowsFlick?recentFlick(e.timeStamp):0);
    };
    const onCancel=(e:globalThis.PointerEvent)=>{
      if(grip.released||grip.pointerId!==e.pointerId)return;
      flushPaint();
      releaseGrip(e.pointerId,host,true);
    };
    const onBlur=()=>{
      flushPaint();
      releaseGrip(grip.pointerId,host,true);
    };
    window.addEventListener('pointermove',onMove,{capture:true,passive:false});
    window.addEventListener('pointerup',onUp,true);
    window.addEventListener('pointercancel',onCancel,true);
    window.addEventListener('blur',onBlur);
    gripListenerCleanupRef.current=()=>{
      if(frame)cancelAnimationFrame(frame);
      window.removeEventListener('pointermove',onMove,true);
      window.removeEventListener('pointerup',onUp,true);
      window.removeEventListener('pointercancel',onCancel,true);
      window.removeEventListener('blur',onBlur);
    };
    try{host.setPointerCapture(event.pointerId);}catch{/* synthetic QA input */}
    event.preventDefault();
  };
  const handlePointer=(event:PointerEvent<HTMLDivElement>)=>{
    if(gripRef.current||turning||debugPose!==null||reducedMotion||event.pointerType!=='mouse')return;
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
  // During a cover transition the left-hand chapter must already be mounted
  // behind the turning hardcover. Rendering position 0 here used to insert
  // a blank leaf until the final React commit, creating an obvious visual pop.
  // Only the hardcover back paints the left illustration during the turn.
  // Its stationary twin stays mounted for pose matching, but hidden until
  // landing. A progress-based wipe exposed a second, unbound copy of HELLO.
  const coverTransition=!!showingTurn&&(showingTurn.from===0||showingTurn.to===0);
  const leftUnder=showingTurn&&!waiting
    ?(coverTransition?Math.max(showingTurn.from,showingTurn.to)
      :(showingTurn.direction===1?showingTurn.from:showingTurn.to))
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

  const coverPreview=debugPose!==null&&showingTurn?.from===0?{
    transform:`translateX(${-25+25*debugPose}%)`,
    '--cover-unfold':coverUnfold(debugPose),
  } as CSSProperties:undefined;
  const stripFace=(face:'front'|'back',position:number,side:'left'|'right',texture:PrintedSurface)=>
    <div className={`paper-segment-face paper-${face}${texture.kind==='letter'?' is-letter-print':''}`} data-face={face}
      style={texture.kind==='letter'?{backgroundImage:`url(${texture.composition})`}:undefined}>
      {texture.kind==='layered'&&<div className="paper-print">
        <Half position={position} side={side} name={name} wish={wish} storyMode={storyMode} printed={texture}/>
      </div>}
    </div>;
  return <div className="book-viewport" data-grab-enabled={debugPose===null&&!reading?"true":"false"}
    onPointerDown={handleGripStart} onPointerMove={handlePointer}
    onPointerLeave={clearPointer}>
    <div className={`book-shell ${closed?'is-closed':'is-open'} ${showingTurn?'is-turning':''} ${!waiting&&showingTurn?.from===0?'is-opening':''} ${!waiting&&showingTurn?.to===0?'is-closing':''}`}
      ref={shellRef} data-book-mode={closed?'closed':'open'}
      style={coverPreview}>
      <div className="book-depth" aria-hidden="true"/>
      {!closed&&<>
        <div key={`static-left-${leftUnder}`} className="book-static book-left" data-page-role="left-under">
          <Half position={leftUnder} side="left" name={name} wish={wish} storyMode={storyMode}/>
        </div>
        <div key={`static-right-${rightUnder}`} className="book-static book-right" data-page-role="right-under">
          <Half position={rightUnder} side="right" name={name} wish={wish} storyMode={storyMode}/>
        </div>
      </>}
      {closed&&<div className="book-static book-right book-closed-cover">
        <FrontCover storyMode={storyMode}/>
      </div>}
      {flexible&&<div className={`paper-source-pair ${printReady?'is-ready':''}`} aria-hidden="true">
        <div className="paper-source" data-print="front"><Half position={leafFront} side="right" name={name} wish={wish} storyMode={storyMode}/></div>
        <div className="paper-source" data-print="back"><Half position={leafBack} side="left" name={name} wish={wish} storyMode={storyMode}/></div>
      </div>}
      {showingTurn&&<div
        key={`leaf-${showingTurn.from}-${showingTurn.to}`}
        className={`book-turn-leaf ${flexible?'is-flexible':''}`} data-page-role="turning-leaf" ref={leafRef}
        aria-hidden="true"
        data-texture-ready={flexible?String(printReady):undefined}
        data-print-available={flexible?String(printAvailable):undefined}
        data-paper-kind={printAvailable?print.front.kind:undefined}
        data-loading={waiting?'true':undefined}
        data-turn-direction={showingTurn.direction}
        data-visible-face={debugPose!==null?(debugPose<.5?'front':'back'):
          showingTurn.direction===1?'front':'back'}
        style={flexible||debugPose===null?undefined:{transform:`rotateY(${-180*debugPose}deg)`}}>
        {flexible?(printAvailable&&Array.from({length:paperSegments},(_,index)=><div className="paper-segment" key={index}>
          {stripFace('front',leafFront,'right',print.front)}
          {stripFace('back',leafBack,'left',print.back)}
        </div>)):<><div className="book-leaf-face book-leaf-front" data-face="front">
          <Half position={leafFront} side="right" name={name} wish={wish} storyMode={storyMode}/>
          <span className="leaf-light" aria-hidden="true"/>
        </div>
        <div className="book-leaf-face book-leaf-back" data-face="back">
          <Half position={leafBack} side="left" name={name} wish={wish} storyMode={storyMode}/>
          <span className="leaf-light" aria-hidden="true"/>
        </div>
        </>}
      </div>}
      <div className="book-edge-shadow" aria-hidden="true"/>
    </div>
  </div>;
}
