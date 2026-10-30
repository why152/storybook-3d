# Live AWS release — 2026-10-26 JST

URL: https://storybook.35-76-143-76.sslip.io/

Deployed source: `e964c93aa09d78d956db7e0ad6297e61796c5102`, based on stable
preview `8a01eb3`. This release uses the rigid physical book renderer; flexible
paper PR #16 is not included. Later evidence/documentation commits do not
change the deployed application assets.

## Observed checks

- Art manifest: five chapters, 30 original aligned SVG planes; 14 actor sprites
  match their canonical sources.
- ESLint, TypeScript and Vite production build passed.
- Local production build: **29/29 Playwright tests passed** (about 1.5 minutes).
- Deployed HTTPS site: **29/29 of the same tests passed** (about 1.5 minutes).
- **53/53 live files** returned HTTP 200 and matched local SHA256, including
  the actual JS, CSS and all original scene art. See `live-asset-parity.json`.
- Desktop and 390×844 Chromium mobile screenshots, all five chapters, cover
  opening, forward/backward turns, keyboard, real Chromium touch input,
  customization, reduced motion and focus trapping were checked.
- Inspected desktop spread, page-turn poses, settled mobile HELLO and sampled
  frames from actual browser video. See the PNGs and
  `online-cover-forward-backward.webm` in this directory.

`qa-readiness.json` contains ten fixed viewport/chapter observations. Its rAF
numbers describe this browser environment, not real iPhone GPU performance.
Screenshots of a turn are transient poses, not a settled-layout approval.

## Deployment trace

- Instance: `i-0b300790a7ff20cd9`, Tokyo; actual IP rechecked as `35.76.143.76`.
- Profile: existing `sillytavern-admin`; no IAM change or Amplify app created.
- Preflight SSM: `6d403ae8-9e35-4670-bfb6-c235d5713354` — Success.
- Release SSM: `c11bdcc8-ba0e-4379-b20d-d2083aed05b1` — Success.
- Post-release SSM: `42d48191-bc61-45b8-994b-d64e7268f82d` — Success.
- Archive SHA256:
  `475c212285f021f85894741401f564c4c940512873f75dc32547dc714cb94c99`.
- Remote archive and all 55 release files verified before link switch.
- Caddy validated and hot reloaded. Its previous whole-file SHA256 was
  `b70e84502f5d7774ff4ec2a82a9d63350e6f469ad93bec319ee8e31585f3890d`.
- Backup: `/opt/sillytavern-local/caddy/config/sites/storybook-3d/Caddyfile.before-e964c93aa09d78d956db7e0ad6297e61796c5102`.
- `current` points to `releases/e964c93aa09d78d956db7e0ad6297e61796c5102`.
- Temporary encrypted private S3 object and bucket deleted after transfer;
  local signed-URL request file removed.

## Existing services after release

| Entry | HTTP / state |
| --- | --- |
| Tavern root | 302; container healthy |
| Envelope `/4568`, `/4569` | 200, 200; service and proxy socket active |
| Birthday paper theater | 200 |
| Retired envelope admin | 410 |
| Storybook | 200 with valid HTTPS |

Caddy start time stayed `2026-09-08T13:06:49.229457898Z`; tavern stayed
`2026-10-11T03:47:19.110128167Z`. No Docker/container restart, new listening
port, security-group change or existing site-block replacement was performed.
This checks their public entries and service state, not private chat contents.

## Remaining review

Actual iPhone Safari, real-device performance and owner art direction review
remain pending. Paper is rigid; professional illustration refinement and
flexible paper remain separate work. Personalized text is in-memory and
resets on refresh. Deployment is complete; the combined preview/real-phone
Notion task must remain **待验证** until device feedback is received.

For repeatable checks and rollback, see [AWS deployment](../../AWS_DEPLOYMENT.md).
