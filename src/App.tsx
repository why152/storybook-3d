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


function Bunny({ dark = false }: { dark?: boolean }) {
  const main = dark ? '#24483d' : '#f3d5ab';
  const shade = dark ? '#1c372f' : '#d49a85';
  return <g className="bunny-illustration">
    <path d="M90 184 C68 143 65 72 80 55 C102 40 113 91 117 141 C119 81 139 47 160 60 C180 75 163 147 146 184" fill={main} stroke={shade} strokeWidth="6" strokeLinejoin="round"/>
    <ellipse cx="114" cy="242" rx="76" ry="94" fill={main}/>
    <ellipse cx="115" cy="166" rx="67" ry="61" fill={main}/>
    <circle cx="93" cy="161" r="6" fill="#463737"/>
    <circle cx="138" cy="161" r="6" fill="#463737"/>
    <ellipse cx="116" cy="185" rx="9" ry="7" fill="#bb7f77"/>
    <circle cx="62" cy="186" r="13" fill="#ebbaa6" opacity=".8"/>
    <circle cx="160" cy="186" r="13" fill="#ebbaa6" opacity=".8"/>
    <ellipse cx="54" cy="325" rx="29" ry="16" fill={main}/>
    <ellipse cx="164" cy="325" rx="29" ry="16" fill={main}/>
    <circle cx="177" cy="279" r="25" fill={main}/>
    <path d="M112 196 Q115 208 122 199" stroke="#9d5d61" strokeWidth="4" fill="none" strokeLinecap="round"/>
  </g>;
}

/** Every HELLO layer is a separately editable and replaceable SVG file.
 * Each shares the same 1200×700 coordinate system and has independently
 * configured page-local depth, so the 3D turnover creates real parallax.
 */
const helloLayers = [
  { key: 'background', className: 'hello-background', alt: '' },
  { key: 'midground', className: 'hello-midground', alt: '' },
  { key: 'lettering', className: 'hello-lettering', alt: '' },
  { key: 'characters', className: 'hello-characters', alt: '' },
  { key: 'foreground', className: 'hello-foreground', alt: '' },
  { key: 'effects', className: 'hello-effects', alt: '' },
] as const;

function HelloArtwork() {
  return <div className="art-hello layered-scene" aria-label="精致的插画城镇中，一只小兔与小狐狸向彼此问好">
    {helloLayers.map(layer => <img
      className={`art-layer ${layer.className}`}
      key={layer.key}
      src={`/assets/hello/${layer.key}.svg`}
      alt={layer.alt}
      draggable={false}
      loading="eager"
    />)}
  </div>;
}

function GrowArtwork() {
  return <div className="art-grow">
    <svg className="illustration illustration-back" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M0 0h500v700H0z" fill="#619b73" opacity=".6"/>
      <path d="M500 0h335v700H500z" fill="#275a4c" opacity=".7"/>
      <path d="M835 0h365v700H835z" fill="#8cb183" opacity=".4"/>
      <path d="M-40 -50Q160 330 470 100T1260 130" stroke="#214f42" strokeWidth="76" fill="none" opacity=".8"/>
      <path d="M1200 -20Q960 200 1100 460" stroke="#163e38" strokeWidth="40" fill="none"/>
      <circle cx="828" cy="136" r="31" fill="#c4d7a3" opacity=".9"/>
      <path d="M0 631Q220 505 440 620T930 618T1220 560V700H0" fill="#39735a"/>
      <path d="M40 640v-45m0 12-22-20m22 8 24-23m37 80v-45m0 14-15-20m15 17 14-24M980 656v-66m0 15-28-24m28 9 24-26" stroke="#1e5b49" strokeWidth="7"/>
    </svg>
    <div className="type-layer grow-type">GROW</div>
    <svg className="illustration illustration-front" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g transform="translate(258,225) scale(.7)"><Bunny dark/></g>
      <g transform="translate(410,378) scale(.53)"><Bunny/></g>
      <path d="M417 695 557 330m-100 365 140-365M474 633h101m-89-53h106m-86-53h103m-80-51h99m-78-50h97m-80-50h96" stroke="#1c453c" strokeWidth="13" fill="none" strokeLinecap="round"/>
      <g className="flying-stars" fill="#cae2b0"><path d="M874 143q63 8 63 65-50 11-63-65m0 0q-40 51-5 91 50-42 5-91"/><path d="M972 240q70-6 75 44-59 24-75-44m0 0q-37 51 8 88 35-48-8-88"/></g>
    </svg>
  </div>;
}

