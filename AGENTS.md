# Codex / agent guidance

## Mission
Implement a high-fidelity **3D interactive storybook Demo** with data-driven content and original layered artwork. Keep the Demo small and shippable.

## Working agreements
1. Read `README.md`, `docs/architecture.md`, `docs/art-direction.md`, and `docs/roadmap.md` before modifying the project.
2. Work from an assigned GitHub Issue; use a focused branch and PR. Keep `main` runnable.
3. Prefer Vite + React + TypeScript + React Three Fiber + Three.js + GSAP. Avoid adding a framework, paid dependency, backend, auth, database, or Rive without a documented need.
4. Start with placeholder geometry and art. Prioritize page pivot, front/back orientation, z-ordering, visibility and transition state over polishing textures.
5. Implement scene content in typed data objects, separated from the WebGL scene graph. Names, messages and assets must be replaceable.
6. Do not copy source code or image assets from the reference commercial website, or from unlicensed example repositories. Review package licenses before bringing in code/assets.
7. Keep user-supplied images and personal content out of logs and public URLs; never commit secrets. No real customer uploads in the Demo.
8. Respect accessibility: keyboard actions, reduced-motion preference, fallback for unavailable WebGL, sensible touch targets.
9. Aim for reliable rendering on desktop first; test at least one phone-like viewport. Avoid unbounded textures or per-frame allocations.
10. Before PR: run typecheck, lint, build and applicable tests; include screenshots/video plus known gaps when possible. Do not claim a browser-verified interaction unless it was actually tested.

## Milestone order
- P0: scaffold, typed scene data and test/build tooling.
- P1: dual-sided 3D page-turn engine with navigation.
- P2: layered parallax, animation timeline, original scene assets.
- P3: customization via config and responsive/performance validation.

## Definition of done for a task
- Acceptance criteria in the issue are demonstrably met.
- Build and typecheck pass, or failures are reported accurately.
- No secrets, copied copyrighted artwork, or unlicensed code.
- Relevant docs updated and limitations recorded in PR.

## Communication
Prefer short design notes before complex changes. Ask for decisions only when behavior, copyright, or architecture is genuinely ambiguous. Otherwise implement the smallest verified slice.
