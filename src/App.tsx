import { useCallback, useEffect, useRef, useState } from 'react';
import { Book, type PageTurn } from './components/Book';
import { getChapter, initialPosition, previewFrom, previewPose, totalPositions, type StoryMode } from './data/story';
import { DEFAULT_GREETING, greetingFromHash, makeShareLink } from './data/share';
import { letterSpreads } from './data/letterStory';
import './styles.css';
import './styles.v2.css';

const debugPose=previewPose();
const debugFrom=previewFrom();
const sharedGreeting=greetingFromHash(window.location.hash);
const storyMode:StoryMode=new URLSearchParams(window.location.search).get('story')==='letter'?'letter':'birthday';

function Arrow({back=false}:{back?:boolean}){
  return <svg aria-hidden="true" viewBox="0 0 115 52" className={`hand-arrow ${back?'is-back':''}`} fill="none">
    <path d="M8 24Q52 8 103 26M82 8q11 6 21 18-15 7-28 18"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function App(){
  const [active,setActive]=useState(initialPosition);
  const [turn,setTurn]=useState<PageTurn|null>(null);
  const [target,setTarget]=useState<number|null>(null);
  const [name,setName]=useState(sharedGreeting?.name??DEFAULT_GREETING.name);
  const [wish,setWish]=useState(sharedGreeting?.wish??DEFAULT_GREETING.wish);
  const [copyStatus,setCopyStatus]=useState('');
  const [editorOpen,setEditorOpen]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(()=>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    // Navigating to another #gift URL on the same path does not remount React.
    // Reload that document to restore the new greeting and restart at the cover.
    // Also handles unsupported/corrupt gift fragments with safe defaults.
    const onGiftNavigation=()=>{
      if(window.location.hash.startsWith('#gift='))window.location.reload();
    };
    window.addEventListener('hashchange',onGiftNavigation);
    return()=>window.removeEventListener('hashchange',onGiftNavigation);
  },[]);
  const customizeTrigger=useRef<HTMLButtonElement>(null);
  const closeEditor=useCallback(()=>{
    setEditorOpen(false);
    customizeTrigger.current?.focus();
  },[]);
  useEffect(()=>{
    if(editorOpen)document.getElementById('recipient')?.focus();
  },[editorOpen]);

  const goTo=useCallback((position:number)=>{
    if(turn||debugPose!==null||position===active||position<0||position>=totalPositions)return;
    // Bookmarks are not portals: visiting a distant chapter turns through
    // intervening sheets, one physical leaf at a time.
    setTarget(position);
    const next=active+(position>active?1:-1);
    setTurn({from:active,to:next,direction:next>active?1:-1});
  },[turn,active]);
  const grabTurn=useCallback((direction:-1|1)=>{
    if(turn||editorOpen||debugPose!==null||active+direction<0||active+direction>=totalPositions)return false;
    setTarget(null);
    setTurn({from:active,to:active+direction,direction,interactive:true});
    return true;
  },[turn,editorOpen,active]);
  useEffect(()=>{
    if(turn||target===null)return;
    if(active===target){setTarget(null);return;}
    const next=active+(target>active?1:-1);
    setTurn({from:active,to:next,direction:next>active?1:-1});
  },[active,turn,target]);
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
      if(event.key==='Escape'&&editorOpen){closeEditor();return;}
      // Reading/editing a greeting in a modal must not also turn the book.
      if(editorOpen)return;
      if(event.target instanceof HTMLInputElement||
         event.target instanceof HTMLTextAreaElement||event.altKey||event.metaKey)return;
      if(event.key==='ArrowRight'){event.preventDefault();goTo(active+1);}
      if(event.key==='ArrowLeft'){event.preventDefault();goTo(active-1);}
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[active,goTo,editorOpen,closeEditor]);

  const currentIndex=debugPose===null?active:debugFrom;
  const shownChapter=currentIndex>0?getChapter(currentIndex,storyMode):null;
  const readableTitle=shownChapter?.title.replace('{name}',name.trim()||'你');
  const readableMessage=shownChapter?.description.replace(
    '{wish}',wish.trim()||DEFAULT_GREETING.wish
  );
  const shareLink=makeShareLink({name,wish},window.location);
  const copyShareLink=async()=>{
    try{
      await navigator.clipboard.writeText(shareLink);
      setCopyStatus('专属链接已复制，可以发给朋友了。');
    }catch{
      setCopyStatus('自动复制不可用，请点按上方链接框全选后手动复制。');
    }
  };

  return <div className={`showroom v2-showroom ${storyMode==='letter'?'v2-letter-edition':''}`}>
    <header className="site-head">
      <div className="site-name">little<span>story</span>.studio</div>
      <div className="site-title">A LITTLE STORY<br/>FOR SOMEONE SPECIAL</div>
      {storyMode==='letter'
        ? <a className="customize-trigger letter-variant-trigger" href={window.location.pathname}>BIRTHDAY EDITION ↗</a>
        : <button ref={customizeTrigger} type="button" className="customize-trigger" disabled={!!turn} onClick={()=>setEditorOpen(true)}>
          CUSTOMIZE <span aria-hidden="true">↗</span>
        </button>}
    </header>
    <main className="exhibition">
      <button type="button" aria-label="上一页" title="向左翻书"
        className="turn-button turn-prev"
        disabled={active===0||!!turn||debugPose!==null}
        onClick={()=>goTo(active-1)}><Arrow back/></button>
      <Book active={active} turning={turn} onTurnFinished={onTurnFinished} onGrabTurn={grabTurn}
        name={name} wish={wish} storyMode={storyMode} reducedMotion={reducedMotion}
        debugPose={debugPose} debugFrom={debugFrom}/>
      <button type="button" aria-label="下一页" title="向右翻书"
        className="turn-button turn-next"
        disabled={active===totalPositions-1||!!turn||debugPose!==null}
        onClick={()=>goTo(active+1)}><Arrow/></button>
    </main>
    <section className="chapter-reader" aria-label="故事朗读文字" aria-live="polite">
      {shownChapter
        ? <>
          <div className="reader-meta">{shownChapter.label} · {shownChapter.word}</div>
          <h2>{readableTitle}</h2>
          {storyMode==='letter'?<div className="reader-letter-transcript" aria-label="本跨页的完整信件文字">
            {letterSpreads[currentIndex-1].left.lines.slice(1).map((line,i)=><p key={`left-${i}`}>{line}</p>)}
            {letterSpreads[currentIndex-1].right.lines.map((line,i)=><p key={`right-${i}`}>{line}</p>)}
            {letterSpreads[currentIndex-1].right.signature&&<p>— {letterSpreads[currentIndex-1].right.signature}</p>}
          </div>:<p>{readableMessage}</p>}
        </>
        : <>
          <div className="reader-meta">THE BEGINNING</div>
          <h2>{storyMode==='letter'?'有一封信，想慢慢读给你听':'一本为特别的你准备的小书'}</h2>
          <p>用手指或鼠标按住纸页拖动，或点击右侧箭头翻开故事。</p>
        </>}
    </section>
    <div className="page-navigation">
      <div className="chapter-current">
        {shownChapter? <><span>{shownChapter.label}</span><strong>{shownChapter.word}</strong></>:
          <><span>THE BEGINNING</span><strong>THE COVER</strong></>}
      </div>
      <nav className="page-dots" aria-label="故事进度">
        {Array.from({length:totalPositions},(_,index)=>{
          const chapter=index?getChapter(index,storyMode):null;
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
      <span>← → &nbsp; HOLD &amp; DRAG PAPER &nbsp; · &nbsp; RELEASE TO SETTLE</span>
      <span>{storyMode==='letter'?'A LETTER · TOKIRINN':<a className="letter-edition-link" href={window.location.pathname+'?story=letter'}>READ THE OTHER LETTER ↗</a>}</span>
    </footer>

    {editorOpen&&storyMode==='birthday'&&<div className="editor-backdrop" role="presentation"
      onMouseDown={e=>{if(e.target===e.currentTarget)closeEditor()}}>
      <aside className="editor-drawer" role="dialog" aria-modal="true" aria-labelledby="editor-heading"
        onKeyDown={event=>{
          if(event.key!=='Tab')return;
          const focusable=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')];
          const first=focusable[0],last=focusable[focusable.length-1];
          if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
          if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
        }}>
        <button type="button" aria-label="关闭定制面板" className="drawer-close"
          onClick={closeEditor}>×</button>
        <div className="drawer-eyebrow">MAKE IT PERSONAL</div>
        <h2 id="editor-heading">写下你的故事。</h2>
        <p>调整名字与祝福，最后一章会立即使用这些内容。五个插画跨页和实体书翻页动作保持不变。</p>
        <label htmlFor="recipient">收礼人的名字</label>
        <input id="recipient" value={name} maxLength={12}
          onChange={e=>{setName(e.target.value);setCopyStatus('');}}/>
        <label htmlFor="greeting">最后一页的祝福</label>
        <textarea id="greeting" value={wish} maxLength={60} rows={4}
          onChange={e=>{setWish(e.target.value);setCopyStatus('');}}/>
        <label htmlFor="share-link">专属绘本链接</label>
        <input id="share-link" value={shareLink} readOnly
          onFocus={e=>e.currentTarget.select()}/>
        <button type="button" className="drawer-share" onClick={copyShareLink}>
          复制专属链接 ↗
        </button>
        <span className="share-status" role="status" aria-live="polite">{copyStatus}</span>
        <button type="button" className="drawer-done" onClick={()=>{
          closeEditor();goTo(totalPositions-1);
        }}>看看最后一章 ↗</button>
        <small>链接把姓名和祝福保存在网址中，不需要账户或上传到后台。拿到链接的人可以读到其中的内容。</small>
      </aside>
    </div>}
  </div>;
}
