import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './styles.css';

type SceneId = 'cover' | 'hello' | 'grow' | 'wish';
type Scene = { id: SceneId; label: string; word: string; micro: string; title: string; description: string };
type Turn = { from: number; to: number; dir: -1 | 1 };
const scenes: Scene[] = [
  { id: 'cover', label: 'THE BEGINNING', word: 'A LITTLE STORY', micro: 'a gift that unfolds', title: '献给特别的你', description: 'There is something I want to tell you.' },
  { id: 'hello', label: 'CHAPTER ONE', word: 'HELLO', micro: 'the beautiful beginning', title: '遇见，是故事的开头。', description: '在无数平凡的日子里，刚好遇见了你。' },
  { id: 'grow', label: 'CHAPTER TWO', word: 'GROW', micro: 'all the little moments', title: '平凡的日子，也会发光。', description: '有一些瞬间，很小很小，却值得珍藏。' },
  { id: 'wish', label: 'ONE LAST THING', word: 'WISH', micro: 'made especially for you', title: '生日快乐，{name}', description: '{wish}' },
];
const dots = ['#2f3345', '#e87961', '#477f65', '#e4a55d'];

// Screenshot-only deterministic turn poses, e.g. ?pose=0.5.
// No GSAP timer is running in this mode, making frame comparisons reproducible.
const poseParam = new URLSearchParams(window.location.search).get('pose');
const debugPose = poseParam === null ? null : Math.max(0, Math.min(1, Number(poseParam) || 0));
const sceneParam = new URLSearchParams(window.location.search).get('scene');
const requestedScene = scenes.findIndex(scene => scene.id === sceneParam);
const initialScene = debugPose !== null ? 1 : Math.max(0,requestedScene);


/** Three original, file-based scene packages all share one artboard and depth
 * order. Each file remains replaceable by an illustrator without React edits.
 * Decorative display words are fixed art; personalized text remains HTML.
 */
const artLayers = [
  { key: 'background', depth: 0 },
  { key: 'midground', depth: 11 },
  { key: 'lettering', depth: 27 },
  { key: 'characters', depth: 48 },
  { key: 'foreground', depth: 68 },
  { key: 'effects', depth: 78 },
] as const;

const artLabels: Record<'hello'|'grow'|'wish', string> = {
  hello: '在温暖的城镇里，小兔与狐狸打招呼',
  grow: '森林中的小兔爬梯子，狐狸给幼苗浇水',
  wish: '生日派对的小兔与狐狸、礼物和点着蜡烛的蛋糕',
};

function IllustratedArtwork({scene}: {scene: 'hello'|'grow'|'wish'}) {
  return <div className={`art-${scene} layered-scene`} role="img" aria-label={artLabels[scene]}>
    {artLayers.map(layer => <img
      key={layer.key}
      className={`art-layer ${scene}-${layer.key} layer-${layer.key}`}
      src={`/assets/${scene}/${layer.key}.svg`}
      data-depth={layer.depth}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="eager"
    />)}
  </div>;
}

function CoverArtwork() {
  return <div className="cover-art">
    <svg viewBox="0 0 500 740" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect x="16" y="16" width="468" height="708" rx="16" stroke="#b9a79e" strokeWidth="2" opacity=".3" fill="none"/>
      <rect x="29" y="29" width="442" height="682" rx="9" stroke="#b9a79e" strokeWidth="2" strokeDasharray="2 13" opacity=".3" fill="none"/>
      <path d="m91 135 14 42 44 14-44 14-14 42-15-42-42-14 42-14zM394 477l8 24 26 9-26 8-8 26-10-26-24-8 24-9z" fill="#ead6ba"/>
      <path d="M338 105q-25 60 41 100-74 4-75-53t34-47z" fill="#ead8b3"/>
      <g stroke="#d8c6ac" strokeWidth="2" fill="none" opacity=".7"><path d="M82 520q80 90 160 22t182 6"/><path d="M77 592q132-48 233 4t131-4"/></g>
      <g fill="#ead6ba">{Array.from({length:20},(_,i)=><circle key={i} cx={55+(i*59)%392} cy={68+(i*97)%610} r={i%3===0?3:1.7}/>)}</g>
    </svg>
    <div className="cover-writing">
      <span className="cover-top">A SPECIAL EDITION</span>
      <span className="cover-title">A LITTLE<br/><i>story</i></span>
      <span className="cover-rule">✳ — ✳</span>
      <span className="cover-bottom">JUST FOR YOU<br/>EST. 2026</span>
    </div>
  </div>;
}

