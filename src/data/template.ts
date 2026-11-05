export type MusicTrack=Readonly<{
  src:string;
  title:string;
  author:string;
  source:string;
  license:string;
  licenseUrl:string;
  changes?:string;
}>;

export const defaultMusic:MusicTrack={
  src:'audio/the-long-way-home.mp3',
  title:'The Long Way Home',
  author:'Scott Buckley',
  source:'https://www.scottbuckley.com.au/library/the-long-way-home/',
  license:'CC BY 4.0',
  licenseUrl:'https://creativecommons.org/licenses/by/4.0/',
  changes:'音量下调、重新编码',
};

export type TemplateEdition=Readonly<{
  title:string;
  subtitle:string;
  author:string;
  cover?:string;
  music:MusicTrack|null;
}>;
