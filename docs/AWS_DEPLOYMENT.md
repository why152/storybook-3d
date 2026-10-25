# AWS preview: existing EC2 and Caddy

The owner selected the existing server method on 2026-10-26 (JST), superseding
an initial Amplify proposal. Source is stable preview `8a01eb3` plus deployment
changes on `codex/aws-ec2-preview`; experimental PR #16 is separate. The birthday
paper theater uses the same static hosting on this server.

## Verified server baseline

- Region: `ap-northeast-1`; instance: `i-0b300790a7ff20cd9`.
- Existing role profile: `sillytavern-admin`; SSM is online.
- Public IP checked at release: `35.76.143.76`.
- Docker Caddy mounts `/opt/sillytavern-local/caddy/config` as `/config`.
- Existing Caddyfile: `/opt/sillytavern-local/caddy/Caddyfile`.
- Before release: tavern HTTP 302, envelope HTTP 200, birthday HTTP 200.
- Caddy started `2026-09-08T13:06:49.229457898Z`; tavern started
  `2026-10-11T03:47:19.110128167Z` and is healthy.

## Independent static release

Hostname: `storybook.35-76-143-76.sslip.io`.
Host root: `/opt/sillytavern-local/caddy/config/sites/storybook-3d`.
Container root: `/config/sites/storybook-3d/current/public`.
Each `releases/<commit>/public` contains only the built site, with `current`
as a relative symlink. Existing site blocks remain intact; append only
[Caddyfile.site](../deploy/Caddyfile.site), validate, then hot reload Caddy.
No new runtime, container, public port, security-group rule or IAM permission
is needed. No backend or persistence is introduced.

## Build and acceptance

```bash
npm ci --no-audit --no-fund
npm run test:assets
npm run test:actors
npm run lint
npm run typecheck
npm run build
STORYBOOK_TEST_PRODUCTION=1 npm run test:e2e
npm run qa:gallery
```

Use normal production mode, base `/`, rather than `--mode pages`.
Production tests refuse to reuse a development server. Inspect
`test-results/review.html`: desktop/mobile stills, 0/25/50/75/100 page poses,
cover opening and continuous forward/backward turn videos. The local
production suite passed 29 tests; actual iPhone Safari review is separate.

Archive `dist` contents under `public/`, plus `REVISION`, `Caddyfile.site` and
a `SHA256SUMS` manifest outside the public directory. Transfer via a temporary
private S3 object with encryption/public-access blocking and a short-lived
presigned GET URL. SSM runs [install-release.sh](../deploy/install-release.sh)
as root with `ARTIFACT_URL`, `ARTIFACT_SHA`, `SOURCE_REV`, `CADDY_SHA`. It verifies
the archive and file hashes, creates the release and updates `current`.
Delete the transfer object and bucket afterward. Never record signed URLs,
session tokens or credentials in Git or Notion.

On the actual HTTPS URL verify all five scenes/assets, navigation,
customization, keyboard/touch and reduced motion. Record source commit,
archive SHA256, SSM command ID, tested URL, old-site status and unchanged
container start times. Passing local tests alone does not prove publication.

## Rollback

For later releases, point `current` back to a verified release; no Caddy
change is needed. For initial removal, remove only the storybook site block,
validate and reload. Never replace the complete Caddyfile with an old backup
without first checking for other projects' subsequent changes. Keep earlier
releases and the pre-release Caddy backup. Do not restart Docker or tavern.

This is a visual demo. Personalized text resets on reload, and shared URLs
open the generic sample book. No Git push automatically updates the server.
