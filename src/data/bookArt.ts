import type {ChapterId} from './story';

export const planes=['background','midground','lettering','characters','foreground','effects'] as const;

/** Registered sprites share the original composition's 1200×700 coordinates. */
export const actingScenes: Readonly<Record<ChapterId,readonly string[]>>={
  hello:['rabbit','fox'],
  grow:['rabbit','fox','props'],
  together:['fox','rabbit','props'],
  dream:['rabbit','fox','props'],
  wish:['fox','rabbit','props'],
};

export const coverArt='assets/v2/cover-art.svg';