function SceneCard({scene, name, wish}: {scene:Scene; name:string; wish:string}) {
  const title = scene.title.replace('{name}', name || '你');
  const description = scene.description.replace('{wish}', wish || '愿生活总有惊喜。');
  if(scene.id==='cover') return <div className="cover-holder"><div className="cover-scene"><CoverArtwork/></div></div>;
  return <article className={`scene-card theme-${scene.id}`}>
    <IllustratedArtwork scene={scene.id}/>
    <div className="scene-corner">{scene.label}<span className="mini-star">✳</span></div>
    <div className="scene-micro">{scene.micro}</div>
    <div className="scene-story">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <div className="paper-grain" aria-hidden="true"/>
  </article>;
}

function Arrow({left=false}: {left?:boolean}) {
  return <svg className={left?'hand-arrow is-left':'hand-arrow'} viewBox="0 0 115 52" fill="none" aria-hidden="true">
    <path d="M8 24Q52 8 103 26M82 8q11 6 21 18-15 7-28 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function App() {
  const [active,setActive]=useState(initialScene);
  const [turn,setTurn]=useState<Turn|null>(null);
  const [name,setName]=useState('你');
  const [wish,setWish]=useState('愿所有美好的事情，都在下一页等你。');
  const [editorOpen,setEditorOpen]=useState(false);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const leaf=useRef<HTMLDivElement>(null);
  const skipSettledIntro=useRef(false);
  const startTouch=useRef<number|null>(null);
  const turnRef=useRef<Turn|null>(null);
  turnRef.current=turn;
  const visibleTurn = debugPose === null ? turn : { from: 1, to: 2, dir: 1 as const };

  const navigate=useCallback((dir:-1|1)=>{
    if(turnRef.current) return;
    const to=active+dir;
    if(to<0||to>=scenes.length) return;
    setTurn({from:active,to,dir});
  },[active]);

  useEffect(()=>{
    const m=window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange=()=>setReduced(m.matches);
    m.addEventListener('change',onChange);
    return()=>m.removeEventListener('change',onChange);
  },[]);

  // Choreograph incoming art *during* the turn. Two copies of the incoming
  // scene exist during turnover (static stage and back face). Both must reveal
  // at the same time; otherwise the leaf lands on a complete scene and the
  // separate post-turn intro visibly blinks it out and back in.
  useEffect(()=>{
    if(!turn||!leaf.current)return;
    const el=leaf.current;
    const duration=reduced ? 0.05 : 1.36;
    const incomingLayers=['midground','lettering','characters','foreground'].map(key=>
      Array.from(document.querySelectorAll<HTMLElement>(
        `.still-layer .layer-${key}, .leaf-back .layer-${key}`
      ))
    );
    const allIncoming=incomingLayers.flat();
    const incomingCopy=Array.from(document.querySelectorAll<HTMLElement>(
      '.still-layer .scene-story, .leaf-back .scene-story'
    ));
    if(!reduced){
      gsap.set(allIncoming,{opacity:0,'--entry-y':'20px'});
      gsap.set(incomingCopy,{opacity:0,y:10});
    }
    const timeline=gsap.timeline({
      onComplete:()=>{
        skipSettledIntro.current=true;
        setActive(turn.to);
        setTurn(null);
      }
    });
    timeline.fromTo(el,{rotateY:0,scale:1},{
      rotateY:-180*turn.dir,
      scale:reduced?1:.988,
      duration,
      ease:'power2.inOut',
      onUpdate:()=>{
        const angle=Math.abs(Number(gsap.getProperty(el,'rotationY')))/180;
        el.style.setProperty('--turn-shade',String(Math.sin(Math.PI*angle)*.31));
      }
    },0);
    if(!reduced){
      incomingLayers.forEach((group,i)=>{
        timeline.to(group,{
          opacity:1,'--entry-y':'0px',duration:.40,ease:'power2.out'
        },.40+i*.14);
      });
      timeline.to(incomingCopy,{opacity:1,y:0,duration:.35,ease:'power2.out'},.88);
    }
    return()=>{
      timeline.kill();
      el.style.removeProperty('--turn-shade');
      gsap.set(allIncoming,{clearProps:'opacity,--entry-y'});
      gsap.set(incomingCopy,{clearProps:'opacity,transform'});
    };
  },[turn,reduced]);

  // The independent intro is used only when a chapter opens directly from a
  // URL. A completed page turn has already revealed these same layers above.
  useEffect(()=>{
    if(debugPose!==null||turn||reduced||active===0)return;
    if(skipSettledIntro.current){
      skipSettledIntro.current=false;
      return;
    }
    const card=document.querySelector<HTMLElement>('.still-layer .scene-card');
    if(!card)return;
    const layers=Array.from(card.querySelectorAll<HTMLElement>(
      '.art-layer:not(.layer-background):not(.layer-effects)'
    ));
    const words=card.querySelectorAll<HTMLElement>('.scene-story');
    const timeline=gsap.timeline();
    timeline.fromTo(layers,{opacity:0,'--entry-y':'24px'},{
      opacity:1,'--entry-y':'0px',stagger:.095,duration:.72,ease:'power3.out'
    });
    timeline.fromTo(words,{opacity:0,y:12},{
      opacity:1,y:0,duration:.54,ease:'power2.out'
    },'<0.12');
    return()=>{
      timeline.kill();
      gsap.set(layers,{clearProps:'opacity,--entry-y'});
      gsap.set(words,{clearProps:'opacity,transform'});
    };
  },[active,turn,reduced]);

  const moveParallax=(root:HTMLDivElement,clientX:number,clientY:number)=>{
    const rect=root.getBoundingClientRect();
    const nx=Math.max(-1,Math.min(1,((clientX-rect.left)/rect.width-.5)*2));
    const ny=Math.max(-1,Math.min(1,((clientY-rect.top)/rect.height-.5)*2));
    root.querySelectorAll<HTMLElement>('.still-layer .art-layer:not(.layer-effects)').forEach(node=>{
      const factor=Number(node.dataset.depth||0)/78;
      node.style.setProperty('--hover-x',`${(-nx*14*factor).toFixed(1)}px`);
      node.style.setProperty('--hover-y',`${(-ny*10*factor).toFixed(1)}px`);
    });
  };
  const resetParallax=(root:HTMLDivElement)=>{
    root.querySelectorAll<HTMLElement>('.art-layer').forEach(node=>{
      node.style.removeProperty('--hover-x');
      node.style.removeProperty('--hover-y');
    });
  };


  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement) return;
      if(e.key==='ArrowRight') navigate(1);
      if(e.key==='ArrowLeft') navigate(-1);
      if(e.key==='Escape') setEditorOpen(false);
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[navigate]);

  return <div className="showroom">
    <div className="grain-wash" aria-hidden="true"/>
    <header className="site-head">
      <div className="site-name">little<span>story</span>.studio</div>
      <div className="site-title">A STORY TO UNFOLD<br/>FOR SOMEONE SPECIAL</div>
      <button className="customize-trigger" type="button" onClick={()=>setEditorOpen(true)}>CUSTOMIZE <span>↗</span></button>
    </header>
    <main className="exhibition" onTouchStart={e=>{startTouch.current=e.touches[0]?.clientX??null}} onTouchEnd={e=>{
      if(startTouch.current===null)return;
      const dist=e.changedTouches[0].clientX-startTouch.current;
      startTouch.current=null;
      if(Math.abs(dist)>65)navigate(dist<0?1:-1);
    }}>
      <button type="button" aria-label="上一页" className="turn-button turn-prev" disabled={active===0||!!turn} onClick={()=>navigate(-1)}><Arrow left/></button>
      <div className="exhibition-center"
        onPointerMove={e=>{if(!reduced&&!visibleTurn&&e.pointerType==='mouse')moveParallax(e.currentTarget,e.clientX,e.clientY);}}
        onPointerLeave={e=>resetParallax(e.currentTarget)}>
        <div className="book-perspective" aria-label="3D 互动绘本">
          {visibleTurn ? <>
            <div className="still-layer"><SceneCard scene={scenes[visibleTurn.to]} name={name} wish={wish}/></div>
            <div className="flip-leaf" ref={leaf} style={debugPose === null ? undefined : { transform: `rotateY(${-180 * debugPose}deg)` }}>
              <div className="leaf-face leaf-front"><SceneCard scene={scenes[visibleTurn.from]} name={name} wish={wish}/></div>
              <div className="leaf-face leaf-back"><SceneCard scene={scenes[visibleTurn.to]} name={name} wish={wish}/></div>
            </div>
          </> : <div className="still-layer"><SceneCard scene={scenes[active]} name={name} wish={wish}/></div>}
        </div>
      </div>
      <button type="button" aria-label="下一页" className="turn-button turn-next" disabled={active===scenes.length-1||!!turn} onClick={()=>navigate(1)}><Arrow/></button>
    </main>
    <nav className="page-dots" aria-label="故事进度">
      {scenes.map((scene,index)=><button key={scene.id} type="button" title={scene.label} aria-label={`跳转到第 ${index+1} 页`} aria-current={active===index?'page':undefined}
        className={`page-dot ${active===index?'selected':''}`} style={{'--dot-color':dots[index]} as React.CSSProperties}
        onClick={()=>{if(!turnRef.current&&index!==active)setTurn({from:active,to:index,dir:index>active?1:-1});}}/>)}
    </nav>
    <footer className="site-foot"><span>MADE WITH INTENTION, NOT JUST PIXELS.</span><span>← → &nbsp; FLIP THE STORY &nbsp; · &nbsp; DRAG ON MOBILE</span><span>AN ORIGINAL INTERACTIVE EXPERIMENT</span></footer>
    {editorOpen&&<div className="editor-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setEditorOpen(false)}}>
      <aside className="editor-drawer" aria-label="定制故事内容">
        <button className="drawer-close" type="button" aria-label="关闭定制面板" onClick={()=>setEditorOpen(false)}>×</button>
        <span className="drawer-eyebrow">MAKE IT PERSONAL</span>
        <h2>写下你的故事。</h2>
        <p>这里是最小可定制证明。文字会出现在最后一页，整本书的翻页逻辑不需要修改。</p>
        <label htmlFor="recipient">收礼人的名字</label>
        <input id="recipient" maxLength={12} value={name} onChange={e=>setName(e.target.value)}/>
        <label htmlFor="greeting">最后一页的祝福</label>
        <textarea id="greeting" maxLength={60} rows={4} value={wish} onChange={e=>setWish(e.target.value)}/>
        <button className="drawer-done" type="button" onClick={()=>{setEditorOpen(false);if(active!==3&&!turn)setTurn({from:active,to:3,dir:1});}}>看看最后一页 ↗</button>
        <small>本地预览 · 不会上传个人内容</small>
      </aside>
    </div>}
  </div>;
}
