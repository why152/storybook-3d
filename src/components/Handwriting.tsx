import type {ChapterId} from '../data/story';
import {handwritingFor} from '../data/handwriting';

export function HandwritingOnPage({chapter,side}:{chapter:ChapterId;side:'left'|'right'}){
  const fragments=handwritingFor(chapter,side);
  return <div className={`handwriting-on-page ${fragments.some(fragment=>!fragment.transparent)?'is-photograph':''}`} data-handwriting-side={side}>
    {fragments.map(fragment=><div className="handwriting-fragment" key={fragment.id}
      data-ink-id={fragment.id} style={{left:fragment.left+'%',top:fragment.top+'%',width:fragment.width+'%'}}>
      <img className="handwriting-image" src={fragment.src} alt={fragment.alt} draggable={false}/>
    </div>)}
  </div>;
}
