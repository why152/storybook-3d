import { expect,test } from '@playwright/test';
const ids=['hello','grow','together','dream','wish'] as const;
const left=[
['见字如面，展信舒颜！'],
['最近过得好吗？'],
['其实没想到姐姐你能记住我的。','嘿嘿，'],
['愿你在平凡的日子里，','也能遇见温柔的风，'],
['希望我的歌声可以为你带来温暖。'],
];
const right=[
['当你读到这封信的时候，','我在你们世界会不会','多停留一封信的时间 ^^'],
['也非常开心你能喜欢听我唱歌！'],
['我能成为你生活中快乐的一部分，','真是太好啦！'],
['明亮的时光，','和不期而遇的欢喜。'],
['今后也请姐姐多多关照啦 ♡'],
];

test('4569 ordinary blessing occupies ten real book leaves, left and right, without birthday contamination',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?story=letter');
  await expect(page.locator('.v2-letter-edition')).toHaveCount(1);
  await expect(page.locator('.v2-cover .cover-edition')).toHaveText('WORDS FROM A FRIEND');
  await expect(page.locator('.v2-cover .cover-main-title')).toContainText('letter');
  for(let i=0;i<ids.length;i++){
    await page.goto('/?story=letter&scene='+ids[i]);
    const leaves=page.locator('.book-static .page-surface[data-chapter="'+ids[i]+'"]');
    await expect(leaves).toHaveCount(2);
    const l=leaves.filter({has:page.locator('.letter-leaf[data-letter-side="left"]')}).locator('.letter-leaf-line');
    const r=leaves.filter({has:page.locator('.letter-leaf[data-letter-side="right"]')}).locator('.letter-leaf-line');
    await expect(l).toHaveText(left[i]);
    await expect(r).toHaveText(right[i]);
    expect((await l.allTextContents()).join('')).not.toContain('生日快乐');
    expect((await r.allTextContents()).join('')).not.toContain('生日快乐');
    const boxes=await leaves.locator('.letter-leaf').evaluateAll(items=>items.map(x=>{
      const frame=x.getBoundingClientRect();
      const inner=x.querySelector('.letter-leaf-body')!.getBoundingClientRect();
      const lines=[...x.querySelectorAll('.letter-leaf-line')].map(y=>y.getBoundingClientRect());
      return {frame:{top:frame.top,bottom:frame.bottom,left:frame.left,right:frame.right},
        inner:{top:inner.top,bottom:inner.bottom},
        lines:lines.map(y=>({top:y.top,bottom:y.bottom,left:y.left,right:y.right}))};
    }));
    expect(boxes).toHaveLength(2);
    for(const item of boxes){
      for(const line of item.lines){
        expect(line.top).toBeGreaterThanOrEqual(item.inner.top-1);
        expect(line.bottom).toBeLessThanOrEqual(item.inner.bottom+1);
        expect(line.left).toBeGreaterThanOrEqual(item.frame.left-1);
        expect(line.right).toBeLessThanOrEqual(item.frame.right+1);
      }
    }
    await page.screenshot({path:'test-results/letter-paper-'+ids[i]+'.png',animations:'disabled'});
  }
  await page.goto('/?scene=wish');
  await expect(page.locator('.book-static .letter-leaf')).toHaveCount(0);
  await expect(page.locator('.book-static .page-quote h2').first()).toContainText('生日快乐');
});

test('letter turns from physical right print to next left print with text moving on the sheet',async({page})=>{
  await page.goto('/?story=letter&scene=hello');
  await page.getByRole('button',{name:'下一页'}).click();
  const leaf=page.locator('.book-turn-leaf');
  await expect(leaf).toHaveCount(1);
  await expect(leaf.locator('.paper-source-pair')).toHaveCount(0); // separate source, not inside leaf
  await expect(page.locator('.paper-source[data-print="front"] .letter-leaf')).toContainText('当你读到这封信的时候');
  await expect(page.locator('.paper-source[data-print="back"] .letter-leaf')).toContainText('最近过得好吗');
  await expect(leaf).toHaveCount(0,{timeout:20000});
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});
