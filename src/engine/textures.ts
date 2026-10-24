import { CanvasTexture, SRGBColorSpace } from 'three';
import type { StoryPage } from '../data/story';

export type TextureLayer = 'background' | 'art' | 'foreground' | 'back';

const W = 1024;
const H = 700;

function ellipse(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 === 0 ? size : size * 0.45;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function person(ctx: CanvasRenderingContext2D, x: number, y: number, shirt: string, hair: string, flip = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -1 : 1, 1);
  ellipse(ctx, 0, 92, 47, 70, shirt);
  rect(ctx, -30, 142, 19, 51, 9, '#4A586B');
  rect(ctx, 10, 142, 19, 51, 9, '#4A586B');
  ellipse(ctx, 0, 3, 45, 51, '#F6C29F');
  ellipse(ctx, 0, -21, 47, 35, hair);
  ellipse(ctx, 32, -3, 12, 33, hair);
  ellipse(ctx, -13, 13, 4, 5, '#44343B');
  ellipse(ctx, 16, 13, 4, 5, '#44343B');
  ctx.beginPath();
  ctx.arc(2, 26, 10, 0.1, Math.PI - 0.1);
  ctx.strokeStyle = '#B66B6E'; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}

function drawBase(ctx: CanvasRenderingContext2D, page: StoryPage) {
  ctx.fillStyle = page.paper;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(755, 260, 20, 755, 260, 600);
  glow.addColorStop(0, 'rgba(255,255,255,.23)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.10;
  ellipse(ctx, 912, 68, 205, 115, '#FFFFFF');
  ellipse(ctx, 84, 640, 242, 105, '#FFFFFF');
  ctx.globalAlpha = 1;

  ctx.strokeStyle = page.ink;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, W - 64, H - 64);
  ctx.globalAlpha = 1;

  ctx.fillStyle = page.ink;
  ctx.font = '700 24px system-ui, sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText(page.chapter, 79, 90);
  ctx.letterSpacing = '0px';
  ctx.font = 'bold 67px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(page.title, 79, 173, 875);
  ctx.globalAlpha = 0.7;
  ctx.font = '29px "Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.fillText(page.message, 81, 630, 845);
  ctx.globalAlpha = 1;
  ctx.fillStyle = page.accent;
  rect(ctx, 80, 198, 92, 6, 3, page.accent);
}

function drawGift(ctx: CanvasRenderingContext2D) {
  ellipse(ctx, 548, 511, 200, 25, 'rgba(66,47,58,.15)');
  ctx.save();
  ctx.translate(545, 405);
  ctx.rotate(-0.12);
  rect(ctx, -149, -48, 300, 184, 20, '#A54F58');
  rect(ctx, -167, -74, 334, 66, 14, '#D98B79');
  rect(ctx, -26, -75, 52, 213, 7, '#F6DFB6');
  ellipse(ctx, -49, -91, 77, 42, '#F6DFB6');
  ellipse(ctx, 49, -91, 77, 42, '#F6DFB6');
  ellipse(ctx, 0, -81, 26, 24, '#F0C880');
  ctx.restore();
}

function drawMeeting(ctx: CanvasRenderingContext2D) {
  ellipse(ctx, 765, 282, 91, 91, '#F3B36D');
  rect(ctx, 0, 475, 1024, 88, 0, '#80A49A');
  rect(ctx, 0, 554, 1024, 48, 0, '#5C7D84');
  person(ctx, 446, 347, '#B96463', '#594B5C');
  person(ctx, 628, 351, '#729C9A', '#544E45', true);
  ellipse(ctx, 532, 408, 8, 9, '#DB706B');
  star(ctx, 531, 307, 18, '#FFF4C9');
}

function drawNight(ctx: CanvasRenderingContext2D) {
  ellipse(ctx, 784, 299, 77, 77, '#FAE1A1');
  ellipse(ctx, 819, 270, 78, 74, '#476582');
  for (const [x,y,s] of [[281,291,11],[381,384,8],[576,280,16],[875,467,14],[710,401,8],[310,455,8]]) {
    star(ctx,x,y,s,'#F5DFA7');
  }
  ellipse(ctx, 540, 560, 330, 66, '#6F90A1');
  person(ctx, 480, 346, '#DE9B83', '#384B61');
  person(ctx, 602, 352, '#E2BC77', '#384B61', true);
}

function drawBirthday(ctx: CanvasRenderingContext2D) {
  ellipse(ctx, 564, 551, 236, 27, '#89A89C');
  rect(ctx, 352, 455, 408, 70, 14, '#F7E3C4');
  rect(ctx, 404, 354, 304, 110, 18, '#FFF5E1');
  rect(ctx, 404, 434, 304, 27, 10, '#E8A3A1');
  rect(ctx, 447, 334, 15, 32, 6, '#DD937D');
  rect(ctx, 545, 334, 15, 32, 6, '#DD937D');
  rect(ctx, 643, 334, 15, 32, 6, '#DD937D');
  ellipse(ctx, 454, 326, 10, 18, '#F4C36A');
  ellipse(ctx, 552, 326, 10, 18, '#F4C36A');
  ellipse(ctx, 650, 326, 10, 18, '#F4C36A');
  star(ctx, 286, 355, 28, '#F3D69B');
  star(ctx, 805, 395, 24, '#F3D69B');
}

function drawForeground(ctx: CanvasRenderingContext2D, page: StoryPage) {
  const confetti = page.scene === 'birthday';
  for (const [x,y,s] of [[225,288,18],[829,220,25],[300,508,11],[870,541,13],[708,240,9]]) {
    star(ctx, x, y, s, confetti ? '#D28476' : '#FFEECC');
  }
  if (confetti) {
    for (let i = 0; i < 21; i++) {
      ctx.save();
      ctx.translate(200 + ((i * 129) % 665), 240 + ((i * 87) % 315));
      ctx.rotate(i * 0.62);
      rect(ctx, -5, -12, 10, 24, 3, i % 3 === 0 ? '#DB837B' : i % 3 === 1 ? '#E7B774' : '#8FB1A4');
      ctx.restore();
    }
  } else {
    ellipse(ctx, 268, 525, 24, 24, 'rgba(255,255,255,.47)');
    ellipse(ctx, 845, 448, 18, 18, 'rgba(255,255,255,.55)');
  }
}

function drawBack(ctx: CanvasRenderingContext2D, page: StoryPage) {
  ctx.fillStyle = page.paper; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = page.accent; ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, W - 108, H - 108);
  ellipse(ctx, 512, 323, 158, 158, page.accent);
  star(ctx, 512, 323, 80, '#FFF3D9');
  ctx.textAlign = 'center';
  ctx.fillStyle = page.ink;
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.fillText('A LITTLE STORY', 512, 563);
}

export function createPageTexture(page: StoryPage, layer: TextureLayer): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable');

  if (layer === 'background') drawBase(ctx, page);
  else if (layer === 'back') drawBack(ctx, page);
  else if (layer === 'foreground') drawForeground(ctx, page);
  else {
    switch (page.scene) {
      case 'gift': drawGift(ctx); break;
      case 'meeting': drawMeeting(ctx); break;
      case 'night': drawNight(ctx); break;
      case 'birthday': drawBirthday(ctx); break;
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
