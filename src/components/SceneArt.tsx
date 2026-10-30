import type { Chapter, ChapterId } from '../data/story';
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
type PageHalfProps={chapter:Chapter;side:PageSide;name:string;wish:string;inkOnly?:boolean;printed?:PrintedSurface};

export function PageHalf({chapter,side,name,wish,inkOnly=false,printed}:PageHalfProps){
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
      {side==='right'&&<>
        <div className="page-chapter">{chapter.label} <span aria-hidden="true">✳</span></div>
        <div className="page-quote">
          <h2>{title}</h2><p>{description}</p>
        </div>
      </>}
      {side==='left'&&<div className="page-chapter page-chapter-left">{chapter.eyebrow}</div>}
    </div>
    <div className="paper-bevel" aria-hidden="true"/>
  </div>;
}

export function FrontCover(){
  return <div className="book-front-cover" aria-label="A LITTLE STORY — 立体故事书封面">
    <div className="cover-border" aria-hidden="true"/>
    <div className="cover-decoration" aria-hidden="true">
      <span className="cover-moon">☾</span>
      <span className="cover-star-one">✦</span>
      <span className="cover-star-two">✧</span>
      <span className="cover-swirls">﹏﹏﹏</span>
    </div>
    <div className="book-cover-copy">
      <span className="cover-edition">AN ILLUSTRATED EDITION</span>
      <span className="cover-main-title">A LITTLE<i>story</i></span>
      <span className="cover-separator">✳ &nbsp; — &nbsp; ✳</span>
      <span className="cover-meta">A BOOK FOR SOMEONE SPECIAL<br/>EST. 2026</span>
    </div>
    <div className="cover-hinge" aria-hidden="true"/>
  </div>;
}

export function BlankPage(){
  return <div className="page-surface page-blank" aria-hidden="true"><div className="page-window"/></div>;
}

