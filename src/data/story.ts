/**
 * A small, entirely original demo story.
 * The renderer depends only on this typed data, so future custom stories
 * can swap words, colors and scene motifs without changing page geometry.
 */
export type SceneKind = 'gift' | 'meeting' | 'night' | 'birthday';

export interface StoryPage {
  id: string;
  chapter: string;
  title: string;
  message: string;
  scene: SceneKind;
  paper: string;
  accent: string;
  ink: string;
}

export const demoStory: readonly StoryPage[] = [
  {
    id: 'cover', chapter: 'A LITTLE STORY', title: '给 {name} 的小小故事',
    message: '有些祝福，值得慢慢翻开。', scene: 'gift',
    paper: '#F2C4A5', accent: '#B65F57', ink: '#553F42',
  },
  {
    id: 'meeting', chapter: 'CHAPTER 01', title: '故事的开始',
    message: '世界很大，　但有些相遇总是刚刚好。', scene: 'meeting',
    paper: '#F5D9A8', accent: '#D17A6E', ink: '#5B4945',
  },
  {
    id: 'night', chapter: 'CHAPTER 02', title: '一起看过的星光',
    message: '平凡的每一天，　因为有人同行而闪闪发亮。', scene: 'night',
    paper: '#476582', accent: '#F5CE83', ink: '#FBF0D9',
  },
  {
    id: 'birthday', chapter: 'THE END', title: '生日快乐，{name}',
    message: '{wish}', scene: 'birthday',
    paper: '#C8D9C8', accent: '#C27B66', ink: '#3F554F',
  },
];

export interface StoryVariables {
  name: string;
  wish: string;
}

export const defaultVariables: StoryVariables = {
  name: '你',
  wish: '愿所有的好事，都在下一页等你。',
};

export function resolveText(text: string, variables: StoryVariables): string {
  return text.replace(/\{(name|wish)\}/g, (_, key: keyof StoryVariables) => variables[key]);
}
