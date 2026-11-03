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
