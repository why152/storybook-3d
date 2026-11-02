"""Build matched screenshot contact sheets and an offline review (requires Pillow)."""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageChops, ImageStat

root = Path('docs/validation/cover-local')
poses = ['0', '0.25', '0.5', '0.75', '1']
sections = []
parity = []
for engine in ['chromium', 'webkit']:
    for device in ['desktop', 'mobile']:
        width, height = (360, 225) if device == 'desktop' else (260, 270)
        sheet = Image.new('RGB', (width * 5, height * 3 + 28 * 4), '#11141c')
        draw = ImageDraw.Draw(sheet)
        draw.text((10, 6), f'{engine} / {device} / 0 - 25 - 50 - 75 - 100 percent', fill='white')
        videos = []
        for row, target in enumerate(['main', 'pr36', 'corrected']):
            draw.text((10, 28 + row * (height + 28)), target, fill='#f1d2ac')
            for col, pose in enumerate(poses):
                image = Image.open(root / target / f'{engine}-{device}-cover-{pose}.png').convert('RGB')
                # Identical crop in every mobile row; originals remain local.
                if device == 'mobile':
                    image = image.crop((0, 170, 390, 575))
                sheet.paste(image.resize((width, height)), (col * width, 56 + row * (height + 28)))
            video = f'{target}/{engine}-{device}-open-forward-back-close.webm'
            videos.append(f'<figure><figcaption>{target}</figcaption><video controls preload="metadata" src="{video}"></video></figure>')
        name = f'{engine}-{device}-comparison.jpg'
        sheet.save(root / name, quality=90)
        sections.append(f'<section><h2>{engine} · {device}</h2><p>Rows: main → PR #36 → corrected. Columns: 0 / 25 / 50 / 75 / 100%.</p><a href="{name}"><img src="{name}" alt="Matched five-pose cover comparison"></a><div class="videos">'+''.join(videos)+'</div></section>')
        for pose in poses:
            first = Image.open(root / 'main' / f'{engine}-{device}-grow-{pose}.png').convert('RGB')
            last = Image.open(root / 'corrected' / f'{engine}-{device}-grow-{pose}.png').convert('RGB')
            diff = ImageChops.difference(first, last)
            parity.append(dict(engine=engine, device=device, pose=pose, identical=diff.getbbox() is None, mean=sum(ImageStat.Stat(diff).mean)/3))
(root / 'interior-parity.json').write_text(json.dumps(parity, indent=2))
(root / 'review.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cover motion review · 2026-11-02</title><style>
body{margin:0 auto;padding:32px;max-width:1500px;background:#11141c;color:#f5e9da;font:16px/1.6 system-ui}h1{font:36px Georgia}h2{margin-top:48px}a{color:#f1d2ac}img{width:100%}figure{margin:0}video{width:100%;max-height:650px;background:#080a0f}.videos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}figcaption{padding:10px;font-weight:bold}section{border-top:1px solid #514755;margin:32px 0}@media(max-width:700px){body{padding:16px}.videos{grid-template-columns:1fr}}
</style><h1>Cover motion review</h1><p>2026-11-02 · Actual local browser captures · No deployment / no visual sign-off yet.</p><p>Main: 88fcc365. PR #36: 41db2d6. Corrected: hardcover back owns left artwork; paper stack stays on right during cover motion. Interior segmented paper is unchanged.</p><p>Each unedited continuous recording: closed → HELLO → GROW → HELLO → closed. Blank first navigation frames are recording startup, before the book is ready. Mobile contact sheets use the same crop in all three rows; recordings preserve the full viewport.</p><p><a href="README.md">Findings and reproduction</a> · <a href="interior-parity.json">Interior pixel comparison</a></p>'''+''.join(sections)+'</html>')
print(f"Interior parity: {sum(row['identical'] for row in parity)}/20 exact; max mean {max(row['mean'] for row in parity):.6f}/255")
