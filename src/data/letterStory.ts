import type { Chapter, ChapterId } from './story';

/**
 * Source: Tokirinn's NON-BIRTHDAY handwritten letter in the older private
 * envelope-mvp project, reference/4569.mp4. The separate 4568.mp4 is a birthday
 * greeting and is deliberately NOT used.
 *
 * Text is curated from visually legible phrases; omitted uncertain passages
 * are not invented. The writer's original signature belongs to the writer.
 * The five spreads below provide ten ACTUAL paper leaves, left before right.
 */
type LetterLeaf=Readonly<{kicker:string;lines:readonly string[];signature?:string}>;
type LetterSpread=Readonly<{id:ChapterId;accent:string;left:LetterLeaf;right:LetterLeaf}>;
export const letterSpreads:readonly LetterSpread[]=[
  {id:'hello',accent:'#E79073',
    left:{kicker:'THE BEGINNING',lines:['见字如面，展信舒颜！']},
    right:{kicker:'A LETTER FOR YOU',lines:[
      '当你读到这封信的时候，',
      '我在你们世界会不会',
      '多停留一封信的时间 ^^',
    ]}},
  {id:'grow',accent:'#78A48B',
    left:{kicker:'HOW ARE YOU?',lines:['最近过得好吗？']},
    right:{kicker:'A LITTLE JOY',lines:['也非常开心你能喜欢听我唱歌！']}},
  {id:'together',accent:'#D39B74',
    left:{kicker:'REMEMBERED',lines:[
      '其实没想到姐姐你能记住我的。',
      '嘿嘿，',
    ]},
    right:{kicker:'TOGETHER',lines:[
      '我能成为你生活中快乐的一部分，',
      '真是太好啦！',
    ]}},
  {id:'dream',accent:'#869CC3',
    left:{kicker:'A SOFT WISH',lines:[
      '愿你在平凡的日子里，',
      '也能遇见温柔的风，',
    ]},
    right:{kicker:'LITTLE BEAUTIFUL THINGS',lines:[
      '明亮的时光，',
      '和不期而遇的欢喜。',
    ]}},
  {id:'wish',accent:'#DD9B99',
    left:{kicker:'WITH WARMTH',lines:['希望我的歌声可以为你带来温暖。']},
    right:{kicker:'UNTIL NEXT TIME',lines:[
      '今后也请姐姐多多关照啦 ♡',
    ],signature:'Tokirinn'}},
] as const;

export function letterSpreadFor(id:ChapterId):LetterSpread{
  const found=letterSpreads.find(spread=>spread.id===id);
  if(!found)throw new Error('Unknown letter chapter '+id);
  return found;
}
export const letterChapters:readonly Chapter[]=letterSpreads.map((spread,index)=>({
  id:spread.id,label:'LETTER '+String(index+1).padStart(2,'0'),
  word:spread.id.toUpperCase(),eyebrow:spread.left.kicker.toLowerCase(),
  title:spread.left.lines.join(''),description:spread.right.lines.join(''),
  accent:spread.accent,
}));

export const LETTER_SOURCE={
  project:'why152/envelope-mvp',video:'4569.mp4',
  originalAuthor:'Tokirinn',date:'2026-10-12',
  mode:'selected verbatim legible passages across ten physical paper leaves',
} as const;
