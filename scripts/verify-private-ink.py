"""Verify raw crop registration against a decoded source frame (requires Pillow)."""
import json
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageChops

if len(sys.argv) != 4:
    raise SystemExit('Usage: python3 scripts/verify-private-ink.py FRAME PRIVATE_SOURCE_MAP CROP_DIRECTORY')
frame, mapping, directory = [Path(arg).resolve() for arg in sys.argv[1:]]
checkout = Path(__file__).resolve().parent.parent
common = Path(subprocess.check_output(['git', '-C', str(checkout), 'rev-parse', '--git-common-dir'], text=True).strip())
if not common.is_absolute():
    common = (checkout / common).resolve()
for target in [frame, mapping, directory]:
    if any(target.is_relative_to(root) for root in [checkout, common.parent]):
        raise SystemExit('Private source images/maps must remain outside the public checkout.')
source = Image.open(frame).convert('RGB')
segments = json.loads(mapping.read_text())['segments']
for segment in segments:
    crop = segment['crop']
    expected = source.crop((crop['x'], crop['y'], crop['x'] + crop['width'], crop['y'] + crop['height']))
    actual = Image.open(directory / (segment['id'] + '.png')).convert('RGB')
    if expected.size != actual.size or ImageChops.difference(expected, actual).getbbox() is not None:
        raise SystemExit('FAIL: original crop pixels differ for ' + segment['id'])
print(f'PASS {len(segments)} / {len(segments)} raw crops match the complete decoded source frame pixel-for-pixel.')
