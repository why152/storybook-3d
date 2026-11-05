import type { Chapter, ChapterId, StoryMode } from '../data/story';
import { demoRunningHead, letterSpreadFor } from '../data/letterStory';
import type { LayeredPrint } from './paperPrint';
import { hasHandwriting } from '../data/handwriting';
import { HandwritingOnPage } from './Handwriting';
import {actingScenes, coverArt, planes} from '../data/bookArt';
import template from 'virtual:storybook-template';

export type PageSide='left'|'right';
type PageHalfProps={chapter:Chapter;side:PageSide;name:string;wish:string;storyMode?:StoryMode;printed?:LayeredPrint};

export function PageHalf({chapter,side,name,wish,storyMode='birthday',printed}:PageHalfProps){
  const title=chapter.title.replace('{name}',name.trim()||'你');
  const description=chapter.description.replace('{wish}',wish.trim()||'愿所有美好都在下一页等你。');
  const letterPage=storyMode==='letter'&&(hasHandwriting||!!template);
  const letterOpening=letterPage&&!template&&chapter.id==='hello';
  return <div className={`page-surface theme-${chapter.id} page-${side} ${letterPage?'letter-page':''} ${letterOpening?'letter-opening':''}`} data-chapter={chapter.id} data-side={side}>
    <div className="page-window">
      <div className="spread-composition" aria-hidden="true">
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
      </div>
      <div className="page-print-grain" aria-hidden="true"/>
      {letterOpening&&<div className="letter-running-head" aria-hidden="true">
        <span>{demoRunningHead[side]}</span><span>{side==='left'?'01':'02'}</span>
      </div>}
      {storyMode==='letter'?(template?<TemplateLeaf id={chapter.id} side={side}/>:hasHandwriting
        ?<HandwritingOnPage chapter={chapter.id} side={side}/>
        :<LetterLeafText id={chapter.id} side={side}/>):<>
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

function TemplateLeaf({id,side}:{id:ChapterId;side:PageSide}){
  const {kicker,lines,signature,photo}=letterSpreadFor(id)[side];
  return <>
    <article className="template-letter" aria-label={side==='left'?'左页信件':'右页信件'}>
      <h3 data-print-text>{kicker}</h3>
      {lines.map((line,index)=><p data-print-text key={index}>{line}</p>)}
      {signature&&<p className="template-signature" data-print-text>— {signature}</p>}
    </article>
    {photo&&<img className="template-photo" src={photo.src} alt={photo.alt} draggable={false}/>}
  </>;
}

export function FrontCover({storyMode='birthday'}:{storyMode?:StoryMode}){
  const letter=storyMode==='letter';
  return <div className={`book-front-cover v2-cover ${template?'template-cover':''}`} aria-label={template?`${template.title} · 封面`:letter?'一封来信 · 封面':'生日绘本 · 封面'}>
    <img className="v2-cover-scene" src={import.meta.env.BASE_URL+(template?.cover??coverArt)} alt="" draggable={false}/>
    <div className="v2-cover-frame" aria-hidden="true"/>
    <div className="book-cover-copy">
      <span className="cover-edition">{template?.subtitle??(letter?'给朋友的一本小书':'一份亲手翻开的礼物')}</span>
      <span className="cover-main-title">{template?.title??(letter?<>一封<i>来信</i></>:<>生日<i>绘本</i></>)}</span>
      <span className="v2-cover-flourish" aria-hidden="true">✦ · ✧ · ✦</span>
    </div>
    <div className="v2-cover-bottom-note">{template?template.author+' 著':letter?'有些话，值得留在纸上。':'有些故事，从一句你好开始。'}</div>
    <div className="cover-hinge" aria-hidden="true"/>
  </div>;
}

export function BlankPage(){
  return <div className="page-surface page-blank" aria-hidden="true"><div className="page-window"/></div>;
}

