/** A developable strip: fixed spine, constant paper length, no stretching.
 * Tangents stay between 0 and pi, so the sheet cannot enter the underlays.
 * Reverse navigation traverses exactly the same surface in reverse time.
 */
export const PAPER_SEGMENTS = 20;

export function paperGeometry(progress: number, count = PAPER_SEGMENTS) {
  const p = Math.max(0, Math.min(1, progress));
  const theta = Math.PI * p;
  const bend = 1.15 * Math.sin(theta);
  let x = 0;
  let z = 0;
  return Array.from({length: count}, (_, index) => {
    const angle = bend * (index + .5) / count;
    const segment = {x, z, angle, length: 1 / count};
    x += Math.cos(angle) / count;
    z -= Math.sin(angle) / count;
    return segment;
  });
}

/** Only the strip transforms change per frame; React and artwork stay still. */
export function posePaper(leaf: HTMLElement, progress: number) {
  // clientWidth rounds subpixels, stretching the print at fractional layouts.
  const width = parseFloat(getComputedStyle(leaf).width);
  const segments = leaf.querySelectorAll<HTMLElement>('.paper-segment');
  const geometry = paperGeometry(progress, segments.length);
  segments.forEach((segment, index) => {
    const {x, z, angle} = geometry[index];
    segment.style.transform = `translate3d(${x * width}px,0,${z * width}px) rotateY(${angle}rad)`;
    segment.style.width = `${width / segments.length}px`;
    segment.querySelectorAll<HTMLElement>('.paper-print').forEach((print, side) => {
      print.style.width = `${width}px`;
      // Symmetric subpixel coverage hides compositor antialias cracks.
      // The print offset compensates it on BOTH faces; no stretched artwork.
      print.style.left = `${.75 - (side ? segments.length - 1 - index : index) * width / segments.length}px`;
    });
    const theta = Math.PI * progress;
    const bend = 1.15 * Math.sin(theta);
    const shade = (edge: number) => (1 - Math.abs(Math.cos(-theta + bend * edge / segments.length))) * .22;
    segment.style.setProperty('--shade-start', String(shade(index)));
    segment.style.setProperty('--shade-end', String(shade(index + 1)));
  });
}
