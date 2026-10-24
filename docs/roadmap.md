# Roadmap and acceptance

## P0 — project bootstrap
Deliver Vite + React + TypeScript skeleton; R3F canvas; GSAP installed; typed scene config with placeholder story; lint/typecheck/build scripts; README run commands.
**Accept:** clean install and build, app opens, sample scene data displayed.

## P1 — flip engine
Implement book cover, at least three interior story pages, dual-sided surfaces, reversible turn, stable page ordering, camera composition and input lock during animation.
**Accept:** 0/25/50/75/100% turn states are correct; no mirrored text or z-fighting; next/previous works repeatedly; reload resets deterministically.

## P2 — high-fidelity layered illustration
Parallax planes associated with each leaf, animation timeline and entrance/exit moments. Add original layered image assets (once approved) and custom shader only if visibly necessary.
**Accept:** illustrated layers visibly move with appropriate local depth while pages turn; animation does not drift or pop; screenshots/videos compare against reference.

## P3 — customization demonstration
Make name, message, chosen image and theme change from one configuration (or a lightweight local control panel), without source code edits to the renderer. Persisting real customer data is out of scope.
**Accept:** two visibly different story variants render using the same engine; no HTML injection; long Chinese text handles overflow.

## P4 — responsive and quality gate
Touch/keyboard, portrait and landscape checks, reduced motion, loading feedback and static fallback.
**Accept:** tested desktop browser and phone-sized viewport, record FPS/load observations and known limitations; build/typecheck/lint pass.

## Future (not Demo scope)
Admin templates, accounts and order management, customer media uploads, DB, immutable published revisions, private-share links, payments, video export and privacy/retention policies.

## Workflow
Each P-stage may have one or more GitHub Issues and PRs. Avoid prematurely merging an all-in-one implementation. Mark tasks complete only after user-reviewed visual proof.
