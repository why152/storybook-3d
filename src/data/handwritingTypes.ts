import type { ChapterId } from './story';

export type HandwritingFragment=Readonly<{
  id:string;
  chapter:ChapterId;
  side:'left'|'right';
  src:string;
  transparent?:true;
  left:number;
  top:number;
  width:number;
  alt:string;
  order:number;
}>;
