import type { ChapterId } from './story';
import {letterSpreads} from './demoLetter';

export type LetterLeaf=Readonly<{
  kicker:string;
  lines:readonly string[];
  signature?:string;
  photo?:Readonly<{src:string;alt:string}>;
}>;
export type LetterSpread=Readonly<{id:ChapterId;word?:string;left:LetterLeaf;right:LetterLeaf}>;
export {letterSpreads};
export {demoRunningHead, LETTER_SOURCE} from './demoLetter';

export function letterSpreadFor(id:ChapterId):LetterSpread{
  const found=letterSpreads.find(spread=>spread.id===id);
  if(!found)throw new Error('Unknown letter chapter '+id);
  return found;
}
