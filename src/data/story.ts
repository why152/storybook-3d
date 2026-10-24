/** A chapter is a complete 1200×700 two-page illustrated spread.
 * The renderer owns the physical left/right split; content stays renderer-free.
 */
export type ChapterId = 'hello' | 'grow' | 'together' | 'dream' | 'wish';
export type Chapter = Readonly<{
  id: ChapterId;
  label: string;
  word: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
}>;
export const chapters: readonly Chapter[] = [
  {id:'hello',label:'CHAPTER 01',word:'HELLO',eyebrow:'it all begins',title:'遇见，是故事的开头。',description:'在无数平凡的日子里，刚好遇见了你。',accent:'#E79073'},
  {id:'grow',label:'CHAPTER 02',word:'GROW',eyebrow:'little by little',title:'慢慢长大，也慢慢发光。',description:'有些美好，需要时间和一点勇气。',accent:'#78A48B'},
  {id:'together',label:'CHAPTER 03',word:'TOGETHER',eyebrow:'the good company',title:'有人同行，路就不远。',description:'不必总是说些什么，并肩走着就很好。',accent:'#D39B74'},
  {id:'dream',label:'CHAPTER 04',word:'DREAM',eyebrow:'beyond the ordinary',title:'愿你永远保持好奇。',description:'世界很大，下一站总会有新故事。',accent:'#869CC3'},
  {id:'wish',label:'CHAPTER 05',word:'WISH',eyebrow:'for someone special',title:'生日快乐，{name}',description:'{wish}',accent:'#DD9B99'},
] as const;

export const totalPositions=chapters.length+1; // cover + five open spreads
export function getChapter(position:number):Chapter {
  const found=chapters[position-1];
  if(!found)throw new RangeError('Invalid story position: '+position);
  return found;
}
export function initialPosition(){
  const params=new URLSearchParams(window.location.search);
  const chapter=chapters.findIndex(x=>x.id===params.get('scene'));
  return chapter<0?0:chapter+1;
}
export function previewPose(){
  const p=new URLSearchParams(window.location.search).get('pose');
  if(p===null)return null;
  const n=Number(p);
  return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0;
}
export function previewFrom(){
  const p=new URLSearchParams(window.location.search).get('from');
  if(p==='cover')return 0;
  const found=chapters.findIndex(ch=>ch.id===p);
  return found>=0&&found<chapters.length-1?found+1:2;
}
