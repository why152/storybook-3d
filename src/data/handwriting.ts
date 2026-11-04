import privateFragments from 'virtual:storybook-handwriting';
import type { ChapterId } from './story';
import {publishedHandwriting} from './publishedHandwriting';
import type {HandwritingFragment} from './handwritingTypes';

const fragments:readonly HandwritingFragment[]=privateFragments.length?privateFragments:
  publishedHandwriting.map(fragment=>({...fragment,transparent:true}));

export const hasHandwriting=fragments.length>0;
export function handwritingFor(chapter:ChapterId,side?:'left'|'right'){
  return fragments.filter(fragment=>fragment.chapter===chapter&&(!side||fragment.side===side));
}
