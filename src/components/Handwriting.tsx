import type {ChapterId} from '../data/story';
import {handwritingFor} from '../data/handwriting';

export function HandwritingOnPage({chapter,side}:{chapter:ChapterId;side:'left'|'right'}){
  return <div className="handwriting-on-page" data-handwriting-side={side}>
    {handwritingFor(chapter,side).map(fragment=><div className="handwriting-fragment" key={fragment.id}
      data-ink-id={fragment.id} style={{left:fragment.left+'%',top:fragment.top+'%',width:fragment.width+'%'}}>
      <img className="handwriting-image" src={fragment.src} alt={fragment.alt} draggable={false}/>
    </div>)}
  </div>;
}

/** Small physical pages keep the illustration. This optional reader gives
 * phone users the same original pixels at a legible width without retyping. */
export function HandwritingReader({chapter}:{chapter:ChapterId}){
  return <details className="handwriting-reader" key={chapter}>
    <summary>放大看这一页的手写原迹 <span aria-hidden="true">↗</span></summary>
    <div className="handwriting-reader-images">
      {handwritingFor(chapter).map(fragment=><img key={fragment.id} src={fragment.src}
        alt={fragment.alt} draggable={false} data-compact={fragment.width<35?'true':undefined}/>)}
    </div>
  </details>;
}
