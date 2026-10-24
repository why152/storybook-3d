# Codex / agent guidance

## Mission
Implement a high-fidelity **3D interactive storybook Demo** with data-driven content and original layered artwork. Keep the Demo small and shippable.

## Working agreements
1. Read `README.md`, `docs/architecture.md`, `docs/art-direction.md`, and `docs/roadmap.md` before modifying the project.
2. Work from an assigned GitHub Issue; use a focused branch and PR. Keep `main` runnable.
3. Current visual proof uses Vite + React + TypeScript + CSS 3D + GSAP (no Three.js). Do not reintroduce WebGL solely because earlier documentation mentioned it. Prove a visual need first. Avoid backend, auth, database, paid dependencies or Rive at this stage.
4. Visual fidelity to the supplied card-flip reference is the main gate. Keep a single editorial spread, portrait cover and meaningful depth layers. Treat placeholder art and generic dashboard layouts as unacceptable final visual QA.
5. Implement scene content in typed data objects, separated from the WebGL scene graph. Names, messages and assets must be replaceable.
6. Do not copy source code or image assets from the reference commercial website, or from unlicensed example repositories. Review package licenses before bringing in code/assets.
7. Keep user-supplied images and personal content out of logs and public URLs; never commit secrets. No real customer uploads in the Demo.
8. Respect accessibility: keyboard actions, reduced-motion preference, fallback for unavailable WebGL, sensible touch targets.
9. Aim for reliable rendering on desktop first; test at least one phone-like viewport. Avoid unbounded textures or per-frame allocations.
10. Before PR: run typecheck, lint, build and applicable tests; include screenshots/video plus known gaps when possible. Do not claim a browser-verified interaction unless it was actually tested.

## Milestone order
- P0: read docs/reference-fidelity.md and capture baseline screenshot evidence.
- P1: exact visual composition and dual-sided 3D turnover of one scene.
- P2: deep layer parallax, coordinated entrance/exit and original illustrated assets.
- P3: only after human visual approval, refactor into templates and full customization.

## Definition of done for a task
- Acceptance criteria in the issue are demonstrably met.
- Build and typecheck pass, or failures are reported accurately.
- No secrets, copied copyrighted artwork, or unlicensed code.
- Relevant docs updated and limitations recorded in PR.

## Communication
Prefer short design notes before complex changes. Ask for decisions only when behavior, copyright, or architecture is genuinely ambiguous. Otherwise implement the smallest verified slice.
