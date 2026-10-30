# Birthday share-link milestone (isolated from the page-curl experiment)

## What this delivers
- A versioned, stateless `#gift=` URL carries the recipient's name and final-page wish in UTF-8.
- A new visitor starts from the actual portrait cover, turns through the unchanged five-spread book, and sees the personalized WISH page.
- Reloads and visits from another browser retain the greeting without a login, cookies or a database.
- The editor exposes a selectable URL and a clipboard-copy button, with an accessible status message and manual-copy fallback.
- Invalid, future-version and oversized fragments fail closed to the normal default greeting.
- Query parameters used by screenshot/debug routes are deliberately excluded from generated share links.

## Scope and privacy
The fragment is not sent to the web server as part of the HTTP request. However, base64url is an *encoding, not encryption*: anyone who obtains the full link can recover its text. Do not put secrets or sensitive personal information in a wish. Copying the URL into apps, browser extensions or analytics may disclose the text to those clients.

This is not a database-backed publishing service. URLs will continue to work *only while the site remains reachable at the same host/path* and the v1 decoder remains supported. It cannot revoke an already-distributed link. There is no editor account, server storage, uploads, payments, or public listing.

## Acceptance
- `npm run lint && npm run typecheck && npm run build`
- `npx playwright test tests/sharing.spec.ts tests/navigation-stress.spec.ts`
- Desktop and 390×844 mobile editor; Chinese + emoji + newline, fresh visit, full sequential book navigation, reload; malformed/unsupported fragments.
- Confirm ordinary cover, physical page-turn poses and original artworks remain unchanged: this branch does not edit `Book.tsx` or `SceneArt.tsx`.

## Integration guardrails
Branch from 2026-10-25 stable `main`. Do not merge or deploy this PR over the unfinished PR #19/#20 paper experiments. Rebase/cherry-pick only after their results are verified. Visual acceptance of the new renderer remains independent from successful share-link tests.
