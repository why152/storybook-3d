# Storybook 3D release candidate — 2026-10-30

## Scope
This is an **isolated integration branch** forked from the PR #20 flexible-paper
checkpoint plus PR #22 endpoint experiment. It brings in the already verified
`#gift=` UTF-8 sharing feature from merged PR #21 (main). It **does not**
overwrite the owner's local/home development branches.

The running AWS release at
https://storybook.35-76-143-76.sslip.io/ remains the earlier rigid-page
`e964c93` release until an authenticated deployment is executed and checked.
A passing GitHub build is **not** an AWS deployment.

## Release checks (all mandatory)
- [ ] GitHub branch: original SVG/actor parity, ESLint, TypeScript, production build.
- [ ] Full Chromium and WebKit Playwright suites at fixed desktop and mobile sizes.
- [ ] Original **strict** paper endpoint image thresholds (mean <2/255, changed <4%) at 393px DPR1 and DPR3, both directions. No skipped failed assertions.
- [ ] View original book artwork, native lettering, real cover-opening and forward/reverse WebM; 0/25/50/75/100 turn poses; no reverse-face flashes.
- [ ] Real-device iPhone Safari check for actual smoothness and book geometry; no simulated-viewport FPS claims.
- [ ] New browser visit and same-tab #gift link, Unicode/emoji/multiline wish, reload and keyboard/swipe functionality.
- [ ] Owner visual approval for the *actual* flexible sheet and five-chapter art.
- [ ] Production-grade immutable build, verified file hashes, Caddy config unchanged except intended release symlink; rollback pointer preserved.
- [ ] Actual live HTTPS smoke tests and unchanged status of the existing birthday/tavern services.

## Deployment boundary
This repository's existing [AWS procedure](AWS_DEPLOYMENT.md) uses authorized
AWS credentials plus S3 transfer and EC2 Systems Manager to install a hashed
release on the already running Tokyo server. **This ChatGPT session has GitHub
repository access, not the required AWS/SSM credentials or cloud-execution
connection.** Do not simulate an SSM success or claim a new live release merely
because CI passed. Never commit tokens, AWS credentials or presigned URLs.

If owner chooses an alternative hosting connector, treat that as a new staging
deployment, not the existing AWS hostname. Do not delete previous releases.
Only deploy the exact, checked commit; test deployed artifacts and preserve
the last-known-good `current` symlink for rollback.

## Release decision
**Blocked until the criteria above are demonstrably satisfied.**
PR #21/main share-link CI passed (32 Chromium tests); the later paper renderer
must pass its own full dual-browser QA before the integrated candidate can
advance. The artistic and real-device gates remain independent.
