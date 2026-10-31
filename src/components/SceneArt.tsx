import type { Chapter, ChapterId, StoryMode } from '../data/story';
import { letterSpreadFor } from '../data/letterStory';
import type { PrintedSurface } from './paperPrint';

const planes=['background','midground','lettering','characters','foreground','effects'] as const;

/** Registered 1200×700 transparent sprites; same authored characters.svg
 * remains available for original six-plane Shader Labs and reproducible art.
 * Only HELLO/GROW use articulated actors in stationary book scenes.
 */
const actingScenes: Readonly<Record<ChapterId,readonly string[]>>={
  hello:['rabbit','fox'],
  grow:['rabbit','fox','props'],
  together:['fox','rabbit','props'],
  dream:['rabbit','fox','props'],
  wish:['fox','rabbit','props'],
};


export type PageSide='left'|'right';
type PageHalfProps={chapter:Chapter;side:PageSide;name:string;wish:string;storyMode?:StoryMode;inkOnly?:boolean;printed?:PrintedSurface};

export function PageHalf({chapter,side,name,wish,storyMode='birthday',inkOnly=false,printed}:PageHalfProps){
  const title=chapter.title.replace('{name}',name.trim()||'你');
  const description=chapter.description.replace('{wish}',wish.trim()||'愿所有美好都在下一页等你。');
  return <div className={`page-surface theme-${chapter.id} page-${side}`} data-chapter={chapter.id} data-side={side}>
    <div className="page-window">
      {(!inkOnly||printed)&&<div className="spread-composition" aria-hidden="true">
        {printed?<>
          <img className="paper-art" src={printed.below} alt="" draggable={false}/>
          <img className="scene-plane plane-lettering" src={`${import.meta.env.BASE_URL}assets/${chapter.id}/lettering.svg`} alt="" draggable={false}
            style={{transform:printed.letteringTransform,transformOrigin:printed.letteringOrigin,transition:'none'}}/>
          <img className="paper-art" src={printed.above} alt="" draggable={false}/>
        </>:planes.map((plane,index)=>
          plane==='characters'&&actingScenes[chapter.id]
            ? actingScenes[chapter.id].map(actor=><img
                key={`actor-${actor}`}
                className={`scene-plane scene-actor actor-${actor} acting-${chapter.id}`}
                src={`${import.meta.env.BASE_URL}assets/${chapter.id}/actors/${actor}.svg`}
                data-depth={index} data-actor={actor} alt=""
                draggable={false}
              />)
            : <img
                key={plane} className={`scene-plane plane-${plane}`}
                src={`${import.meta.env.BASE_URL}assets/${chapter.id}/${plane}.svg`}
                data-depth={index} alt="" draggable={false}
              />
        )}
      </div>}
      <div className="page-print-grain" aria-hidden="true"/>
      {storyMode==='letter'?<LetterLeafText id={chapter.id} side={side}/>:<>
      {side==='right'&&<>
        <div className="page-chapter">{chapter.label} <span aria-hidden="true">✳</span></div>
        <div className="page-quote">
          <h2>{title}</h2><p>{description}</p>
        </div>
      </>}
      {side==='left'&&<div className="page-chapter page-chapter-left">{chapter.eyebrow}</div>}
      </>}
    </div>
    <div className="paper-bevel" aria-hidden="true"/>
  </div>;
}

function LetterLeafText({id,side}:{id:ChapterId;side:PageSide}){
  const spread=letterSpreadFor(id);
  const leaf=spread[side];
  return <article className="letter-leaf" data-letter-scene={id} data-letter-side={side}
    aria-label={side==='left'?'左页信件':'右页信件'}>
    <div className="letter-leaf-top">
      <span className="letter-leaf-flower" aria-hidden="true">✦</span>
      <span className="letter-leaf-kicker">{leaf.kicker}</span>
    </div>
    <div className="letter-leaf-body">
      {leaf.lines.map((line,index)=><p className="letter-leaf-line" key={index}>{line}</p>)}
    </div>
    {leaf.signature&&<div className="letter-leaf-signature">— {leaf.signature} ♡</div>}
    <div className="letter-leaf-bottom" aria-hidden="true">
      <span>✧</span><span>{String((['hello','grow','together','dream','wish'] as ChapterId[]).indexOf(id)*2+(side==='left'?1:2)).padStart(2,'0')} / 10</span>
    </div>
  </article>;
}

export function FrontCover({storyMode='birthday'}:{storyMode?:StoryMode}){
  return <div className="book-front-cover v2-cover" aria-label="A LITTLE STORY — 实体书封面">
    <img className="v2-cover-scene" src={import.meta.env.BASE_URL+'assets/v2/cover-art.svg'} alt="" draggable={false}/>
    <div className="v2-cover-frame" aria-hidden="true"/>
    <div className="book-cover-copy">
      <span className="cover-edition">{storyMode==='letter'?'WORDS FROM A FRIEND':'A HANDMADE BIRTHDAY TALE'}</span>
      <span className="cover-main-title">A LITTLE<i>{storyMode==='letter'?'letter':'story'}</i></span>
      <span className="v2-cover-flourish" aria-hidden="true">✦ · ✧ · ✦</span>
      <span className="cover-meta">A BOOK FOR SOMEONE SPECIAL<br/>{storyMode==='letter'?'IN TEN LITTLE PAGES':'ONE STORY, JUST FOR YOU'}</span>
    </div>
    <div className="v2-cover-bottom-note">{storyMode==='letter'?'Some words are worth keeping.':'Some stories begin with hello.'}</div>
    <div className="cover-hinge" aria-hidden="true"/>
  </div>;
}

export function BlankPage(){
  return <div className="page-surface page-blank" aria-hidden="true"><div className="page-window"/></div>;
}