function WishArtwork() {
  return <div className="art-wish">
    <svg className="illustration illustration-back" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1200" height="700" fill="#f4bb8a" opacity=".25"/>
      <circle cx="220" cy="112" r="89" fill="#f5ce9d" opacity=".48"/>
      <path d="M0 570Q270 505 580 572T1200 544V700H0" fill="#f3bc90"/>
      {Array.from({length:19},(_,i)=><circle key={i} cx={55+i*61} cy={79+(i%3)*37} r={4+(i%4)*2} fill="#f4d49f"/>)}
      <path d="M40 60q170 100 360 0T800 60T1180 60" fill="none" stroke="#bb786c" strokeWidth="6" strokeDasharray="5 18"/>
    </svg>
    <div className="type-layer wish-type">WISH</div>
    <svg className="illustration illustration-front" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <ellipse cx="460" cy="636" rx="302" ry="36" fill="#ae6c63" opacity=".5"/>
      <rect x="255" y="485" width="430" height="140" rx="29" fill="#f9ebcc" stroke="#bd766f" strokeWidth="7"/>
      <rect x="289" y="397" width="359" height="122" rx="30" fill="#fff3d6" stroke="#d38d7d" strokeWidth="7"/>
      <path d="M296 449Q330 475 360 452T418 452T482 452T543 452T607 453T648 452" stroke="#dc9d92" strokeWidth="26" fill="none" strokeLinecap="round"/>
      <rect x="353" y="340" width="18" height="63" rx="6" fill="#c76b71"/>
      <rect x="457" y="340" width="18" height="63" rx="6" fill="#c76b71"/>
      <rect x="555" y="340" width="18" height="63" rx="6" fill="#c76b71"/>
      <g className="candle-flame" fill="#fff5b3"><path d="M361 330q-25-22 0-46 26 24 0 46M466 330q-25-22 0-46 26 24 0 46M564 330q-25-22 0-46 26 24 0 46"/></g>
      <g transform="translate(761,344) scale(.53)"><Bunny/></g>
      <g className="flying-stars" fill="#fff6d6"><path d="m155 358 14 38 39 14-39 13-14 38-13-38-40-13 40-14zM965 180l9 27 27 9-27 10-9 27-10-27-27-10 27-9z"/></g>
      <g fill="#b6676f"><rect x="87" y="495" width="25" height="13" rx="4" transform="rotate(-30 87 495)"/><rect x="950" y="475" width="18" height="12" rx="4" transform="rotate(21 950 475)"/><rect x="840" y="123" width="24" height="9" rx="4" transform="rotate(33 840 123)"/></g>
    </svg>
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
    {scene.id==='hello' ? <HelloArtwork/> : scene.id==='grow' ? <GrowArtwork/> : <WishArtwork/>}
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
  const [active,setActive]=useState(debugPose === null ? 0 : 1);
  const [turn,setTurn]=useState<Turn|null>(null);
  const [name,setName]=useState('你');
  const [wish,setWish]=useState('愿所有美好的事情，都在下一页等你。');
  const [editorOpen,setEditorOpen]=useState(false);
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const leaf=useRef<HTMLDivElement>(null);
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

  useEffect(()=>{
    if(!turn||!leaf.current) return;
    const el=leaf.current;
    const duration=reduced?0.05:1.36;
    const tween=gsap.fromTo(el,{rotateY:0,scale:1},{rotateY:-180*turn.dir,scale:0.99,duration,ease:'power2.inOut',onComplete:()=>{setActive(turn.to);setTurn(null);}});
    return()=>{tween.kill();};
  },[turn,reduced]);

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
      <div className="exhibition-center">
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
