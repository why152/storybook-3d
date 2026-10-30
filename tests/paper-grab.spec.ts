import {expect,test} from '@playwright/test';

test('mouse grip follows the paper both directions, waits while held, then cancels',async({page})=>{
  await page.goto('/?scene=grow');
  const book=page.locator('.book-viewport');
  const rect=(await book.boundingBox())!;
  const y=rect.y+rect.height*.66;
  const origin=rect.x+rect.width*.89;
  await page.mouse.move(origin,y);
  await page.mouse.down();
  await expect(book).toHaveAttribute('data-grab-active','true');
  await page.mouse.move(origin-rect.width*.34,y,{steps:4});
  const leaf=page.locator('.book-turn-leaf.is-flexible');
  await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeGreaterThan(.57);
  // More than the old GSAP autoplay duration, but this sheet MUST stay held.
  await page.waitForTimeout(1550);
  await expect(leaf).toHaveCount(1);
  const far=Number(await leaf.getAttribute('data-progress'));
  await page.mouse.move(origin-rect.width*.035,y,{steps:5});
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeLessThan(.12);
  expect(far).toBeGreaterThan(.55);
  await page.mouse.up();
  await expect(leaf).toHaveCount(0,{timeout:20000});
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
  await expect(book).not.toHaveAttribute('data-grab-active','true');
});

test('release over center advances a page, reverse left-to-right grip returns it',async({page})=>{
  await page.goto('/?scene=grow');
  const book=page.locator('.book-viewport');
  const bounds=(await book.boundingBox())!;
  const y=bounds.y+bounds.height*.65;
  const right=bounds.x+bounds.width*.86;
  await page.mouse.move(right,y);
  await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width*.23,y,{steps:8});
  const leaf=page.locator('.book-turn-leaf.is-flexible');
  await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeGreaterThan(.85);
  await page.mouse.up();
  await expect(leaf).toHaveCount(0,{timeout:20000});
  await expect(page.locator('.book-static .page-surface[data-chapter="together"]')).toHaveCount(2);
  const left=bounds.x+bounds.width*.13;
  await page.mouse.move(left,y);
  await page.mouse.down();
  await page.mouse.move(bounds.x+bounds.width*.81,y,{steps:8});
  await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeLessThan(.15);
  await page.mouse.up();
  await expect(leaf).toHaveCount(0,{timeout:20000});
  await expect(page.locator('.book-static .page-surface[data-chapter="grow"]')).toHaveCount(2);
});

test('mobile touch pointer can reverse course before letting go',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/?scene=hello');
  const book=page.locator('.book-viewport');
  const rect=(await book.boundingBox())!;
  const pos=(fraction:number)=>rect.x+rect.width*fraction;
  const y=rect.y+rect.height*.66;
  const id=39;
  const signal=async(type:string,x:number)=>book.dispatchEvent(type,{
    pointerId:id,pointerType:'touch',isPrimary:true,
    button:0,buttons:type==='pointerup'?0:1,clientX:x,clientY:y,
    bubbles:true,cancelable:true
  });
  await signal('pointerdown',pos(.88));
  await signal('pointermove',pos(.54));
  const leaf=page.locator('.book-turn-leaf.is-flexible');
  await expect(leaf).toHaveAttribute('data-texture-ready','true',{timeout:30000});
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeGreaterThan(.5);
  await signal('pointermove',pos(.84));
  await expect.poll(async()=>Number(await leaf.getAttribute('data-progress'))).toBeLessThan(.2);
  await signal('pointerup',pos(.84));
  await expect(leaf).toHaveCount(0,{timeout:20000});
  await expect(page.locator('.book-static .page-surface[data-chapter="hello"]')).toHaveCount(2);
  await expect(book).toBeVisible();
});
