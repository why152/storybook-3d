import type { Chapter } from './story';

/**
 * Source: the NON-birthday handwritten letter in envelope-mvp/reference/4569.mp4,
 * originally written and signed by Tokirinn, 2026-10-12.
 * The OTHER video, 4568.mp4, ends in '生日快乐。' and is deliberately excluded.
 *
 * These are carefully selected legible passages from the original handwritten
 * still frame, arranged across five page turns. They are NOT an invented message
 * from the website owner; the recipient's private nickname is not published.
 *
 * Some handwritten connecting sentences are ambiguous at 512×910 and are NOT
 * silently reconstructed. See docs/LETTER_4569_SOURCE.md.
 */
export const letterChapters:readonly Chapter[]=[
  {
    id:'hello',label:'LETTER 01',word:'HELLO',eyebrow:'a letter to you',
    title:'见字如面，展信舒颜！',
    description:'当你读到这封信的时候，我在你们世界会不会多停留一封信的时间^^。',
    accent:'#E79073'
  },
  {
    id:'grow',label:'LETTER 02',word:'GROW',eyebrow:'how have you been?',
    title:'最近过得好吗？',
    description:'也非常开心你能喜欢听我唱歌！',
    accent:'#78A48B'
  },
  {
    id:'together',label:'LETTER 03',word:'TOGETHER',eyebrow:'a little happiness',
    title:'能被你记住，真的很开心。',
    description:'我能成为你生活中快乐的一部分，真是太好啦！',
    accent:'#D39B74'
  },
  {
    id:'dream',label:'LETTER 04',word:'DREAM',eyebrow:'small beautiful moments',
    title:'愿你在平凡的日子里',
    description:'也能遇见温柔的风，明亮的时光，和不期而遇的欢喜。',
    accent:'#869CC3'
  },
  {
    id:'wish',label:'LETTER 05',word:'WISH',eyebrow:'with warmth',
    title:'希望我的歌声可以为你带来温暖。',
    description:'今后也请姐姐多多关照啦 ♡',
    accent:'#DD9B99'
  }
] as const;

export const LETTER_SOURCE={
  project:'why152/envelope-mvp',
  video:'4569.mp4',
  originalAuthor:'Tokirinn',
  date:'2026-10-12',
  mode:'selected passages; one bridging heading is an editorial summary',
} as const;
