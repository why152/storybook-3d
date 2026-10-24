import { useCallback, useEffect, useRef, useState } from 'react';
import { Book, type PageTurn } from './components/Book';
import { chapters, getChapter, initialPosition, previewFrom, previewPose, totalPositions } from './data/story';
import './styles.css';

const debugPose=previewPose();
const debugFrom=previewFrom();

function Arrow({back=false}:{back?:boolean}){
  return <svg aria-hidden="true" viewBox="0 0 115 52" className={`hand-arrow ${back?'is-back':''}`} fill="none">
    <path d="M8 24Q52 8 103 26M82 8q11 6 21 18-15 7-28 18"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function App(){
  const [active,setActive]=useState(initialPosition);
  const [turn,setTurn]=useState<PageTurn|null>(null);
  const [name,setName]=useState('你');
  const [wish,setWish]=useState('愿所有美好的事情，都在下一页等你。');
  const [editorOpen,setEditorOpen]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(()=>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const startTouch=useRef<number|null>(null);

  const goTo=useCallback((position:number)=>{
    if(turn||debugPose!==null||position===active||position<0||position>=totalPositions)return;
    setTurn({from:active,to:position,direction:position>active?1:-1});
  },[turn,active]);
  const onTurnFinished=useCallback((position:number)=>{
    setActive(position);
    setTurn(null);
  },[]);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn=()=>setReducedMotion(media.matches);
    media.addEventListener('change',fn);
    return()=>media.removeEventListener('change',fn);
  },[]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape')setEditorOpen(false);
      if(event.target instanceof HTMLInputElement||
         event.target instanceof HTMLTextAreaElement||event.altKey||event.metaKey)return;
      if(event.key==='ArrowRight'){event.preventDefault();goTo(active+1);}
      if(event.key==='ArrowLeft'){event.preventDefault();goTo(active-1);}
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[active,goTo]);

  const currentIndex=debugPose===null?active:debugFrom;
  const shownChapter=currentIndex>0?getChapter(currentIndex):null;

  return <div className="showroom">
    <header className="site-head">
      <div className="site-name">little<span>story</span>.studio</div>
      <div className="site-title">A LITTLE STORY<br/>FOR SOMEONE SPECIAL</div>
      <button type="button" className="customize-trigger" onClick={()=>setEditorOpen(true)}>
        CUSTOMIZE <span aria-hidden="true">↗</span>
      </button>
    </header>
    <main className="exhibition"
      onTouchStart={e=>{startTouch.current=e.touches[0]?.clientX??null}}
      onTouchEnd={e=>{
        if(startTouch.current===null)return;
        const moved=e.changedTouches[0].clientX-startTouch.current;
        startTouch.current=null;
        if(Math.abs(moved)>65)goTo(active+(moved<0?1:-1));
      }}>
      <button type="button" aria-label="上一页" title="向左翻书"
        className="turn-button turn-prev"
        disabled={active===0||!!turn||debugPose!==null}
        onClick={()=>goTo(active-1)}><Arrow back/></button>
      <Book active={active} turning={turn} onTurnFinished={onTurnFinished}
        name={name} wish={wish} reducedMotion={reducedMotion}
        debugPose={debugPose} debugFrom={debugFrom}/>
      <button type="button" aria-label="下一页" title="向右翻书"
        className="turn-button turn-next"
        disabled={active===totalPositions-1||!!turn||debugPose!==null}
        onClick={()=>goTo(active+1)}><Arrow/></button>
    </main>
    <div className="page-navigation">
      <div className="chapter-current">
        {shownChapter? <><span>{shownChapter.label}</span><strong>{shownChapter.word}</strong></>:
          <><span>THE BEGINNING</span><strong>THE COVER</strong></>}
      </div>
      <nav className="page-dots" aria-label="故事进度">
        {Array.from({length:totalPositions},(_,index)=>{
          const chapter=index?getChapter(index):null;
          return <button key={index} type="button"
            aria-label={index===0?'查看封面':`查看第 ${index} 个故事跨页`}
            aria-current={active===index?'page':undefined}
            title={chapter?.word??'COVER'}
            className={`page-dot ${active===index?'selected':''}`}
            style={{'--dot-color':chapter?.accent??'#343D54'} as React.CSSProperties}
            disabled={!!turn||debugPose!==null}
            onClick={()=>goTo(index)}/>;
        })}
      </nav>
      <div className="page-count">{String(currentIndex).padStart(2,'0')} / 05</div>
    </div>
    <footer className="site-foot">
      <span>AN ORIGINAL INTERACTIVE BOOK</span>
      <span>← → &nbsp; TURN THE PAGES &nbsp; · &nbsp; SWIPE ON MOBILE</span>
      <span>MADE WITH CARE · 2026</span>
    </footer>

    {editorOpen&&<div className="editor-backdrop" role="presentation"
      onMouseDown={e=>{if(e.target===e.currentTarget)setEditorOpen(false)}}>
      <aside className="editor-drawer" aria-label="定制故事内容">
        <button type="button" aria-label="关闭定制面板" className="drawer-close"
          onClick={()=>setEditorOpen(false)}>×</button>
        <div className="drawer-eyebrow">MAKE IT PERSONAL</div>
        <h2>写下你的故事。</h2>
        <p>调整名字与祝福，最后一章会立即使用这些内容。五个插画跨页和实体书翻页动作保持不变。</p>
        <label htmlFor="recipient">收礼人的名字</label>
        <input id="recipient" value={name} maxLength={12}
          onChange={e=>setName(e.target.value)}/>
        <label htmlFor="greeting">最后一页的祝福</label>
        <textarea id="greeting" value={wish} maxLength={60} rows={4}
          onChange={e=>setWish(e.target.value)}/>
        <button type="button" className="drawer-done" onClick={()=>{
          setEditorOpen(false);goTo(totalPositions-1);
        }}>看看最后一章 ↗</button>
        <small>仅在此页面预览，不上传任何个人内容</small>
      </aside>
    </div>}
  </div>;
}
