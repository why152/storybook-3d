# Stable preview — first shareable storybook demo

This is a **small-audience visual review**, not the finished customizable
storybook service. Its source is the last validated `main` baseline
(`deab92e`), with deployment-only changes on
`preview/stable-storybook`. It intentionally excludes the experimental
flexible paper renderer from Draft PR #16.

## What a visitor can do

- Open a portrait cover and read HELLO → GROW → TOGETHER → DREAM → WISH.
- Turn one physical leaf at a time using arrows, keys, progress dots or swipe.
- See original six-layer chapter illustration and independent character motions.
- Edit the recipient's name and closing message in the browser.
- Read the complete story in a separate caption on small screens.

**Not yet provided:** permanent personal-story URLs, storing greetings,
accounts, payments, content uploads, full user-authored story pages, or the
unfinished flexible-paper experiment. Edits live only in browser memory and
reset when the page reloads; a shared link opens the generic sample book.

## Deployment option A: GitHub Pages

The branch has an Actions workflow:
[Preview — Stable Storybook](../.github/workflows/stable-preview.yml).

The workflow uses a committed lockfile, lint/typecheck, asset parity,
Chromium interaction tests, and a project-subdirectory production build.
It only publishes the result if validation succeeds.

GitHub Pages for **private repositories** requires a GitHub Pro, Team or
Enterprise plan (a GitHub Free personal account would need a separate
public repository, which is NOT automatically authorized here).
Under repo Settings > Pages, set Build and deployment source to
**GitHub Actions**; publication requires that GitHub feature to be enabled.
The conventional Pages address, if actually deployed, is the project URL
`https://why152.github.io/storybook-3d/`. Do not announce that URL as live
until the deployment reports success and it is opened/tested.

This deployment URL is generally **publicly reachable**, even though the
source repository can remain private. Never add private text, credentials,
or real recipient details to the sample.

## Deployment option B: Vercel

Vercel can import a personal GitHub-owned private repository without making
source code public. After authorizing the GitHub integration:

1. Import `why152/storybook-3d` at https://vercel.com/new .
2. Set the production branch to `preview/stable-storybook`, **not** the
   experimental flexible-paper branch.
3. Framework: Vite; install: `npm ci`; build: `npm run build`;
   output: `dist`. Vite's normal root base path remains `/`.
4. Check all five pages, personalization and actual mobile Safari.
5. Copy the **actual URL issued by Vercel**, not an assumed URL.

Deployment protection matters: an unrestricted preview URL is shareable to
anyone who knows it, while Vercel Authentication requires viewer access.
Pick a setting appropriate to the people reviewing the demo.

## Show/review checklist

- [ ] Actual deployment succeeded and the URL opens unauthenticated (if
      deliberately public) or with the intended viewer authentication.
- [ ] Cover opens; all 5 chapters have original artwork and no missing assets.
- [ ] Backward navigation/keyboard/swipe works without page state getting stuck.
- [ ] Recipient editing works and refresh intentionally clears it.
- [ ] iPhone Safari/desktop Safari tested, including slow network.
- [ ] Feedback captured separately from future product requirements.

Do not merge PR #16 just to launch the demo. Continue geometry, browser
compatibility and mathematical optimization in that Draft PR with their own
evidence. The preview is a **stable snapshot**, not a claim of polished art.
