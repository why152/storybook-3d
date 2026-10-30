# Public preview from GitHub Pages (without EC2 access)

This is a **static preview path** for the original five-chapter bound birthday
storybook. The current stable `main` contains personal `#gift=` links. No
AWS keys, servers, containers, database, or paid build services are required.

## One-time owner actions (GitHub web/mobile)

1. **Review before public visibility.** GitHub can expose *all source, commit
   history, branch history, pull requests, Actions logs and repository docs*.
   This repository contains AWS deployment paths, service descriptions and a
   server hostname in development records. Do not switch to Public without
   accepting that disclosure. GitHub's `Secret scanning` may help, but
   absence of findings does not establish that there is no sensitive content.
2. If comfortable publishing the whole repository, open
   `https://github.com/why152/storybook-3d/settings` and use
   `General → Danger Zone → Change repository visibility → Public`.
   **The owner must perform this visibility change.** Do not assume it has
   happened or publish source from a different account.
3. Open `Settings → Pages`, choose `Source: GitHub Actions`. After the
   `publish-pages.yml` workflow is on `main`, open
   `Actions → Publish verified storybook to GitHub Pages → Run workflow`.
   Future pushes to `main` will redeploy when repository visibility is public.
4. Check the run in Actions. Only after **deploy** succeeds, visit
   `https://why152.github.io/storybook-3d/`. The URL is an expected default,
   **not evidence of an actual live deployment**.
5. Open the cover; visit all 5 original chapter spreads; edit name and wish;
   copy a `#gift=` link; open it in a fresh private window on iPhone and
   confirm the final WISH chapter remains customized; test touch/keyboard.

## Technical notes

- `vite.config.ts` sets `base: '/storybook-3d/'` only for mode `pages`.
  Other modes, including existing EC2 production, keep `/`. SceneArt
  generates image URLs through Vite `BASE_URL` so no illustration requests
  mistakenly hit the origin root.
- The workflow validates original asset/actor parity, lint, TypeScript and
  the **current stable main** Playwright Chromium suite, then builds with
  `npm run build -- --mode pages` and verifies the published path and files.
  Only `dist/` is uploaded as the Pages artifact.
- The root `main` candidate remains the rigid bound-paper baseline, plus
  working shareable birthday links. The unfinished flexible-paper experiments
  in #20/#22/#23 are **not** included or automatically deployed.
- `#gift=` messages live in the URL fragment. They are URL-safe UTF-8
  encoding, **not encryption**; anyone with the link can read the message.
- If you remove the public repository or switch visibility back to private
  on a GitHub Free account, this Pages site becomes unavailable. Previously
  copied content or forks of a public repository cannot be reliably recalled.
- This does not affect `https://storybook.35-76-143-76.sslip.io/` or any
  other running site on the existing EC2 host.

If publishing all of the repository history isn't acceptable, keep it
private and use a hosting service that can build directly from a private repo,
or create a **new clean public static-only publication repository**.

## Public-visibility activation

The owner switched this repository to **Public** on 2026-10-30. The
`publish-pages.yml` workflow deploys only the built `dist/` artifact, and
therefore must run from a new `main` push after visibility was changed.
The GitHub Pages setting `Build and deployment → Source: GitHub Actions`
remains required. A successful Pages deployment and a verified live URL are
independent of a successful CI build.
