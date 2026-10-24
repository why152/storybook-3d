# Technical architecture — reference-fidelity reboot

## First principles
The user-approved target is the **original reference video**, not the earlier R3F prototype. The latter has been abandoned on the new branch because it focused on a physical stack of pages, contrary to the reference's primary visual language.

## Stage and flip
- Full-viewport dark textured exhibition, tiny centered title, hand-drawn side arrows, navigation dots.
- Single high-quality, strongly colored rounded editorial artwork. Portrait cover on the same stage.
- CSS 3D `perspective`, preserve-3d layers and backface visibility. The animated leaf contains front and reverse faces.
- GSAP controls reversible `rotationY`; input lock prevents overlapping page changes. No WebGL for this first visual pass.

## Art direction
- Flat illustrated character design, big custom-looking display typography, layered foreground/background and paper grain.
- Distinct per-scene palettes. All art is original SVG that can later be exported to layered assets.
- Foreground, headline and background are separated by deliberate `translateZ` offsets and ambient motion.
- Beware: `overflow: hidden` on preserve-3d ancestors can flatten 3D children; clip individual flat layers where necessary.

## State
Scene list and recipient/wish variables currently live together in App.tsx to minimize integration overhead. This is deliberate for the **single-transition** visual spike; split to a typed `data/scenes.ts` model and reusable illustration components after acceptance.

## Validation
- Desktop reference: screenshot with main card filling the center ~62% viewport width and height ~62%; adjacent handmade arrows.
- Record and compare normalized flip phases 0%, 25%, 50%, 75%, 100% against the reference footage.
- Confirm non-mirrored back content, plausible oblique depth, no paper clipping/visual popping.
- Test portrait mobile layout and keyboard/touch/reduced-motion.
- CI includes lint, typecheck, build and Playwright captures; visual acceptance requires an actual human review and cannot be inferred from CI passing.

## Out of scope
Commercial users, payment, login, accounts, customer uploads, persistence, template designer, video export, public publishing.

## Safety and licensing
No copied source or protected illustrations from the reference video or unlicensed repositories; only original artwork and dependencies with viable commercial terms.
