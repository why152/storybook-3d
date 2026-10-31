import { expect,test } from '@playwright/test';
const ids=['hello','grow','together','dream','wish'] as const;
const headlines=[
'见字如面，展信舒颜！','最近过得好吗？','能被你记住，真的很开心。',
'愿你在平凡的日子里','希望我的歌声可以为你带来温暖。'
];
test('4569 non-birthday letter is rendered in five coherent spreads, credited and not conflated with birthday',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?story=letter');
  await expect(page.locator('.v2-letter-edition')).toHaveCount(1);
  await expect(page.getByRole('link',{name:/BIRTHDAY EDITION/})).toBeVisible();
  await expect(page.locator('.book-shell.is-closed')).toHaveCount(1);
  for(let i=0;i<ids.length;i++){
    await page.goto('/?story=letter&scene='+ids[i]);
    await expect(page.locator('.book-static .page-surface[data-chapter="'+ids[i]+'"]')).toHaveCount(2);
    const reader=page.getByRole('region',{name:'故事朗读文字'});
    await expect(reader.locator('h2')).toHaveText(headlines[i]);
    await expect(reader.getByText('生日快乐')).toHaveCount(0);
    await expect(reader).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(2);
    await page.screenshot({path:'test-results/v2-letter-'+ids[i]+'.png',fullPage:false,animations:'disabled'});
  }
  await page.goto('/?scene=wish');
  await expect(page.locator('.v2-letter-edition')).toHaveCount(0);
  await expect(page.getByRole('region',{name:'故事朗读文字'}).locator('h2')).toContainText('生日快乐');
});
