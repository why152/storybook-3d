import type {HandwritingFragment} from './handwritingTypes';

// Owner authorized these 12 reviewed fragments for the public site/repository
// on 2026-11-02. Source video, complete frame and provenance remain private.
export const publishedHandwriting:readonly HandwritingFragment[]=[
  {
    "id": "address",
    "chapter": "hello",
    "side": "left",
    "left": 12,
    "top": 17,
    "width": 40,
    "alt": "原信手写片段，请以原迹为准。",
    "order": 0,
    "src": import.meta.env.BASE_URL+'handwriting/address.png'
  },
  {
    "id": "greeting",
    "chapter": "hello",
    "side": "left",
    "left": 12,
    "top": 34,
    "width": 76,
    "alt": "见字如面，展信舒颜！",
    "order": 1,
    "src": import.meta.env.BASE_URL+'handwriting/greeting.png'
  },
  {
    "id": "opening",
    "chapter": "hello",
    "side": "right",
    "left": 10,
    "top": 21,
    "width": 80,
    "alt": "原信手写片段，请以原迹为准。",
    "order": 2,
    "src": import.meta.env.BASE_URL+'handwriting/opening.png'
  },
  {
    "id": "recent",
    "chapter": "grow",
    "side": "left",
    "left": 9,
    "top": 16,
    "width": 76,
    "alt": "原信手写片段，请以原迹为准。",
    "order": 3,
    "src": import.meta.env.BASE_URL+'handwriting/recent.png'
  },
  {
    "id": "singing",
    "chapter": "grow",
    "side": "right",
    "left": 13,
    "top": 18,
    "width": 73,
    "alt": "喜爱，也非常开心你能喜欢听我唱歌！",
    "order": 4,
    "src": import.meta.env.BASE_URL+'handwriting/singing.png'
  },
  {
    "id": "remember",
    "chapter": "together",
    "side": "left",
    "left": 8,
    "top": 17,
    "width": 76,
    "alt": "原信手写片段，请以原迹为准。",
    "order": 5,
    "src": import.meta.env.BASE_URL+'handwriting/remember.png'
  },
  {
    "id": "company",
    "chapter": "together",
    "side": "right",
    "left": 7,
    "top": 16,
    "width": 84,
    "alt": "原信手写片段，请以原迹为准。",
    "order": 6,
    "src": import.meta.env.BASE_URL+'handwriting/company.png'
  },
  {
    "id": "wish-first",
    "chapter": "dream",
    "side": "left",
    "left": 9,
    "top": 16,
    "width": 77,
    "alt": "愿你在平凡的日子里，也能遇见温柔的风、明亮的",
    "order": 7,
    "src": import.meta.env.BASE_URL+'handwriting/wish-first.png'
  },
  {
    "id": "wish-second",
    "chapter": "dream",
    "side": "right",
    "left": 27,
    "top": 22,
    "width": 54,
    "alt": "时光、和不期而遇的欢喜。",
    "order": 8,
    "src": import.meta.env.BASE_URL+'handwriting/wish-second.png'
  },
  {
    "id": "warmth",
    "chapter": "wish",
    "side": "left",
    "left": 10,
    "top": 16,
    "width": 72,
    "alt": "希望我的歌声可以为你带来温暖。",
    "order": 9,
    "src": import.meta.env.BASE_URL+'handwriting/warmth.png'
  },
  {
    "id": "closing",
    "chapter": "wish",
    "side": "right",
    "left": 10,
    "top": 16,
    "width": 63,
    "alt": "今后也请姐姐多多关照啦。",
    "order": 10,
    "src": import.meta.env.BASE_URL+'handwriting/closing.png'
  },
  {
    "id": "signature-date",
    "chapter": "wish",
    "side": "right",
    "left": 64,
    "top": 34,
    "width": 23,
    "alt": "原信手写片段，请以原迹为准。",
    "order": 11,
    "src": import.meta.env.BASE_URL+'handwriting/signature-date.png'
  }
];
