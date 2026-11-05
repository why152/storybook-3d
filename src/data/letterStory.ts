import type { ChapterId } from './story';

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
type LetterSpread=Readonly<{id:ChapterId;left:LetterLeaf;right:LetterLeaf}>;
export const letterSpreads:readonly LetterSpread[]=[
  {id:'hello',
    left:{kicker:'展信',lines:['见字如面，展信舒颜！']},
    right:{kicker:'写给你',lines:[
      '当你读到这封信的时候，',
      '我在你们世界会不会',
      '多停留一封信的时间 ^^',
    ]}},
  {id:'grow',
    left:{kicker:'最近好吗',lines:['最近过得好吗？']},
    right:{kicker:'一点欢喜',lines:['也非常开心你能喜欢听我唱歌！']}},
  {id:'together',
    left:{kicker:'被记住',lines:[
      '其实没想到姐姐你能记住我的。',
      '嘿嘿，',
    ]},
    right:{kicker:'一起走过',lines:[
      '我能成为你生活中快乐的一部分，',
      '真是太好啦！',
    ]}},
  {id:'dream',
    left:{kicker:'温柔的风',lines:[
      '愿你在平凡的日子里，',
      '也能遇见温柔的风，',
    ]},
    right:{kicker:'不期而遇',lines:[
      '明亮的时光，',
      '和不期而遇的欢喜。',
    ]}},
  {id:'wish',
    left:{kicker:'带着温暖',lines:['希望我的歌声可以为你带来温暖。']},
    right:{kicker:'下次再见',lines:[
      '今后也请姐姐多多关照啦 ♡',
    ],signature:'Tokirinn'}},
] as const;

export function letterSpreadFor(id:ChapterId):LetterSpread{
  const found=letterSpreads.find(spread=>spread.id===id);
  if(!found)throw new Error('Unknown letter chapter '+id);
  return found;
}
export const LETTER_SOURCE={
  project:'why152/envelope-mvp',video:'4569.mp4',
  originalAuthor:'Tokirinn',date:'2026-10-12',
  mode:'selected verbatim legible passages across ten physical paper leaves',
} as const;
